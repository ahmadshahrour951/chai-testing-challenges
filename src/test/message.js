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

  it('should load all messages', (done) => {
    agent.get('/messages').end((err, res) => {
      if (err) done(err);

      expect(res).to.have.status(200);
      expect(res.body.messages).to.be.an('array').with.lengthOf(1);
      done();
    });
  });

  it('should get one specific message', (done) => {
    agent.get(`/messages/${TEST_MESSAGE_ID_1}`).end((err, res) => {
      if (err) done(err);

      expect(res).to.have.status(200);
      expect(res.body).is.instanceof(Object);

      expect(res.body).to.have.property('title', 'titletest1');
      expect(res.body).to.have.property('body', 'bodytest1');
      done();
    });
  });

  it('should post a new message', (done) => {
    const messageTest_2 = new Message({
      title: 'titletest2',
      body: 'bodytest2',
      author: TEST_AUTHOR_ID,
      _id: TEST_MESSAGE_ID_2,
    });

    agent
      .post('/messages')
      .send(messageTest_2)
      .end((err, res) => {
        if (err) done(err);

        // Checking agent response
        expect(res).to.have.status(200);
        expect(res.body).is.instanceof(Object);
        expect(res.body).to.have.property('title', 'titletest2');
        expect(res.body).to.have.property('body', 'bodytest2');

        // Checking directly in database
        Message.findById(TEST_MESSAGE_ID_2)
          .then((message) => {
            expect(message).is.instanceof(Object);
            expect(message).to.have.property('title', 'titletest2');
            expect(message).to.have.property('body', 'bodytest2');
            return done();
          })
          .catch((error) => {
            console.log(error)
            done(error)
          });
      });
  });

  it('should update a message', (done) => {
    const messageUpdate = {
      title: 'updatedTitle',
      body: 'updatedBody',
    };

    agent
      .put(`/messages/${TEST_MESSAGE_ID_1}`)
      // .set('content-type', 'application/x-www-form-urlencoded')
      .send(messageUpdate)
      .end((err, res) => {
        if (err) done(err);

        // Checking agent response
        expect(res).to.have.status(200);
        expect(res.body).is.instanceof(Object);
        expect(res.body.message).to.have.property('title', 'updatedTitle');
        expect(res.body.message).to.have.property('body', 'updatedBody');

        // Checking directly in database
        Message.findById(TEST_MESSAGE_ID_1)
          .then((message) => {
            expect(message).is.instanceof(Object);
            expect(message).to.have.property('title', 'updatedTitle');
            expect(message).to.have.property('body', 'updatedBody');
            return done();
          })
          .catch((error) => {
            console.log(error);
            done(error);
          });
      });
  });

  it('should delete a message', (done) => {
    agent.delete(`/messages/${TEST_MESSAGE_ID_1}`).end((err, res) => {
      if (err) done(err);

      // Checking agent response
      expect(res).to.have.status(200);
      expect(res.body).is.instanceof(Object);
      expect(res.body).to.have.property(
        'message',
        'Message Successfully deleted.'
      );
      expect(res.body).to.have.property('_id', TEST_MESSAGE_ID_1);

      // Checking directly in database
      Message.findById(TEST_MESSAGE_ID_1)
        .then((message) => {
          expect(message).to.equal(null);
          done();
        })
        .catch((error) => {
          console.log(error);
          done(error);
        });
    });
  });
});
