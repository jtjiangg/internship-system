import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

dotenv.config();

const app=express();
const PORT = process.env.PORT || 5000;

const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized:false
    }
});

// --- AUTO-SETUP DATABASE TABLES ---
const initializeDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Placement_Requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        company_id INT NOT NULL,
        status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Placement_Requests table verified/created successfully.");
  } catch (error) {
    console.error("❌ Failed to create table:", error.message);
  }
};
initializeDB();
// ----------------------------------

// --- CLOUDINARY FILE UPLOAD SETUP ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'internship_logbooks', // Creates a dedicated folder in your Cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'] 
  },
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
    try{
        //see if database responds
        const [rows] = await pool.query('SELECT VERSION()');
        res.send(`API is running! Database connected successfully. MySQL Version: ${rows[0]['VERSION()']}`);
    } catch (error){
        console.error('Database connection failed: ', error);
        res.status(500).send('API is running, but database connection failed.');
    }
});

//registration
app.post('/register', async(req, res) => {
    try{
        //unpack data sent by user
        const{full_name, email, password, role}=req.body;

        //security check: scramble passwords
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        //sql blueprint, use ? as placeholder to avoid SQL injection attacks
        const insertUserQuery = `
            INSERT INTO Users(full_name, email, password, role)
            VALUES(?,?,?,?)
        `;

        //execute the insert
        const [result]= await pool.query(insertUserQuery, [full_name, email, hashedPassword, role]);

        //send success receipt
        res.status(201).json({
            message: 'Account successfully created!',
            userId: result.insertId
        });
    } catch(error){
        console.error('Registration error:', error);
        // If the email already exists, MySQL throws a specific error code
        if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'This email is already registered.' });
        }
        res.status(500).json({ error: 'Failed to register user.' });
    }
});

// --- THE BOUNCER (JWT Middleware) ---
const authenticateToken = (req, res, next) => {
  // 1. Look for the token in the request headers
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Splits "Bearer <token>"

  // 2. If there is no token, kick them out
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Please log in first.' });
  }

  // 3. If there is a token, verify it hasn't been forged or expired
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    
    // 4. Token is valid. Attach the user's ID and Role to the request and let them through
    req.user = user; 
    next(); 
  });
};

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists in the database
    const findUserQuery = `SELECT * FROM Users WHERE email = ?`;
    const [users] = await pool.query(findUserQuery, [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];

    // Check if the password matches the scrambled hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate the VIP Wristband (JWT)
    // We bundle their ID and Role inside the token
    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' } // Token expires in 1 day
    );

    // Send the token and user data back to the frontend
    res.status(200).json({
      message: 'Login successful!',
      token: token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

// --- GET: Fetch Company Directory ---
app.get('/companies', authenticateToken, async (req, res) => {
  try {
    // Pull companies directly from the registered Supervisor accounts so the IDs match perfectly!
    const [rows] = await pool.query(`
      SELECT U.id, 
             CP.company_name AS name, 
             CP.address AS location, 
             'Various Internship Roles' AS roles,
             'Approved SUCCMS Internship Partner' AS description,
             'Industry Partner' AS industry
      FROM Users U
      JOIN Company_Profiles CP ON U.id = CP.user_id
      WHERE U.role = 'Company_Supervisor'
    `);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Fetch companies error:', error);
    res.status(500).json({ error: 'Failed to fetch companies.' });
  }
});

// --- GET: Fetch Logbook History ---
app.get('/logbooks', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId;
    // Fetch logs for this specific student, newest first
    const [rows] = await pool.query(
      'SELECT * FROM Logbooks WHERE student_id = ? ORDER BY date DESC', 
      [studentId]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Fetch logbooks error:', error);
    res.status(500).json({ error: 'Failed to fetch logbook entries.' });
  }
});

// Submit Logbook Route with File Upload
app.post('/logbooks', authenticateToken, upload.single('evidence'), async (req, res) => {
  try {
    if (req.user.role !== 'Student') {
      return res.status(403).json({ error: 'Only students can submit logbooks.' });
    }

    const { date, clock_in, clock_out, task_description } = req.body;
    const studentId = req.user.userId;

    // If a file was uploaded, construct its public URL path
    const evidence_url = req.file ? req.file.path : null;

    const insertLogQuery = `
      INSERT INTO Logbooks (student_id, date, clock_in, clock_out, task_description, evidence_url, hours_worked) 
      VALUES (?, ?, ?, ?, ?, ?, TIMESTAMPDIFF(MINUTE, CONCAT(?, ' ', ?), CONCAT(?, ' ', ?)) / 60.0)
    `;
    
    await pool.query(insertLogQuery, [
      studentId, date, clock_in, clock_out, task_description, evidence_url,
      date, clock_in, date, clock_out
    ]);

    res.status(201).json({ message: 'Logbook entry saved successfully!' });

  } catch (error) {
    console.error('Logbook submission error:', error);
    res.status(500).json({ error: 'Failed to save logbook entry.' });
  }
});

// --- EVALUATOR DASHBOARD ROUTES ---

// 1. Fetch all student logbooks (Evaluators Only)
app.get('/evaluator/logbooks', authenticateToken, async (req, res) => {
  try {
    // Security check: Kick out students
    if (req.user.role === 'Student') {
      return res.status(403).json({ error: 'Unauthorized access.' });
    }
    
    // Join Users table to get the actual student name instead of just their ID
    const query = `
      SELECT L.*, U.full_name AS student_name 
      FROM Logbooks L 
      JOIN Users U ON L.student_id = U.id 
      ORDER BY L.date DESC
    `;
    const [rows] = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Fetch evaluator logbooks error:', error);
    res.status(500).json({ error: 'Failed to fetch logbooks.' });
  }
});

// 2. Update Logbook Status & Comments (Approve/Reject)
app.put('/logbooks/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'Student') {
      return res.status(403).json({ error: 'Unauthorized access.' });
    }
    
    const { status, comments } = req.body; 
    const logbookId = req.params.id;
    
    await pool.query('UPDATE Logbooks SET status = ?, comments = ? WHERE id = ?', [status, comments || null, logbookId]);
    res.status(200).json({ message: `Logbook ${status} successfully.` });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update logbook status.' });
  }
});

// --- SUPER-ADMIN ROUTES ---

// 1. Fetch all users
app.get('/admin/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Super_Admin') {
      return res.status(403).json({ error: 'Super Admin access required.' });
    }
    
    const [rows] = await pool.query(
      'SELECT id, full_name, email, role, created_at FROM Users ORDER BY role, full_name'
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// 2. Delete a user
app.delete('/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Super_Admin') {
      return res.status(403).json({ error: 'Super Admin access required.' });
    }
    
    // Prevent the admin from deleting themselves
    if (parseInt(req.params.id) === req.user.userId) {
      return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    await pool.query('DELETE FROM Users WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// --- GLOBAL RESOURCES ROUTES ---

// Admin: Upload a new resource
app.post('/admin/resources', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'Super_Admin') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }
    const { title, category } = req.body;
    const file_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    if (!file_url) return res.status(400).json({ error: 'File is required.' });

    await pool.query('INSERT INTO Resources (title, category, file_url) VALUES (?, ?, ?)', [title, category, file_url]);
    res.status(201).json({ message: 'Resource uploaded successfully.' });
  } catch (error) {
    console.error('Resource upload error:', error);
    res.status(500).json({ error: 'Upload failed.' });
  }
});

// Admin: Delete a resource
app.delete('/admin/resources/:id', authenticateToken, async (req, res) => {
  try {
     if (req.user.role !== 'Super_Admin') {
       return res.status(403).json({ error: 'Unauthorized.' });
     }
     await pool.query('DELETE FROM Resources WHERE id = ?', [req.params.id]);
     res.status(200).json({ message: 'Deleted successfully.' });
  } catch(error) {
     console.error('Resource delete error:', error);
     res.status(500).json({error: 'Failed to delete.'});
  }
});

// Super Admin: Fetch Company Supervisors for dropdowns & directory
app.get('/admin/supervisors', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Super_Admin') return res.status(403).json({ error: 'Unauthorized' });
    
    // Updated query to pull ALL company profile data for the directory table
    const [rows] = await pool.query(`
      SELECT U.id, U.full_name as supervisor_name, 
             C.company_name, C.company_id_number, C.address, C.company_phone, C.photo_url 
      FROM Users U
      LEFT JOIN Company_Profiles C ON U.id = C.user_id
      WHERE U.role = 'Company_Supervisor'
    `);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Fetch supervisors error:', error);
    res.status(500).json({ error: 'Failed to fetch supervisors.' });
  }
});

//Admin: Create a New User
app.post('/admin/create-user', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (req.user.role !== 'Super_Admin') {
      return res.status(403).json({ error: 'Super Admin access required.' });
    }

    const { 
      full_name, email, role, student_staff_id, contact_number, program,
      company_name, company_id_number, address, company_phone, supervisor_name,
      assigned_company, assigned_supervisor_id, internship_duration // <-- NEW FIELDS
    } = req.body;

    const [existing] = await pool.query('SELECT id FROM Users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already exists.' });

    const hashedPassword = await bcrypt.hash('succms2026', 10);

    // 1. Create the base user (now including assignment fields)
    const [userResult] = await pool.query(`
      INSERT INTO Users (
        full_name, email, password, role, student_staff_id, 
        contact_number, program, assigned_company, assigned_supervisor_id, internship_duration
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      full_name, email, hashedPassword, role, student_staff_id, 
      contact_number, program, 
      assigned_company || null, 
      assigned_supervisor_id || null, 
      internship_duration || null
    ]);

    const newUserId = userResult.insertId;

    // 2. If it's a Company Supervisor, inject the business data
    if (role === 'Company_Supervisor') {
      const photo_url = req.file ? req.file.path : null;
      
      await pool.query(`
        INSERT INTO Company_Profiles (user_id, company_name, company_id_number, address, company_phone, supervisor_name, photo_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [newUserId, company_name, company_id_number, address, company_phone, supervisor_name, photo_url]);
    }

    res.status(201).json({ message: 'User created successfully.' });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// Delete a specific logbook record
app.delete('/admin/logbooks/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Super_Admin') {
      return res.status(403).json({ error: 'Super Admin access required.' });
    }
    
    await pool.query('DELETE FROM Logbooks WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Logbook record permanently deleted.' });
  } catch (error) {
    console.error('Delete logbook error:', error);
    res.status(500).json({ error: 'Failed to delete logbook record.' });
  }
});

// Everyone: View all resources
app.get('/resources', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Resources ORDER BY created_at DESC');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Fetch resources error:', error);
    res.status(500).json({ error: 'Failed to fetch resources.' });
  }
});

// --- PLACEMENT REQUEST ROUTES ---

// 1. Student submits a request
app.post('/placement-requests', authenticateToken, async (req, res) => {
  try {
    const student_id = req.user.userId;
    const { company_id } = req.body;
    
    if (!student_id || !company_id) {
       return res.status(400).json({ error: `Missing Data! Student ID: ${student_id}, Company ID: ${company_id}` });
    }

    // Check if they already have a pending request (Using explicit string literal)
    const [existing] = await pool.query(
      "SELECT * FROM Placement_Requests WHERE student_id = ? AND status = 'Pending'", 
      [student_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You already have a pending placement request.' });
    }

    await pool.query(
      "INSERT INTO Placement_Requests (student_id, company_id, status) VALUES (?, ?, 'Pending')", 
      [student_id, company_id]
    );
    
    res.status(200).json({ message: 'Request submitted successfully.' });
  } catch (error) {
    console.error('Request error:', error);
    res.status(500).json({ error: `Database Error: ${error.message}` });
  }
});

// 2. Admin views pending requests (Removed /api)
app.get('/admin/placement-requests', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Super_Admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    const [rows] = await pool.query(`
      SELECT PR.id, PR.status, PR.created_at,
             S.full_name as student_name, S.email as student_email,
             C.full_name as supervisor_name, CP.company_name
      FROM Placement_Requests PR
      JOIN Users S ON PR.student_id = S.id
      JOIN Users C ON PR.company_id = C.id
      LEFT JOIN Company_Profiles CP ON C.id = CP.user_id
      WHERE PR.status = 'Pending'
    `);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Fetch requests error:', error);
    res.status(500).json({ error: 'Failed to fetch placement requests.' });
  }
});

// 3. Admin approves or rejects request (Removed /api)
app.put('/admin/placement-requests/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'Super_Admin') return res.status(403).json({ error: 'Unauthorized' });
  
  const { status } = req.body; // 'Approved' or 'Rejected'
  
  try {
    const [request] = await pool.query('SELECT * FROM Placement_Requests WHERE id = ?', [req.params.id]);
    if (request.length === 0) return res.status(404).json({ error: 'Request not found.' });

    // Update the request status
    await pool.query('UPDATE Placement_Requests SET status = ? WHERE id = ?', [status, req.params.id]);

    // If approved, automatically update the student's assigned company and supervisor in the Users table
    if (status === 'Approved') {
      const [supervisor] = await pool.query('SELECT CP.company_name FROM Users C LEFT JOIN Company_Profiles CP ON C.id = CP.user_id WHERE C.id = ?', [request[0].company_id]);
      
      await pool.query(
        'UPDATE Users SET assigned_company = ?, assigned_supervisor_id = ? WHERE id = ?',
        [supervisor[0].company_name, request[0].company_id, request[0].student_id]
      );
    }
    
    res.status(200).json({ message: `Placement successfully ${status.toLowerCase()}.` });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Failed to update request.' });
  }
});


// --- FINAL EVALUATION ROUTES ---

// Get all students for evaluation grading
app.get('/evaluator/students', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'Student') return res.status(403).json({ error: 'Unauthorized.' });
    
    // Fetch all students and their current evaluation status
    const query = `
      SELECT U.id, U.full_name, U.email, 
             COALESCE(E.company_score, 0) as company_score, 
             COALESCE(E.company_evaluated, 0) as company_evaluated
      FROM Users U
      LEFT JOIN Evaluations E ON U.id = E.student_id
      WHERE U.role = 'Student'
    `;
    const [rows] = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Fetch students error:', error);
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
});

// Company Supervisor: Submit Final Evaluation
app.post('/evaluator/company-score', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'Student') return res.status(403).json({ error: 'Unauthorized.' });

    const { student_id, score } = req.body;

    const upsertQuery = `
      INSERT INTO Evaluations (student_id, company_score, company_evaluated) 
      VALUES (?, ?, TRUE)
      ON DUPLICATE KEY UPDATE company_score = ?, company_evaluated = TRUE
    `;
    
    await pool.query(upsertQuery, [student_id, score, score]);
    res.status(200).json({ message: 'Evaluation submitted successfully.' });
  } catch (error) {
    console.error('Submit evaluation error:', error);
    res.status(500).json({ error: 'Failed to submit evaluation.' });
  }
});

// Lecturer Supervisor: Submit Final Evaluation
app.post('/evaluator/lecturer-score', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'Student') return res.status(403).json({ error: 'Unauthorized.' });

    const { student_id, score } = req.body;

    const upsertQuery = `
      INSERT INTO Evaluations (student_id, lecturer_score, lecturer_evaluated) 
      VALUES (?, ?, TRUE)
      ON DUPLICATE KEY UPDATE lecturer_score = ?, lecturer_evaluated = TRUE
    `;
    
    await pool.query(upsertQuery, [student_id, score, score]);
    res.status(200).json({ message: 'Lecturer evaluation submitted successfully.' });
  } catch (error) {
    console.error('Submit evaluation error:', error);
    res.status(500).json({ error: 'Failed to submit evaluation.' });
  }
});

// --- EVALUATION ROUTES ---

// Submit or Update an Evaluation
app.post('/evaluations', authenticateToken, async (req, res) => {
  try {
    const { student_id, scores } = req.body;
    const evaluator_id = req.user.userId; // <--- FIXED: Now correctly reads userId
    const evaluator_role = req.user.role;

    if (!['Company_Supervisor', 'Lecturer'].includes(evaluator_role)) {
      return res.status(403).json({ error: 'Only supervisors can submit evaluations.' });
    }

    const total_score = scores.reduce((a, b) => a + b, 0);

    // Insert or update if they are editing their existing evaluation
    await pool.query(`
      INSERT INTO Evaluations (student_id, evaluator_id, evaluator_role, rubric_1, rubric_2, rubric_3, rubric_4, rubric_5, total_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        rubric_1=VALUES(rubric_1), rubric_2=VALUES(rubric_2), rubric_3=VALUES(rubric_3), 
        rubric_4=VALUES(rubric_4), rubric_5=VALUES(rubric_5), total_score=VALUES(total_score)
    `, [student_id, evaluator_id, evaluator_role, ...scores, total_score]);

    res.status(200).json({ message: 'Evaluation saved successfully.' });
  } catch (error) {
    console.error('Eval error:', error);
    res.status(500).json({ error: 'Failed to submit evaluation.' });
  }
});

// Fetch Evaluations for a specific student (Removed /api)
app.get('/evaluations/:studentId', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT evaluator_role, total_score 
      FROM Evaluations 
      WHERE student_id = ?
    `, [req.params.studentId]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Fetch eval error:', error);
    res.status(500).json({ error: 'Failed to fetch evaluations.' });
  }
});

app.listen(PORT, ()=>{
  console.log(`Server is running on port ${PORT}`);
});