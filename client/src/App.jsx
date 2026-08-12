import React, { useState, useEffect } from "react";
// Using explicit full file paths as requested
import AuthForm from "/workspaces/internship-system/client/src/AuthForm.jsx";
import Dashboard from "/workspaces/internship-system/client/src/Dashboard.jsx";
import EvaluatorDashboard from "/workspaces/internship-system/client/src/EvaluatorDashboard.jsx";
import SuperAdminDashboard from "/workspaces/internship-system/client/src/SuperAdminDashboard.jsx";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const token = sessionStorage.getItem('internship_token');
    const storedUser = localStorage.getItem('internship_user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('internship_token');
    sessionStorage.removeItem('internship_user');
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <div>
      {!isLoggedIn ? (
        <AuthForm onLogin={(userData) => {
          setUser(userData);
          setIsLoggedIn(true);
        }} />
      ) : (
        // Route traffic based on the user's role
        user.role === 'Student' ? (
          <Dashboard user={user} onLogout={handleLogout} />
        ) : user.role === 'Super_Admin' ? (
          <SuperAdminDashboard user={user} onLogout={handleLogout} />
        ) : (
          <EvaluatorDashboard user={user} onLogout={handleLogout} />
        )
      )}
    </div>
  );
}

export default App;