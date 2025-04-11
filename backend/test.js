const axios = require('axios');

const API_URL = 'http://localhost:4001/api';

async function testEndpoints() {
  try {
    // Test registration
    console.log('Testing registration...');
    const registerResponse = await axios.post(`${API_URL}/users`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('Registration successful:', registerResponse.data);

    // Test login
    console.log('\nTesting login...');
    const loginResponse = await axios.post(`${API_URL}/users/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('Login successful:', loginResponse.data);

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testEndpoints(); 