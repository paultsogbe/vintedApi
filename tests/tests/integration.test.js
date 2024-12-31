
// Tests d’Intégration
const request = require('supertest');
const app = require('../app');

describe('Integration Tests', () => {
  it('should create a user and allow login', async () => {
    const signupRes = await request(app).post('/user/signup').send({
      email: 'integration@example.com',
      password: 'password123',
      username: 'integrationuser',
    });
    expect(signupRes.status).toBe(201);

    const loginRes = await request(app).post('/user/login').send({
      email: 'integration@example.com',
      password: 'password123',
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
  });

  it('should create and fetch an offer', async () => {
    const loginRes = await request(app).post('/user/login').send({
      email: 'integration@example.com',
      password: 'password123',
    });
    const token = loginRes.body.token;

    const createRes = await request(app)
      .post('/offer/publish')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Integration Offer',
        price: 50,
      });
    expect(createRes.status).toBe(201);

    const fetchRes = await request(app).get(`/offers/${createRes.body._id}`);
    expect(fetchRes.status).toBe(200);
    expect(fetchRes.body.product_name).toBe('Integration Offer');
  });
});
