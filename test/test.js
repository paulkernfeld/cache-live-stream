var from2 = require('from2')
var memdb = require('memdb')
var tape = require('tape')
var toArray = require('stream-to-array')

var CacheLiveStream = require('..')

tape('Overall functionality', function (t) {
  var db = memdb()

  // Make a CLS and put 0...999 into it
  var expected1 = []
  for (var j = 0; j < 1000; j++) {
    expected1.push(j)
  }
  var makeStream1 = function (last, cb) {
    t.same(last, undefined)

    var i = 0
    cb(null, from2.obj(function (size, next) {
      if (i < 1000) {
        next(null, i++)
      } else {
        next(null, null)
      }
    }))
  }
  var cls1 = CacheLiveStream(db, makeStream1)
  toArray(cls1.readable, function (err, arr) {
    t.ifErr(err)
    t.same(arr, expected1)
  })

  cls1.readable.on('end', function () {
    // Make a CLS and put 1000...2000 into it
    var expected2 = []
    for (var j = 0; j < 2000; j++) {
      expected2.push(j)
    }
    var makeStream2 = function (last, cb) {
      t.same(last, 999)

      var i = 1000
      cb(null, from2.obj(function (size, next) {
        if (i < 2000) {
          next(null, i++)
        } else {
          next(null, null)
        }
      }))
    }

    var cls2 = CacheLiveStream(db, makeStream2)

    toArray(cls2.readable, function (err, arr) {
      t.ifErr(err)
      t.same(arr, expected2)
      t.end()
    })
  })
})
