// test-login.js
async function testLogin() {
  try {
    const response = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test.student@example.com', // The email we just registered
        password: 'supersecretpassword'    // The correct password
      })
    });

    const data = await response.json();
    console.log('Login Response:', data);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLogin();