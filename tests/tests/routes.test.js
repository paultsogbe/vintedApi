
//Tests Fonctionnels( Test des Routes avec Supertest)
const request = require('supertest');
const app = require('./index'); 

describe('API Routes', () => {
  it('should return offers with filters applied', async () => {
    const res = await request(app).get('/offers?title=Test&priceMin=10');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('offers');
  });

  it('should create a new user', async () => {
    const res = await request(app).post('/user/signup').send({
      email: 'newuser@example.com',
      password: 'password123',
      username: 'newuser',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('email', 'newuser@example.com');
  });

  it('should fail to create a user with an existing email', async () => {
    const res = await request(app).post('/user/signup').send({
      email: 'test@example.com',
      password: 'password123',
      username: 'duplicateuser',
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('This email already has an account');
  });
});
