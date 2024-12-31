//Tests de Sécurité (Vérification des Permissions et des Entrées)

const request = require('supertest');
const app = require('../app');

describe('Security Tests', () => {
  it('should not allow unauthorized access to protected routes', async () => {
    const res = await request(app).post('/offer/publish').send({
      title: 'Unauthorized Offer',
      price: 100,
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized');
  });

  it('should handle SQL injection attempts', async () => {
    const res = await request(app).get("/offers?title=' OR '1'='1");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.offers)).toBeTruthy();
  });
});
