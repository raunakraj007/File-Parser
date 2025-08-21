
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('../routes/authRoutes');
const User = require('../models/User');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

let server;

describe('Auth API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fileparser-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    server = app.listen(4000);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
  });

  it('should login an existing user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });
});
