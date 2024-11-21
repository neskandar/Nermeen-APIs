const apiRequest = require('supertest');
const fs = require('fs');
const { allure: jestAllure } = require('jest-allure');

describe('Delete Note and Verify', () => {
  it('should delete a note and handle various status responses', async () => {
    const deleteNoteEndpoint = 'https://practice.expandtesting.com/notes/api/notes/';
    const getNotesEndpoint = 'https://practice.expandtesting.com/notes/api/notes';
    
    // Load user details and note details from the files
    const userData = fs.readFileSync('userDetails.json', 'utf-8');
    const noteData = fs.readFileSync('noteDetails.json', 'utf-8');
    const user = JSON.parse(userData);
    
    let note;
    try {
      note = JSON.parse(noteData);
    } catch (error) {
      console.error('No valid note details found. Please ensure the noteDetails.json file contains valid note details.');
      return;
    }

    if (!note.id) {
      console.error('No note ID found in noteDetails.json. Please ensure the note details are present.');
      return;
    }

    // Make a DELETE request to delete the note
    let response;
    try {
      response = await apiRequest(deleteNoteEndpoint + note.id)
        .delete('')
        .set('x-auth-token', user.token);
    } catch (error) {
      console.error(`Error deleting note: ${error.message}`);
      return;
    }

    // Log the response status and body for debugging
    console.log(`Delete Note Status: ${response.status}`);
    let responseBody = response.body;
    console.log(responseBody);

    // Attach response body to Allure report for note deletion
    if (jestAllure) {
      jestAllure.createAttachment('Delete Note Response', JSON.stringify(responseBody, null, 2), 'application/json');
    }

    if (response.status === 200) {
      console.log('Note deleted successfully.');
      expect(response.status).toBe(200);

      // Make a GET request to retrieve all notes
      let getNotesResponse;
      try {
        getNotesResponse = await apiRequest(getNotesEndpoint)
          .get('')
          .set('x-auth-token', user.token);
      } catch (error) {
        console.error(`Error retrieving notes: ${error.message}`);
        return;
      }

      // Log the response status and body for debugging
      console.log(`Get Notes Status: ${getNotesResponse.status}`);
      const getNotesResponseBody = getNotesResponse.body;
      console.log(getNotesResponseBody);

      // Attach response body to Allure report for retrieving notes
      if (jestAllure) {
        jestAllure.createAttachment('Retrieve Notes Response', JSON.stringify(getNotesResponseBody, null, 2), 'application/json');
      }

      // Verify the note is deleted from the list
      const noteExists = getNotesResponseBody.data.some(n => n.id === note.id);
      expect(noteExists).toBe(false);
      console.log('The note is successfully deleted from the list.');

      // Clear the contents of noteDetails.json file
      fs.writeFileSync('noteDetails.json', '');
      console.log('noteDetails.json file contents cleared successfully.');
    } else {
      if (response.status === 400) {
        console.error('400 Bad Request: Note ID must be a valid ID.');
        if (jestAllure) {
          jestAllure.createAttachment('Delete Note Error Response - 400', JSON.stringify(responseBody, null, 2), 'application/json');
        }
        expect(responseBody.message).toBe('Note ID must be a valid ID');
      } else if (response.status === 401) {
        console.error('401 Unauthorized: Please check your authentication token.');
        if (jestAllure) {
          jestAllure.createAttachment('Delete Note Error Response - 401', JSON.stringify(responseBody, null, 2), 'application/json');
        }
        expect(responseBody.message).toBe('Access token is not valid or has expired, you will need to login');
      } else if (response.status === 500) {
        console.error('500 Internal Server Error: Please try again later.');
        if (jestAllure) {
          jestAllure.createAttachment('Delete Note Error Response - 500', JSON.stringify(responseBody, null, 2), 'application/json');
        }
        expect(responseBody.message).toBe('Internal Server Error');
      } else {
        console.error(`Unexpected status code: ${response.status}`);
      }

      // Sequentially handle different error responses
      if (response.status !== 200) {
        try {
          // Handle 400 Bad Request
          response = await apiRequest(deleteNoteEndpoint + 'invalid-id')
            .delete('')
            .set('x-auth-token', user.token);

          console.log(`Error Status: ${response.status}`);
          responseBody = response.body;
          console.log(responseBody);

          // Attach response body to Allure report for invalid ID
          if (jestAllure) {
            jestAllure.createAttachment('Delete Note Error Response - Invalid ID', JSON.stringify(responseBody, null, 2), 'application/json');
          }

          if (response.status === 400) {
            console.log('400 Bad Request case');
            expect(responseBody.message).toBe('Note ID must be a valid ID');
          } else if (response.status !== 400) {
            // Handle 401 Unauthorized
            response = await apiRequest(deleteNoteEndpoint + note.id)
              .delete('')
              .set('x-auth-token', 'invalid-token'); // Invalid token to trigger 401

            console.log(`Error Status: ${response.status}`);
            responseBody = response.body;
            console.log(responseBody);

            // Attach response body to Allure report for unauthorized issue
            if (jestAllure) {
              jestAllure.createAttachment('Delete Note Error Response - Unauthorized', JSON.stringify(responseBody, null, 2), 'application/json');
            }

            if (response.status === 401) {
              console.log('401 Unauthorized case');
              expect(responseBody.message).toBe('Access token is not valid or has expired, you will need to login');
            } else if (response.status !== 401) {
              // Handle 500 Internal Server Error
              response = await apiRequest(deleteNoteEndpoint + note.id)
                .delete('')
                .set('x-auth-token', user.token);

              console.log(`Error Status: ${response.status}`);
              responseBody = response.body;
              console.log(responseBody);

              // Attach response body to Allure report for server error
              if (jestAllure) {
                jestAllure.createAttachment('Delete Note Error Response - Server Error', JSON.stringify(responseBody, null, 2), 'application/json');
              }

              if (response.status === 500) {
                console.log('500 Internal Server Error case');
                expect(responseBody.message).toBe('Internal Server Error');
              }
            }
          }
        } catch (error) {
          console.error(`Error handling different error responses: ${error.message}`);
        }
      }
    }
  });
});
