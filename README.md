cache-live-stream caches append-only live streams using levelup.

[![Build Status](https://travis-ci.org/paulkernfeld/cache-live-stream.svg)](https://travis-ci.org/paulkernfeld/cache-live-stream) [![npm](https://img.shields.io/npm/dt/cache-live-stream.svg)](https://www.npmjs.com/package/cache-live-stream)

Append-only live streams make great canonical data stores. With an append-only stream, you can safely cache new values as they appear. When you start reading from the stream again, you can pick up where your cache ends. That's what this library does.

Usage
-----

See `example.js` for a runnable example.

```
var makeLiveStream = function (latestValue, cb) {
  var liveStream = ...  // Make your live stream here
  cb(null, liveStream))
}

var db = memdb({valueEncoding: 'json'})
var cacheLiveStream = CacheLiveStream(db, makeLiveStream)
```

Arguments:

- Arg #1 must be a levelup db. Make sure to set the `valueEncoding` to match the type of value that your live stream produces.
- Arg #2 is a function that asynchronously returns a new live stream, starting where the cache left off. Your live stream must produce serialized values that can be saved as values in the db.
- Arg #3 contains options:
  - `deserialize` is an optional synchronous function that lets you deserialize elements.

`cacheLiveStream.readable` is a readable stream that emits all elements of the live stream, including cached elements and live elements.

Call `cacheLiveStream.close()` when you're done.
