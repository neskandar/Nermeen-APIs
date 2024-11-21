# Nermeen API Repository

This project contains automated API tests for the Nermeen application using Jest and Supertest.

## Project Overview

The goal of this project is to provide automated test coverage for key API endpoints of the Nermeen application, ensuring reliability and consistency in the application's functionality. The tests cover various API scenarios, including health checks, user registration, login, profile updates, password changes, and CRUD operations for notes.

## Project Structure

- **tests/**: Contains the test scripts for various API functionalities.
- **jest.config.js**: Jest configuration file that includes settings for the test environment and report generation.
- **allure-report/**: Contains the generated Allure report of the test execution.

## Scenarios Covered

- **API Health Check**: Ensure the API is accessible and returns the correct health status.
- **Register New User**: Test the functionality of user registration.
- **Login New User**: Test the functionality of user login.
- **Update Profile Information**: Test the functionality of updating user profile information.
- **Change Password**: Test the functionality of changing the user's password.
- **Create Note**: Test the functionality of creating a new note.
- **Update Note**: Test the functionality of updating an existing note.
- **Delete Note**: Test the functionality of deleting a note.
- **Search for a Note**: Verify that the search functionality returns relevant results for a specific note.

## Setup and Run

Follow these steps to set up and run the tests:

### Clone the Repository

git clone https://github.com/neskandar/nermeen-APIs.git
cd nermeen-APIs


Running Tests
To run the tests sequentially, use the following command:
npm run test:sequential


Generating Allure Report
To generate and open the Allure report:
npm run allure:generate
npm run allure:open

This project uses GitHub Actions for continuous integration. 
The workflow is defined in .github/workflows/ci.yml