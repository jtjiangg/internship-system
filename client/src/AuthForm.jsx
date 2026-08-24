import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Label, Input, Select, Button } from './components/ui';

function AuthForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Student');

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
        // Save both the token AND the user profile so reloads don't log you out
        sessionStorage.setItem('internship_token', data.token);
        sessionStorage.setItem('internship_user', JSON.stringify(data.user)); 
        
        // Pass the user data back up to App.jsx to trigger the dashboard
        onLogin(data.user); 
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Could not connect to the server.");
    }
  };

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
        setIsLogin(true);
        setPassword('');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Could not connect to the server.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        
        <Card>
          <CardHeader 
            title={isLogin ? 'Internship System Login' : 'Create an Account'} 
            subtitle={isLogin ? 'Sign in to access your portal' : 'Register for a new account'}
          />
          
          <CardContent>
            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-5">
              
              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input 
                      type="text" 
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select 
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="Student">Student</option>
                      <option value="Lecturer">Lecturer</option>
                      <option value="Company_Supervisor">Company Supervisor</option>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col pt-4 space-y-3">
                <Button type="submit" className="w-full">
                  {isLogin ? 'Login' : 'Sign Up'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                </Button>
              </div>
              
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default AuthForm;