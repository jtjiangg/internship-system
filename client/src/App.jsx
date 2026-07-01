import { useState } from 'react'

function App() {
  // Toggle between Login and Register mode
  const [isLogin, setIsLogin] = useState(true);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Student');

  // The Login Handshake (You already built this!)
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('internship_token', data.token);
        alert(`Welcome back, ${data.user.full_name}!`);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Could not connect to the server.");
    }
  };

  // NEW: The Register Handshake
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password, role }),
      });
      const data = await response.json();
      
      if (response.ok) {
        alert("Account successfully created! You can now log in.");
        setIsLogin(true); // Automatically flip back to the login screen
        setPassword('');  // Clear the password for security
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Could not connect to the server.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {isLogin ? 'Internship System Login' : 'Create an Account'}
        </h2>

        {/* The form dynamically calls the right function based on state */}
        <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
          
          {/* --- THESE FIELDS ONLY SHOW DURING REGISTRATION --- */}
          {!isLogin && (
            <>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Full Name:</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Role:</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Student">Student</option>
                  <option value="Lecturer">Lecturer</option>
                  <option value="Company_Supervisor">Company Supervisor</option>
                </select>
              </div>
            </>
          )}

          {/* --- THESE FIELDS SHOW ALL THE TIME --- */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Email:</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">Password:</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* --- ACTION BUTTONS --- */}
          <div className="flex flex-col pt-4 space-y-3">
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
            
            {/* The Toggle Switch */}
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-500 hover:text-gray-700 text-sm font-semibold"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default App;