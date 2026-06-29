// test-register.js
// This simulates a React frontend sending data to your API

async function testRegistration() {
  try {
    const response = await fetch('http://localhost:5000/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        full_name: 'Test Student',
        email: 'test.student@example.com',
        password: 'supersecretpassword',
        role: 'Student'
      })
    });

    const data = await response.json();
    console.log('Server Replied:', data);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRegistration();