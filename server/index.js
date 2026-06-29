import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app=express();
const PORT = process.env.PORT || 5000;

const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized:false
    }
});

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

app.listen(PORT, ()=>{
        console.log(`Server is running on port ${PORT}`);
});