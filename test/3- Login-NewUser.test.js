const supertestRequest = require('supertest');
const fs = require('fs');
const { allure: jestAllure } = require('jest-allure');

describe('User Login and Profile Verification', () => {
  it('should log in with a user and verify profile information', async () => {
    const loginEndpoint = 'https://practice.expandtesting.com/notes/api/users/login';
    const profileEndpoint = 'https://practice.expandtesting.com/notes/api/users/profile';
    
    // Load user details from the file
    const userData = fs.readFileSync('userDetails.json', 'utf-8');
    const loginUser = JSON.parse(userData);

    // Make a POST request to log in the user
    let loginResponse;
    try {
      loginResponse = await supertestRequest(loginEndpoint)
        .post('')
        .send({
          email: loginUser.email,
          password: loginUser.password
        });
    } catch (error) {
      console.error(`Error logging in user: ${error.message}`);
      return;
    }

    // Log the response status and body for debugging
    console.log(`Login Status: ${loginResponse.status}`);
    let loginResponseBody = loginResponse.body;
    console.log(loginResponseBody);

    // Attach response body to Allure report for login
    if (jestAllure) {
      jestAllure.createAttachment('Login Response', JSON.stringify(loginResponseBody, null, 2), 'application/json');
    }

    if (loginResponse.status === 200) {
      // Successful login
      expect(loginResponse.status).toBe(200);

      // Extract token from the login response
      const token = loginResponseBody.data.token; // Assumes the token is in the data object
      console.log(`Generated Token: ${token}`); // Display the token

      // Save token to the user details file
      loginUser.token = token;
      fs.writeFileSync('userDetails.json', JSON.stringify(loginUser, null, 2));

      // Make a GET request to verify profile information using the token
      let profileResponse;
      try {
        profileResponse = await supertestRequest(profileEndpoint)
          .get('')
          .set('x-auth-token', token);
      } catch (error) {
        console.error(`Error fetching profile: ${error.message}`);
        return;
      }

      // Log the response status and body for debugging
      console.log(`Profile Status: ${profileResponse.status}`);
      const profileResponseBody = profileResponse.body;
      console.log(profileResponseBody);

      // Attach response body to Allure report for profile verification
      if (jestAllure) {
        jestAllure.createAttachment('Profile Verification Response', JSON.stringify(profileResponseBody, null, 2), 'application/json');
      }

      // Check if the response status is 200 (OK)
      expect(profileResponse.status).toBe(200);

      // Verify profile information within the data object
      expect(profileResponseBody).toBeDefined();
      expect(profileResponseBody.data).toBeDefined();
      expect(profileResponseBody.data.email).toBe(loginUser.email);

    } else {
      // Handle error scenarios sequentially
      if (loginResponse.status !== 200) {
        console.log('Checking for 400 Bad Request');
        try {
          loginResponse = await supertestRequest(loginEndpoint)
            .post('')
            .send({
              email: 'invalid-email', // Invalid email to trigger 400
              password: loginUser.password
            });

          if (loginResponse.status === 400) {
            console.log('400 Bad Request case');
            const responseBody = loginResponse.body;
            if (jestAllure) {
              jestAllure.createAttachment('Login Error Response - 400', JSON.stringify(responseBody, null, 2), 'application/json');
            }
            expect(responseBody.message).toContain('Bad Request');
          }

          if (loginResponse.status !== 400) {
            console.log('Checking for 401 Unauthorized');
            loginResponse = await supertestRequest(loginEndpoint)
              .post('')
              .send({
                email: loginUser.email,
                password: 'wrongpassword' // Invalid password to trigger 401
              });

            if (loginResponse.status === 401) {
              console.log('401 Unauthorized case');
              const responseBody = loginResponse.body;
              if (jestAllure) {
                jestAllure.createAttachment('Login Error Response - 401', JSON.stringify(responseBody, null, 2), 'application/json');
              }
              expect(responseBody.message).toContain('Unauthorized');
            }

            if (loginResponse.status !== 401) {
              console.log('Checking for 500 Internal Server Error');
              // Simulate a server error
              // This part requires that your server can return a 500 error based on certain inputs or conditions

              // Example: Let's assume sending a specific email triggers a 500 error
              loginResponse = await supertestRequest(loginEndpoint)
                .post('')
                .send({
                  email: 'trigger-500-error@example.com',
                  password: loginUser.password
                });

              if (loginResponse.status === 500) {
                console.log('500 Internal Server Error case');
                const responseBody = loginResponse.body;
                if (jestAllure) {
                  jestAllure.createAttachment('Login Error Response - 500', JSON.stringify(responseBody, null, 2), 'application/json');
                }
                expect(responseBody.message).toContain('Internal Server Error');
              }
            }
          }
        } catch (error) {
          console.error(`Error handling login error cases: ${error.message}`);
        }
      }
    }
  });
});
