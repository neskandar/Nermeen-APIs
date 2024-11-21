const apiRequest = require('supertest');
const fs = require('fs');
const { allure: jestAllure } = require('jest-allure');

describe('Create Note and Verify', () => {
  it('should create a note and handle various status responses', async () => {
    const createNoteEndpoint = 'https://practice.expandtesting.com/notes/api/notes';
    const getNotesEndpoint = 'https://practice.expandtesting.com/notes/api/notes';
    
    // Load user details from the file
    const userData = fs.readFileSync('userDetails.json', 'utf-8');
    const user = JSON.parse(userData);

    // Note details to be created
    const noteDetails = {
      title: 'Valid Note Title',
      description: 'This is a valid note description that has more than 4 characters.',
      category: 'Work' // This should be one of 'Home', 'Work', 'Personal'
    };

    // Make a POST request to create a note
    let response;
    try {
      response = await apiRequest(createNoteEndpoint)
        .post('')
        .set('x-auth-token', user.token)
        .send(noteDetails);
    } catch (error) {
      console.error(`Error creating note: ${error.message}`);
      return;
    }

    // Log the response status and body for debugging
    console.log(`Create Note Status: ${response.status}`);
    let responseBody = response.body;
    console.log(responseBody);

    // Attach response body to Allure report for note creation
    if (jestAllure) {
      jestAllure.createAttachment('Create Note Response', JSON.stringify(responseBody, null, 2), 'application/json');
    }

    if (response.status === 200) {
      console.log('Note created successfully.');
      expect(response.status).toBe(200);

      // Save created note details to a file
      const createdNoteDetails = {
        id: responseBody.data.id,
        title: responseBody.data.title,
        description: responseBody.data.description,
        category: responseBody.data.category,
        completed: responseBody.data.completed,
        created_at: responseBody.data.created_at,
        updated_at: responseBody.data.updated_at,
        user_id: responseBody.data.user_id
      };
      fs.writeFileSync('noteDetails.json', JSON.stringify(createdNoteDetails, null, 2));

      // Display note details
      console.log(`Note Details:\nID: ${createdNoteDetails.id}\nTitle: ${createdNoteDetails.title}\nDescription: ${createdNoteDetails.description}\nCategory: ${createdNoteDetails.category}\nCompleted: ${createdNoteDetails.completed}`);

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

      // Verify the note is added to the list
      const noteExists = getNotesResponseBody.data.some(note => 
        note.title === createdNoteDetails.title &&
        note.description === createdNoteDetails.description &&
        note.category === createdNoteDetails.category
      );
      expect(noteExists).toBe(true);
      console.log('The note is successfully added to the list.');
    } else {
      if (response.status === 400) {
        console.error('400 Bad Request: Please ensure title, description, and category are valid.');
        if (jestAllure) {
          jestAllure.createAttachment('Create Note Error Response - 400', JSON.stringify(responseBody, null, 2), 'application/json');
        }
        expect(responseBody.message).toContain('Bad Request');
      } else if (response.status === 401) {
        console.error('401 Unauthorized: Please check your authentication token.');
        if (jestAllure) {
          jestAllure.createAttachment('Create Note Error Response - 401', JSON.stringify(responseBody, null, 2), 'application/json');
        }
        expect(responseBody.message).toBe('Access token is not valid or has expired, you will need to login');
      } else if (response.status === 500) {
        console.error('500 Internal Server Error: Please try again later.');
        if (jestAllure) {
          jestAllure.createAttachment('Create Note Error Response - 500', JSON.stringify(responseBody, null, 2), 'application/json');
        }
        expect(responseBody.message).toBe('Internal Server Error');
      } else {
        console.error(`Unexpected status code: ${response.status}`);
      }

      // Sequentially handle different error responses
      if (response.status !== 200) {
        try {
          // Handle 400 Bad Request with title issue
          response = await apiRequest(createNoteEndpoint)
            .post('')
            .set('x-auth-token', user.token)
            .send({
              title: '123', // Invalid title to trigger 400
              description: noteDetails.description,
              category: noteDetails.category
            });

          console.log(`Error Status: ${response.status}`);
          responseBody = response.body;
          console.log(responseBody);

          // Attach response body to Allure report for title issue
          if (jestAllure) {
            jestAllure.createAttachment('Create Note Error Response - Title Issue', JSON.stringify(responseBody, null, 2), 'application/json');
          }

          if (response.status === 400) {
            console.log('400 Bad Request case');
            expect(responseBody.message).toBe('Title must be between 4 and 100 characters');
          } else if (response.status !== 400) {
            // Handle 401 Unauthorized
            response = await apiRequest(createNoteEndpoint)
              .post('')
              .set('x-auth-token', 'invalid-token') // Invalid token to trigger 401
              .send(noteDetails);

            console.log(`Error Status: ${response.status}`);
            responseBody = response.body;
            console.log(responseBody);

            // Attach response body to Allure report for unauthorized issue
            if (jestAllure) {
              jestAllure.createAttachment('Create Note Error Response - Unauthorized', JSON.stringify(responseBody, null, 2), 'application/json');
            }

            if (response.status === 401) {
              console.log('401 Unauthorized case');
              expect(responseBody.message).toBe('Access token is not valid or has expired, you will need to login');
            } else if (response.status !== 401) {
              // Handle 500 Internal Server Error
              response = await apiRequest(createNoteEndpoint)
                .post('')
                .set('x-auth-token', user.token)
                .send(noteDetails); // Valid request but simulate server error

              console.log(`Error Status: ${response.status}`);
              responseBody = response.body;
              console.log(responseBody);

              // Attach response body to Allure report for server error
              if (jestAllure) {
                jestAllure.createAttachment('Create Note Error Response - Server Error', JSON.stringify(responseBody, null, 2), 'application/json');
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
