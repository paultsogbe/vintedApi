
// Tests Unitaires


const mongoose = require('mongoose');
const Offer = require('../models/Offer');
const User = require('../models/User');

describe('Mongoose Models', () => {
  beforeAll(async () => {
    mongoose.connect('mongodb://localhost:27017/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should create a new Offer', async () => {
    const offer = new Offer({
      product_name: 'Test Product',
      product_price: 100,
    });
    const savedOffer = await offer.save();
    expect(savedOffer.product_name).toBe('Test Product');
    expect(savedOffer.product_price).toBe(100);
  });

  it('should create a new User', async () => {
    const user = new User({
      email: 'test@example.com',
      account: {
        username: 'testuser',
      },
    });
    const savedUser = await user.save();
    expect(savedUser.email).toBe('test@example.com');
    expect(savedUser.account.username).toBe('testuser');
  });
});


//Exemple : Tests des Modèles Mongoose
  