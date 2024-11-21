const apiRequest = require('supertest');
const fs = require('fs');
const { allure: jestAllure } = require('jest-allure');

describe('Update Profile Information', () => {
  it('should retrieve and update profile information, and verify various status responses', async () => {
    const profileEndpoint = 'https://practice.expandtesting.com/notes/api/users/profile';
    const updateProfileEndpoint = 'https://practice.expandtesting.com/notes/api/users/profile';
    
    // Load user details from the file
    const userData = fs.readFileSync('userDetails.json', 'utf-8');
    const user = JSON.parse(userData);

    // Make a GET request to retrieve profile information
    let profileResponse;
    try {
      profileResponse = await apiRequest(profileEndpoint)
        .get('')
        .set('x-auth-token', user.token);
    } catch (error) {
      console.error(`Error retrieving profile: ${error.message}`);
      return;
    }

    // Log the response status and body for debugging
    console.log(`Profile Status: ${profileResponse.status}`);
    let profileResponseBody = profileResponse.body;
    console.log(profileResponseBody);

    // Attach response body to Allure report for profile retrieval
    if (jestAllure) {
      jestAllure.createAttachment('Profile Retrieval Response', JSON.stringify(profileResponseBody, null, 2), 'application/json');
    }

    if (profileResponse.status === 200) {
      // New profile information to be updated
      const updatedUser = {
        name: profileResponseBody.data.name, // Keep the name as it is
        phone: `5551234567`, // Generating a valid phone number
        company: `Company_${Date.now()}` // Generating a unique company name for testing
      };

      // Make a PATCH request to update profile information
      let updateResponse;
      try {
        updateResponse = await apiRequest(updateProfileEndpoint)
          .patch('')
          .set('x-auth-token', user.token)
          .send(updatedUser);
      } catch (error) {
        console.error(`Error updating profile: ${error.message}`);
        return;
      }

      // Log the response status and body for debugging
      console.log(`Update Status: ${updateResponse.status}`);
      const updateResponseBody = updateResponse.body;
      console.log(updateResponseBody);

      // Attach response body to Allure report for profile update
      if (jestAllure) {
        jestAllure.createAttachment('Profile Update Response', JSON.stringify(updateResponseBody, null, 2), 'application/json');
      }

      if (updateResponse.status === 200) {
        console.log('Profile updated successfully.');
        expect(updateResponseBody.data.phone).toBe(updatedUser.phone);
        expect(updateResponseBody.data.company).toBe(updatedUser.company);

        // Log the updated user details
        console.log(`Updated user details:\n Name: ${updatedUser.name}\n Phone: ${updatedUser.phone}\n Company: ${updatedUser.company}`);
      } else {
        console.error(`Unexpected status code: ${updateResponse.status}`);
      }
    } else {
      if (profileResponse.status === 400) {
        console.error('Bad Request: Check the data being sent.');
      } else if (profileResponse.status === 401) {
        console.error('Unauthorized: Check the authentication token.');
      } else if (profileResponse.status === 500) {
        console.error('Server error: Please try again later.');
      } else {
        console.error(`Unexpected status code: ${profileResponse.status}`);
      }

      // Sequentially handle different error responses for update
      if (profileResponse.status !== 200) {
        // Handle 400 Bad Request
        let badRequestResponse;
        try {
          badRequestResponse = await apiRequest(updateProfileEndpoint)
            .patch('')
            .set('x-auth-token', user.token)
            .send({
              name: profileResponseBody.data.name,
              phone: 'invalid', // Invalid phone number to trigger 400
              company: 'InvalidCompany'
            });
        } catch (error) {
          console.error(`Error handling bad request: ${error.message}`);
          return;
        }

        if (badRequestResponse.status === 400) {
          const responseBody = badRequestResponse.body;
          console.log(`400 Bad Request: ${responseBody.message}`);
          if (jestAllure) {
            jestAllure.createAttachment('Profile Update Error Response - 400', JSON.stringify(responseBody, null, 2), 'application/json');
          }
          expect(responseBody.message).toContain('Bad Request');
        } else if (badRequestResponse.status !== 400) {
          // Handle 401 Unauthorized
          let unauthorizedResponse;
          try {
            unauthorizedResponse = await apiRequest(updateProfileEndpoint)
              .patch('')
              .set('x-auth-token', 'invalid-token') // Invalid token to trigger 401
              .send({
                name: profileResponseBody.data.name,
                phone: `5551234567`, // Valid phone number
                company: `Company_${Date.now()}` // Valid company
              });
          } catch (error) {
            console.error(`Error handling unauthorized request: ${error.message}`);
            return;
          }

          if (unauthorizedResponse.status === 401) {
            const responseBody = unauthorizedResponse.body;
            console.log(`401 Unauthorized: ${responseBody.message}`);
            if (jestAllure) {
              jestAllure.createAttachment('Profile Update Error Response - 401', JSON.stringify(responseBody, null, 2), 'application/json');
            }
            expect(responseBody.message).toContain('Unauthorized');
          } else if (unauthorizedResponse.status !== 401) {
            // Handle 500 Internal Server Error
            let serverErrorResponse;
            try {
              serverErrorResponse = await apiRequest(updateProfileEndpoint)
                .patch('')
                .set('x-auth-token', user.token)
                .send({
                  name: profileResponseBody.data.name,
                  phone: `5551234567`, // Valid phone number
                  company: `Company_${Date.now()}` // Valid company
                });
            } catch (error) {
              console.error(`Error handling server error: ${error.message}`);
              return;
            }

            if (serverErrorResponse.status === 500) {
              const responseBody = serverErrorResponse.body;
              console.log(`500 Internal Server Error: ${responseBody.message}`);
              if (jestAllure) {
                jestAllure.createAttachment('Profile Update Error Response - 500', JSON.stringify(responseBody, null, 2), 'application/json');
              }
              expect(responseBody.message).toContain('Internal Server Error');
            }
          }
        }
      }
    }
  });
});
