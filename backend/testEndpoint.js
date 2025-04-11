const axios = require('axios');

// Get a token first
async function testAuth() {
  try {
    // Replace with valid credentials
    const authResponse = await axios.post('http://localhost:5000/api/users/login', {
      email: 'test@example.com',  // Replace with your test email
      password: 'password123'     // Replace with your test password
    });
    
    const token = authResponse.data.token;
    console.log('Auth successful, token:', token);
    
    // Test the statements status endpoint with the token
    const statementResponse = await axios.get('http://localhost:5000/api/statements/status', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Statement API response:', statementResponse.data);
    console.log('API endpoint is working correctly!');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Response data:', error.response?.data);
    console.error('Response status:', error.response?.status);
  }
}

testAuth(); 