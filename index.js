var assert = require('assert')

var through2 = require('through2')
var LevelWriteStream = require('level-write-stream')
var BN = require('bn.js')
var debug = require('debug')('cache-live-stream')

function CacheLiveStream (db, makeStream) {
  if (!(this instanceof CacheLiveStream)) return new CacheLiveStream(db, makeStream)
  var self = this
  this.madeStream = null

  debug('new')

  // Use BN to lexicographically order our levelup keys
  var counter = new BN(0)

  this.dbReadStream = db.createReadStream({keys: true, values: true, keyEncoding: 'binary', valueEncoding: 'json'})
  var dbWriteStream = LevelWriteStream(db)({valueEncoding: 'json'})

  this.dbReadStream.on('end', function () {
    debug('finished with db')
    makeStream(value, function (err, stream) {
      assert.ifError(err)
      debug('made stream')
      self.madeStream = stream
      self.madeStream.pipe(self.readable)
      self.madeStream.on('end', function () {
        debug('made stream ended')
        self.close()
      })
    })
  })

  var value
  this.readable = through2.obj(function (obj, enc, cb) {
    if (!self.madeStream) {
      // Reading from the DB
      counter = new BN(obj.key.toString('hex'), 16, 'be')
      value = obj.value
      debug('from db', value, 'counter is', counter.toNumber())
    } else {
      // Reading from the real stream
      value = obj
      counter = counter.bincn(0)
      dbWriteStream.write({
        key: counter.toBuffer('be', 8),
        value: value
      })
      debug('from live stream', value, 'counter is', counter.toNumber())
    }

    this.push(value)
    cb()
  })
  this.dbReadStream.pipe(this.readable, {end: false})
}

CacheLiveStream.prototype.close = function () {
  debug('closing')
  if (this.madeStream) {
    this.madeStream.unpipe(this.readable)
  } else {
    this.dbReadStream.unpipe(this.readable)
  }
}

module.exports = CacheLiveStream
