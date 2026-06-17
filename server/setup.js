import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createTables(){
    try{
        //connect to Aiven
        const pool = mysql.createPool({
            uri: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        console.log('Connecting to Database...');

        //blueprint for users
        const createUsersTableQuery = `
            CREATE TABLE IF NOT EXISTS Users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('Admin', 'Student', 'Company', 'Lecturer') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        //create table for companies
        const createCompaniesTableQuery = `
            CREATE TABLE IF NOT EXISTS Companies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_name VARCHAR(150) NOT NULL,
                registration_number VARCHAR(50),
                address TEXT,
                phone VARCHAR(20),
                photo_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        //blueprint for students
        const createStudentsTableQuery = `
            CREATE TABLE IF NOT EXISTS Students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                matric_number VARCHAR(20) NOT NULL UNIQUE,
                programme VARCHAR(100) NOT NULL,
                contact_number VARCHAR(20),
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            )
        `;

        //create table for lecturers
        const createLecturersTableQuery = `
            CREATE TABLE IF NOT EXISTS Lecturers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                staff_id VARCHAR(20) NOT NULL UNIQUE,
                programme VARCHAR(100),
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            )
        `;

        //create table for company supervisor
        const createCompanySupervisorsQuery = `
            CREATE TABLE IF NOT EXISTS Company_Supervisors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                company_id INT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE
            )
        `;

        //create table for internships
        const createInternshipsQuery = `
            CREATE TABLE IF NOT EXISTS Internships (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                company_id INT NOT NULL,
                lecturer_id INT NOT NULL,
                company_supervisor_id INT NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
                FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE,
                FOREIGN KEY (lecturer_id) REFERENCES Lecturers(id) ON DELETE CASCADE,
                FOREIGN KEY (company_supervisor_id) REFERENCES Company_Supervisors(id) ON DELETE CASCADE
            )
        `;

        //create table for logbooks
        const createLogbooksTableQuery = `
            CREATE TABLE IF NOT EXISTS Logbooks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                internship_id INT NOT NULL,
                log_date DATE NOT NULL,
                log_time VARCHAR(50),
                task_description TEXT NOT NULL,
                attachment_url VARCHAR(255),
                supervisor_comments TEXT,
                status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (internship_id) REFERENCES Internships(id) ON DELETE CASCADE
            )
        `;

        //execute the blueprint
        console.log('Creating tables...');
        await pool.query(createUsersTableQuery);
        await pool.query(createCompaniesTableQuery);
        await pool.query(createStudentsTableQuery);
        await pool.query(createLecturersTableQuery);
        await pool.query(createCompanySupervisorsQuery);
        await pool.query(createInternshipsQuery);
        await pool.query(createLogbooksTableQuery);

        console.log('Success. All tables are ready.');

        //close connection to finish and exit script
        await pool.end();

    } catch (error){
        console.error('Failed to create table:', error);
    }
}

//run function
createTables();