# set-response-stream

A Stream like object that wraps a given readable stream when being used to pipe
to a response stream.


## Install
```sh
npm install set-response-stream --save
```

## API

### `new SetResponseStream(stream [, options])`

Optional options include:
  - `status` - StatusCode to be sent with the response
  - `headers` - Headers to be sent with the response
  - `trigger` - Don't wait for `.setStatus` or `setHeaders` to be called, start
    the flow of data ASAP. This assumes you have already set your statusCode and
    any headers you may have wished to send.


### `.setStatus(statusCode [, statusMessage][, options])`

Set the statusCode and optional statusMessage for the response. If
`options.trigger === false` it will prevent the data from automatically flowing
to the response. This is useful if you need to `setHeaders` after setting the
statusCode. Either method will trigger the flow of data by default.

### `.setHeaders(headers [, options])`

Set the headers that will be sent in the response. Same applies for
`options.trigger` as it does above

## Example

### Setting headers to the response

We are able to set the headers of a response after we have already setup the
pipe chain to our readable stream. This is possible because we defer calling the
actual PIPE until we have been given the go-ahead by `setStatus()` or
`setHeaders()`

```js
const http = require('http');
const SetResponseStream = require('set-response-stream');
const from = require('from2-string');

http.createServer((req, res) => {
  //
  // We use from in this example but it could be any readable stream
  //
  const stream = new SetResponseStream(from('Hello World'));
  stream.pipe(res);

  //
  // Based on some async event, we can still add headers that will
  // automatically be added to our response and then trigger the flushing of the
  // data to the client
  //
  setImmediate(() => {
    stream.setHeaders({
      my: 'cool',
      headers: 'man'
    });
  });
});

```
