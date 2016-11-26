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

  // Store keys as binary-encoded strings to make both Level.js and LevelDOWN happy.
  this.readable = mapStream(function (obj, cb) {
    if (!self.madeStream) {
      // Reading from the DB
      counter = new BN(Buffer.from(obj.key).toString('hex'), 16, 'be')
      value = obj.value
      cb(null, deserialize(value))
    } else {
      // Reading from the real stream, writing to the DB
      counter = counter.bincn(0)
      db.put(
        counter.toArrayLike(Buffer, 'be', 8).toString('binary'),
        obj,
        {},
        function (err) {
          value = obj
          cb(err, deserialize(obj))
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
