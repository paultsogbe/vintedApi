
//Tests de Non-Régression(exécute toutes les routes principales après chaque modification)
const request = require('supertest');
const app = require('../app');

describe('Regression Tests', () => {
  it('should fetch offers', async () => {
    const res = await request(app).get('/offers');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('count');
    expect(Array.isArray(res.body.offers)).toBeTruthy();
  });

  it('should handle invalid routes gracefully', async () => {
    const res = await request(app).get('/invalid-route');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'Route not found');
  });
});
