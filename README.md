Tech Stack
Frontend: React.js, Tailwind CSS

Backend: Node.js, Express.js

Database: MySQL

File Storage: Cloudinary, Multer

Prerequisites
Before you begin, ensure you have the following installed:

Node.js (v16 or higher)

MySQL



Local Setup & Installation

Setup the Environment Variables
Create a .env file in the root directory and add the following keys (contact the developer for the actual secret keys):
PORT=5000
DATABASE_URL=your_mysql_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret


Install Dependencies & Run the Backend
# Install server dependencies
npm install

# Start the Node.js server
node index.js


Install Dependencies & Run the Frontend (Open a new terminal)
cd client   # or whatever your frontend folder is named
npm install
npm run dev

Default Test Accounts
Super Admin: admin@succms.edu.my / (Password: succms2026)
Supervisor: drtan@gmail.com / (Password: succms26)
Student: test.student@example.com / (Password: test.student@example.com)
