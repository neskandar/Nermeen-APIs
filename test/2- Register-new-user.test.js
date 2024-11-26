const supertestRequest = require('supertest');
const fs = require('fs');
const { allure: jestAllure } = require('jest-allure');

// Increase Jest timeout to 30 seconds 
jest.setTimeout(30000);

describe('User Registration', () => {
  it('should register a new user and verify it’s created', async () => {
    const apiEndpoint = 'https://practice.expandtesting.com/notes/api/users/register';

    // Generate a unique email address
    const uniqueId = Date.now();
    const newUser = {
      name: `testuser${uniqueId}`,
      email: `test${uniqueId}@gmail.com`,
      password: 'Test@1234'
    };

    // Make a POST request to register a new user
    let response;
    try {
      response = await supertestRequest(apiEndpoint).post('').send(newUser);
    } catch (error) {
      console.error(`Error registering user: ${error.message}`);
      return;
    }

    // Log the response status and body for debugging
    console.log(`Status: ${response.status}`);
    let responseBody = response.body;
    console.log(responseBody);

    // Attach response body to Allure report for user creation
    if (jestAllure) {
      jestAllure.createAttachment('User Registration Response', JSON.stringify(responseBody, null, 2), 'application/json');
    }

    if (response.status === 201) {
      // Check if the response status is 201 (Created)
      expect(response.status).toBe(201);

      // Verify user creation by checking response body
      expect(responseBody).toBeDefined();
      expect(responseBody.data).toBeDefined();
      expect(responseBody.data.name).toBe(newUser.name);
      expect(responseBody.data.email).toBe(newUser.email);

      // Log the generated user details
      console.log(`Generated user details:\n Name: ${newUser.name}\n Email: ${newUser.email}\n Password: ${newUser.password}`);

      // Save user details to a file
      const userData = { ...newUser, token: '' };
      fs.writeFileSync('userDetails.json', JSON.stringify(userData, null, 2));
    } else {
      console.error(`Unexpected status code: ${response.status}`);
    }
  });
});
