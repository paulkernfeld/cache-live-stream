cache-live-stream caches append-only live streams using levelup.

[![Build Status](https://travis-ci.org/paulkernfeld/cache-live-stream.svg)](https://travis-ci.org/paulkernfeld/cache-live-stream) [![npm](https://img.shields.io/npm/dt/cache-live-stream.svg)](https://www.npmjs.com/package/cache-live-stream)

Append-only live streams make great canonical data stores. With an append-only stream, you can safely cache the contents of the stream at any time. When you start reading from the stream again, you can pick up where your cache ends. That's what this library does.

Usage
-----

See `example.js` for a runnable example.

Pass in a levelup db to create a new instance of `CacheLiveStream`. Make sure to set the `valueEncoding` to match the type of value that your live stream produces.

```
var makeLiveStream = function (latestEntry, cb) {
  var liveStream = ...  // Make your live stream here
  cb(null, liveStream))
}

var db = memdb({'valueEncoding': 'json'})
var cacheLiveStream = CacheLiveStream(db, makeLiveStream)
```

`cacheLiveStream.readable` is a readable stream that emits all elements of the live stream, including cached elements and live elements.

Call `cacheLiveStream.close()` when you're done.