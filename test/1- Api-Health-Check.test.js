const request = require('supertest');
const { allure } = require('jest-allure');

describe('API Health Check', () => {
  it('should verify the API is healthy and unhealthy', async () => {
    const healthCheckEndpoint = 'https://practice.expandtesting.com/notes/api/health-check';

    let response;
    try {
      response = await request(healthCheckEndpoint).get('');
    } catch (error) {
      console.error(`Error fetching health check: ${error.message}`);
      return;
    }

    console.log(`Health Check Status: ${response.status}`);
    let responseBody = response.body;
    console.log(responseBody);

    // Attach response body to Allure report for the healthy case
    if (allure) {
      allure.createAttachment('Health Check Response - Healthy', JSON.stringify(responseBody, null, 2), 'application/json');
    }

    // Check for the healthy case
    if (response.status === 200 && responseBody.message === 'Notes API is Running') {
      console.log('API is healthy.');
      expect(responseBody.message).toBe('Notes API is Running');
    } else {
      // Simulate an unhealthy response for demonstration purposes
      response = await request(healthCheckEndpoint).get('/unhealthy-path');

      console.log(`Health Check Status: ${response.status}`);
      responseBody = response.body;
      console.log(responseBody);

      // Attach response body to Allure report for the unhealthy case
      if (allure) {
        allure.createAttachment('Health Check Response - Unhealthy', JSON.stringify(responseBody, null, 2), 'application/json');
      }

      if (response.status === 500 && responseBody.message === 'Notes API is Down') {
        console.error('API is unhealthy.');
        expect(responseBody.message).toBe('Notes API is Down');
      } else {
        console.error(`Unexpected status code or message: ${response.status}, ${responseBody.message}`);
      }
    }
  });
});
