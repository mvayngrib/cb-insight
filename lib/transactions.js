var async = require('async')
var request = require('superagent')
var bitcoin = require('./bitcoin')

function Transactions(url) {
  this.url = url
  this._limit = 25
}

Transactions.prototype.propagate = function(rawTxs, callback) {
  var self = this

  var makeRequest = function(txHex, callback) {
    request.post(self.url + 'tx/send').send('rawtx=' + txHex).end(function(res) {
      if (!res.ok) return callback(new Error('non-ok http status code'), res)

      var data = {
        txId: res.body.txid
      }

      callback(null, data)
    })
  }

  var txs = Array.isArray(rawTxs) ? rawTxs : [ rawTxs ]
  var fns = txs.map(function(tx) {
    return function(callback) { makeRequest(tx, callback) }
  })

  async.parallelLimit(fns, self._limit, function(err, results) {
    if (err) return callback(err, results)
    callback(null, Array.isArray(rawTxs) ? results : results[0])
  })
}

Transactions.prototype.get = function(txIds, callback) {
  var self = this
  var makeRequest = function(txId, callback) {
    request.get(self.url + 'rawtx/' + txId).end(function(res) {
      if (!res.ok) return callback(new Error('non-ok http status code'), res)

      callback(null, res.body.rawtx)
    })
  }

  var gotArray = Array.isArray(txIds)
  if (!gotArray) txIds = [txIds]

  var fns = txIds.map(function(txId) {
    return function(callback) { makeRequest(txId, callback) }
  })

  async.parallelLimit(fns, self._limit, function(err, results) {
    if (err) return callback(err, results)

    results = results.map(function (txHex, i) {
      return {
        txId: txIds[i],
        txHex: txHex
      }
    })

    callback(null, gotArray ? results : results[0])
  })
}

module.exports = Transactions
