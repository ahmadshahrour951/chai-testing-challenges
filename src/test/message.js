require('dotenv').config();
const app = require('../server.js');
const mongoose = require('mongoose');
const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;

const User = require('../models/user.js');
const Message = require('../models/message.js');

chai.config.includeStack = true;

const expect = chai.expect;
const should = chai.should();
chai.use(chaiHttp);
const agent = chai.request.agent(app);

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {};
  mongoose.modelSchemas = {};
  mongoose.connection.close();
  done();
});

// Three randomly generated test mongo ids
const TEST_AUTHOR_ID = '602f41eb0937edf298486ac4';
const TEST_MESSAGE_ID_1 = '602f41f17f3cb147b7c5a39d';
const TEST_MESSAGE_ID_2 = '602f41f5ba4e8287fa25c919';

describe('Message API endpoints', () => {
  beforeEach((done) => {
    const userTest = new User({
      username: 'usernametest',
      password: 'passwordtest',
      _id: TEST_AUTHOR_ID,
    });

    const messageTest_1 = new Message({
      title: 'titletest1',
      body: 'bodytest1',
      author: TEST_AUTHOR_ID,
      _id: TEST_MESSAGE_ID_1,
    });

    userTest
      .save()
      .then(() => {
        return messageTest_1.save();
      })
      .then(() => {
        done();
      })
      .catch((err) => done(err));
  });

  afterEach((done) => {
    User.deleteMany({ username: { $ne: '' } })
      .then(() => Message.deleteMany({ title: { $ne: '' } }))
      .then(() => {
        done();
      })
      .catch((err) => done(err));
  });
