import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

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

app.listen(PORT, ()=>{
        console.log(`Server is running on port ${PORT}`);
});