
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const fileRoutes = require('../routes/fileRoutes');
const User = require('../models/User');
const File = require('../models/File');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuth = (req, res, next) => {
  req.user = { _id: new mongoose.Types.ObjectId() };
  next();
};

app.use('/api/files', mockAuth, fileRoutes);

let server;

describe('File API', () => {
  let user;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fileparser-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    user = new User({ name: 'Test User', email: 'test@test.com', password: 'password' });
    await user.save();
    server = app.listen(4001);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await File.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  it('should upload a file', async () => {
    const filePath = path.join(__dirname, 'test.csv');
    fs.writeFileSync(filePath, 'col1,col2\nval1,val2');

    const res = await request(app)
      .post('/api/files')
      .attach('file', filePath)
      .set('Authorization', 'Bearer testtoken');

    fs.unlinkSync(filePath);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('file');
  });

  it('should get a list of files', async () => {
    const res = await request(app)
      .get('/api/files')
      .set('Authorization', 'Bearer testtoken');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('files');
  });
});
