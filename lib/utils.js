
var bitcoin = require('./bitcoin')
var Transaction = bitcoin.Transaction
var Script = bitcoin.Script

module.exports = {
  txFromJSON: txFromJSON,
  reverseHexBuffer: reverseHexBuffer
}

function txFromJSON (json) {
  var tx = new Transaction()
  tx.version = json.version
  tx.ins = json.vin.map(function (vin) {
    var hash = reverseHexBuffer(vin.txid)
    var script
    if (Transaction.isCoinbaseHash(hash)) {
      script = new bitcoin.Script(toBuffer(vin.scriptSig.hex), [])
    } else {
      script = bitcoin.Script.fromBuffer(toBuffer(vin.scriptSig.hex))
    }

    return {
      hash: hash,
      index: vin.vout,
      script: script,
      sequence: vin.sequence
    }
  })

  tx.outs = json.vout.map(function (vout) {
    return {
      value: btcToSatoshi(vout.value),
      script: bitcoin.Script.fromBuffer(toBuffer(vout.scriptPubKey.hex))
    }
  })

  tx.locktime = json.locktime
  return tx
}

function toBuffer (str) {
  return new Buffer(str, 'hex')
}

function reverseHexBuffer (str) {
  return toBuffer(str.match(/.{2}/g).reverse().join(''))
}

function btcToSatoshi(value) {
  return Math.round(1e8 * parseFloat(value))
}
