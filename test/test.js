var from2 = require('from2')
var level = require('level-browserify')
var memdb = require('memdb')
var tape = require('tape')
var toArray = require('stream-to-array')

var CacheLiveStream = require('..')

var runTest = function (opts) {
  tape(opts.testName, function (t) {
    // Make a CLS and put 0...999 into it
    var expected1 = []
    for (var j = 0; j < 1000; j++) {
      if (opts.deserialize) {
        expected1.push(opts.deserialize(j))
      } else {
        expected1.push(j)
      }
    }
    var makeStream1 = function (last, cb) {
      t.same(last, undefined, 'last #1 should be undefined')

      var i = 0
      cb(null, from2.obj(function (size, next) {
        if (i < 1000) {
          next(null, i++)
        } else {
          next(null, null)
        }
      }))
    }
    var cls1 = CacheLiveStream(opts.db, makeStream1, { deserialize: opts.deserialize })
    toArray(cls1.readable, function (err, arr) {
      t.ifErr(err, 'no error on #1')
      t.same(arr, expected1, '#1 correct values')
    })

    cls1.readable.on('end', function () {
      // Make a CLS and put 1000...2000 into it
      var expected2 = []
      for (var j = 0; j < 2000; j++) {
        if (opts.deserialize) {
          expected2.push(opts.deserialize(j))
        } else {
          expected2.push(j)
        }
      }
      var makeStream2 = function (last, cb) {
        t.same(last, opts.last)

        var i = 1000
        cb(null, from2.obj(function (size, next) {
          if (i < 2000) {
            next(null, i++)
          } else {
            next(null, null)
          }
        }))
      }

      var cls2 = CacheLiveStream(opts.db, makeStream2, { deserialize: opts.deserialize })

      toArray(cls2.readable, function (err, arr) {
        t.ifErr(err, 'no error on #2')
        t.same(arr, expected2, '#2 correct values')
        t.end()
      })
    })
  })
}

runTest({
  testName: 'memdb',
  db: memdb(),
  last: 999
})
runTest({
  testName: 'deserialize',
  db: memdb(),
  last: { wrap: 999 },
  deserialize: function (v) { return { wrap: v } }
})
runTest({
  testName: 'level-browserify',
  db: level('test.db'),
  last: 999
})
