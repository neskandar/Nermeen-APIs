const apiRequest = require('supertest');
const fs = require('fs');
const { allure: jestAllure } = require('jest-allure');

describe('Update Note and Verify', () => {
  it('should update a note and handle various status responses', async () => {
    const updateNoteEndpoint = 'https://practice.expandtesting.com/notes/api/notes/';
    
    // Load user details and note details from the files
    const userData = fs.readFileSync('userDetails.json', 'utf-8');
    const noteData = fs.readFileSync('noteDetails.json', 'utf-8');
    const user = JSON.parse(userData);
    const note = JSON.parse(noteData);

    // Updated note details
    const updatedNoteDetails = {
      title: note.title,
      description: note.description,
      category: note.category,
      completed: true // Update completed status to true
    };

    // Make a PATCH request to update the note
    let response;
    try {
      response = await apiRequest(updateNoteEndpoint + note.id)
        .patch('')
        .set('x-auth-token', user.token)
        .send(updatedNoteDetails);
    } catch (error) {
      console.error(`Error updating note: ${error.message}`);
      return;
    }

    // Log the response status and body for debugging
    console.log(`Update Note Status: ${response.status}`);
    let responseBody = response.body;
    console.log(responseBody);

    // Attach response body to Allure report for note update
    if (jestAllure) {
      jestAllure.createAttachment('Update Note Response', JSON.stringify(responseBody, null, 2), 'application/json');
    }

    if (response.status === 200) {
      console.log('Note updated successfully.');
      expect(response.status).toBe(200);

      // Save updated note details to the file
      fs.writeFileSync('noteDetails.json', JSON.stringify(updatedNoteDetails, null, 2));

      // Display updated note details
      console.log(`Updated Note Details:\nTitle: ${updatedNoteDetails.title}\nDescription: ${updatedNoteDetails.description}\nCategory: ${updatedNoteDetails.category}\nCompleted: ${updatedNoteDetails.completed}`);
    } else {
      if (response.status === 400) {
        console.error('400 Bad Request: Please ensure title, description, and category are valid.');
        if (jestAllure) {
          jestAllure.createAttachment('Update Note Error Response - 400', JSON.stringify(responseBody, null, 2), 'application/json');
        }
        expect(responseBody.message).toContain('Bad Request');
      } else if (response.status === 401) {
        console.error('401 Unauthorized: Please check your authentication token.');
        if (jestAllure) {
          jestAllure.createAttachment('Update Note Error Response - 401', JSON.stringify(responseBody, null, 2), 'application/json');
        }
        expect(responseBody.message).toBe('Access token is not valid or has expired, you will need to login');
      } else if (response.status === 500) {
        console.error('500 Internal Server Error: Please try again later.');
        if (jestAllure) {
          jestAllure.createAttachment('Update Note Error Response - 500', JSON.stringify(responseBody, null, 2), 'application/json');
        }
        expect(responseBody.message).toBe('Internal Server Error');
      } else {
        console.error(`Unexpected status code: ${response.status}`);
      }
    }
  });
});
