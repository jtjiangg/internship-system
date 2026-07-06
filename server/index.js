import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app=express();
const PORT = process.env.PORT || 5000;

const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized:false
    }
});

// Create an 'uploads' directory if it doesn't exist yet
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Configure how files are named and saved
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Keeps original extension (e.g. .jpg, .pdf) and adds a unique timestamp
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});

const upload = multer({ storage: storage });

// Serve the uploads folder publicly so the browser can access files
app.use('/uploads', express.static('uploads'));

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
    const [rows] = await pool.query('SELECT * FROM Companies ORDER BY name ASC');
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

  // Submit Logbook Route (Protected)
// UPDATED: Submit Logbook Route with File Upload
app.post('/logbooks', authenticateToken, upload.single('evidence'), async (req, res) => {
  try {
    if (req.user.role !== 'Student') {
      return res.status(403).json({ error: 'Only students can submit logbooks.' });
    }

    const { date, clock_in, clock_out, task_description } = req.body;
    const studentId = req.user.userId;

    // If a file was uploaded, construct its public URL path
    const evidence_url = req.file ? `/uploads/${req.file.filename}` : null;

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

app.listen(PORT, ()=>{
        console.log(`Server is running on port ${PORT}`);
});