'use strict';

const SetResponseStream = require('./');
const from = require('from2-string');
const concat = require('concat-stream');
const url = require('url');
const http = require('http');
const assume = require('assume');
const request = require('request-stream');

function address(server) {
  const socket = server.address();
  const target = {};
  target.protocol = 'http:';
  target.hostname = '127.0.0.1';
  target.port = socket.port;

  return url.format(target);
}

describe('set-response-stream', function () {
  let server;

  beforeEach(function (done) {
   server = new http.Server().listen(0, done);
  });

  it('it should return a proper 200 response when using constructor', function (done) {
    const payload = 'hello there my good friend';
    const reason = 'Way OK';
    server.once('request', (req, res) => {
      new SetResponseStream(from(payload), {
        statusCode: 200,
        statusMessage: reason,
        trigger: true
      }).pipe(res);
    });

    request(address(server), (err, res) => {
      assume(err).to.be.falsey();
      assume(res.statusCode).equals(200);
      assume(res.statusMessage).equals(reason);

      res.pipe(concat(data => {
        assume(data.toString()).equals(payload);
        done();
      }));
    });
  });

  it('should return a 304 response when using deferred method', function (done) {
    server.once('request', (req, res) => {
      const stream = new SetResponseStream(from(''));
      stream.pipe(res);

      setImmediate(() => stream.setStatus(304));
    });

    request(address(server), (err, res) => {
      assume(err).is.falsey();
      assume(res.statusCode).equals(304);

      res.pipe(concat(data => {
        assume(data.toString()).equals('');
        done();
      }));
    });
  });

  it('should return a 304 response with headers using both deferred methods', function (done) {
    const headers = {
      my: 'special',
      headers: 'yay'
    };
    server.once('request', (req, res) => {
      const stream = new SetResponseStream(from(''));
      stream.pipe(res);

      setImmediate(() => {
        stream.setStatus(304, { trigger: false });
        setImmediate(() => stream.setHeaders(headers));
      });
    });

    request(address(server), (err, res) => {
      assume(err).is.falsey();
      assume(res.statusCode).equals(304);
      assume(res.headers['my']).equals(headers['my']);
      assume(res.headers['headers']).equals(headers['headers']);
      done();
    });
  });


});
