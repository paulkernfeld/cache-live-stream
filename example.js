#!/usr/bin/env node

var timers = require('timers')
var levelup = require('levelup')
var from2 = require('from2')

var CacheLiveStream = require('./index')

var db = levelup('./example.db')

// This creates a live stream that generates all natural numbers in order.
// Note that it uses the argument to determine its starting point.
var makeNumberStream = function (lastNumber, cb) {
  if (!lastNumber) lastNumber = 0

  cb(null, from2.obj(function (size, next) {
    timers.setTimeout(function () {
      next(null, ++lastNumber)
    }, 100)
  }))
}

var cacheLiveStream = CacheLiveStream(db, makeNumberStream)

cacheLiveStream.readable.on('data', function (data) {
  console.log('data out', data)
})

// This is how to close this cleanly
process.on('SIGINT', function () {
  cacheLiveStream.close()
})
