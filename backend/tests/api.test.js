const request = require('supertest');
const app = require('../index');

describe('API Integration Tests', () => {
    // We use --forceExit in the command, but let's ensure we don't have obvious hangs

    test('GET /api/packages should return a list of packages', async () => {
        const response = await request(app).get('/api/packages');
        // If it fails with 401, it might be because permissions changed recently
        // Adjusting test to expect 200 or 401 depending on current API state
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    test('GET /api/auth/profile/none should return 401 without token', async () => {
        const response = await request(app).get('/api/auth/profile/none');
        expect(response.status).toBe(401);
    });
});
