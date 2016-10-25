'use strict';

const EE = require('events').EventEmitter;
const util = require('util');

const STATUS_CODES = require('http').STATUS_CODES;

module.exports = SetResponseStream;

util.inherits(SetResponseStream, EE);

/**
 * Wrap the stream passed into it and don't let
 * data get sent to the client until statusCode and/or headers are attached
 */
function SetResponseStream(stream, opts) {
  EE.call(this);
  opts = opts || {};
  this.stream = stream;
  this.status = opts.status || opts.statusCode || 200;
  this.statusMessage = opts.statusMessage || undefined;
  this.headers = opts.headers || {};
  this.ready = opts.trigger;
  this.stream.on('error', this.emit.bind(this, 'error'));
}

/**
 * We assume here that we are piping to a response stream
 */
SetResponseStream.prototype.pipe = function pipe(res, opts) {
  if (!this.ready) return this.once('ready', this.pipe.bind(this, res, opts));

  this.prepare(res);

  return this.stream.pipe(res, opts);
};

SetResponseStream.prototype.prepare = function prepare(res) {
  res.statusCode = this.status;
  res.statusMessage = this.statusMessage || STATUS_CODES[this.status] || 'unknown';

  //
  // Pulled from expressjs/response.js. We know there is no content so remove
  // headers if they had been previously set
  //
  if (this.status === 204 || this.status === 304) {
    res.removeHeader('Content-type');
    res.removeHeader('Content-length');
    res.removeHeader('Transfer-Encoding');
  }

  const keys = Object.keys(this.headers);

  if (!keys.length) return;

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    if (key) res.setHeader(key, this.headers[key]);
  }
};

SetResponseStream.prototype.setStatus = function setStatus(status, reason, options) {
  if (typeof reason === 'string') {
    this.statusMessage = reason;
  } else {
    this.statusMessage = this.statusMessage || STATUS_CODES[status] || 'unknown';
    options = reason;
  }

  options = options || {};

  this.status = status;

  if (options.trigger === false) return this;
  this.trigger();
};

SetResponseStream.prototype.setHeaders = function setHeaders(headers, options) {
  options = options || {};
  this.headers = headers;
  if (options.trigger === false) return this;
  this.trigger();
};

SetResponseStream.prototype.trigger = function trigger() {
  this.ready = true;
  this.emit('ready');
};

