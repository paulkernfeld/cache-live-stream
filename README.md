cache-live-stream caches append-only live streams using levelup.

[![Build Status](https://travis-ci.org/paulkernfeld/cache-live-stream.svg)](https://travis-ci.org/paulkernfeld/cache-live-stream) [![npm](https://img.shields.io/npm/dt/cache-live-stream.svg)](https://www.npmjs.com/package/cache-live-stream)

Append-only live streams make great canonical data stores. With an append-only stream, you can safely cache the contents of the stream at any time. When you start reading from the stream again, you can pick up where your cache ends. That's what this library does.

See `example.js` for a working example.
