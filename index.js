var assert = require('assert')

var BN = require('bn.js')
var debug = require('debug')('cache-live-stream')
var mapStream = require('map-stream')

function CacheLiveStream (db, makeStream, opts) {
  if (!(this instanceof CacheLiveStream)) return new CacheLiveStream(db, makeStream, opts)
  var self = this

  opts = opts || {}
  // The deserializer defaults to doing nothing
  var deserialize = opts.deserialize || function (v) { return v }
  var keyEncoding = opts.keyEncoding || 'binary'

  this.madeStream = null

  debug('new')

  // Use BN to lexicographically order our levelup keys
  var counter = new BN(0)
  var value

  this.dbReadStream = db.createReadStream({keys: true, values: true, keyEncoding: 'binary', valueEncoding: 'json'})

  this.dbReadStream.on('end', function () {
    debug('finished with db')
    makeStream(value, function (err, stream) {
      assert.ifError(err)
      debug('made stream')
      self.madeStream = stream
      self.madeStream.pipe(self.readable)
    })
  })

  // Store keys as strings to make both Level.js and LevelDOWN happy.
  this.readable = mapStream(function (obj, cb) {
    if (!self.madeStream) {
      // Reading from the DB
      counter = new BN(Buffer.from(obj.key, keyEncoding).toString('hex'), 16, 'be')
      value = deserialize(obj.value)
      cb(null, value)
    } else {
      // Reading from the real stream, writing to the DB
      // console.log(counter.toArrayLike(Buffer, 'be').toString('hex'))
      counter = counter.bincn(0)
      // console.log(counter.toArrayLike(Buffer, 'be').toString('hex'))
      db.put(
        counter.toArrayLike(Buffer, 'be', 8).toString(keyEncoding),
        obj,
        {},
        function (err) {
          value = deserialize(obj)
          cb(err, value)
        })
    }
  })

  this.dbReadStream.pipe(this.readable, { end: false })
}

CacheLiveStream.prototype.close = function () {
  debug('closing')
  if (this.madeStream) {
    debug('unpiping made stream')
    this.madeStream.unpipe(this.readable)
  } else {
    debug('unpiping db read stream')
    this.dbReadStream.unpipe(this.readable)
  }
}

module.exports = CacheLiveStream
