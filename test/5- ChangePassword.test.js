const apiRequest = require('supertest');
const fs = require('fs');
const { allure: jestAllure } = require('jest-allure');

describe('Change Password', () => {
  it('should change the password and handle various status responses', async () => {
    const changePasswordEndpoint = 'https://practice.expandtesting.com/notes/api/users/change-password';
    
    // Load user details from the file
    const userData = fs.readFileSync('userDetails.json', 'utf-8');
    const user = JSON.parse(userData);

    // Make a POST request to change the password
    const oldPassword = user.password;
    const newPassword = 'NewTest@1234';
    let response;
    try {
      response = await apiRequest(changePasswordEndpoint)
        .post('')
        .set('x-auth-token', user.token)
        .send({
          currentPassword: oldPassword,
          newPassword: newPassword
        });
    } catch (error) {
      console.error(`Error changing password: ${error.message}`);
      return;
    }

    // Log the response status and body for debugging
    console.log(`Change Password Status: ${response.status}`);
    let responseBody = response.body;
    console.log(responseBody);

    // Attach response body to Allure report for password change
    if (jestAllure) {
      jestAllure.createAttachment('Change Password Response', JSON.stringify(responseBody, null, 2), 'application/json');
    }

    if (response.status === 200) {
      console.log('Password changed successfully.');
      expect(response.status).toBe(200);

      // Update the user details with the new password
      user.password = newPassword;
      fs.writeFileSync('userDetails.json', JSON.stringify(user, null, 2));

      // Display old and new passwords
      console.log(`Old Password: ${oldPassword}`);
      console.log(`New Password: ${newPassword}`);
    } else {
      if (response.status === 400) {
        console.error('400 Bad Request: The new password should be different from the current password.');
        expect(responseBody.message).toBe('The new password should be different from the current password');
      } else if (response.status === 500) {
        console.error('500 Internal Server Error: Please try again later.');
        expect(responseBody.message).toBe('Internal Server Error');
      } else {
        console.error(`Unexpected status code: ${response.status}`);
      }

      // Sequentially handle different error responses
      if (response.status !== 200) {
        try {
          // Handle 400 Bad Request for incorrect current password
          response = await apiRequest(changePasswordEndpoint)
            .post('')
            .set('x-auth-token', user.token)
            .send({
              currentPassword: 'wrongpassword', // Incorrect current password to trigger 400
              newPassword: newPassword
            });

          console.log(`Error Status: ${response.status}`);
          responseBody = response.body;
          console.log(responseBody);

          // Attach response body to Allure report for incorrect current password
          if (jestAllure) {
            jestAllure.createAttachment('Change Password Error Response - 400', JSON.stringify(responseBody, null, 2), 'application/json');
          }

          if (response.status === 400) {
            console.log('400 Bad Request case');
            expect(responseBody.message).toBe('The current password is incorrect');
          }

          if (response.status !== 400) {
            // Handle 500 Internal Server Error
            response = await apiRequest(changePasswordEndpoint)
              .post('')
              .set('x-auth-token', user.token)
              .send({
                currentPassword: oldPassword,
                newPassword: newPassword // Valid request but simulate server error
              });

            console.log(`Error Status: ${response.status}`);
            responseBody = response.body;
            console.log(responseBody);

            // Attach response body to Allure report for server error
            if (jestAllure) {
              jestAllure.createAttachment('Change Password Error Response - 500', JSON.stringify(responseBody, null, 2), 'application/json');
            }

            if (response.status === 500) {
              console.log('500 Internal Server Error case');
              expect(responseBody.message).toBe('Internal Server Error');
            }
          }
        } catch (error) {
          console.error(`Error handling different error responses: ${error.message}`);
        }
      }
    }
  });
});
