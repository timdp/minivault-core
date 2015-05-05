'use strict'

var userHome = require('user-home')
var promisify = require('es6-promisify')
var mkdirp_ = require('mkdirp')
var crypto = require('crypto')
var fs = require('fs')
var path = require('path')

var readFile = promisify(fs.readFile)
var writeFile = promisify(fs.writeFile)
var unlink = promisify(fs.unlink)
var stat = promisify(fs.stat)
var mkdirp = promisify(mkdirp_)

var Minivault = function (config) {
  if (config === null || typeof config !== 'object') {
    throw new Error('Invalid configuration')
  }
  if (typeof config.secret !== 'string' || config.secret.length === 0) {
    throw new Error('Invalid secret')
  }
  this._config = config
}

Minivault.prototype.index = function () {
  return readFile(this._getIndexPath())
    .then(this._decrypt.bind(this), function (err) {
      if (err.code === 'ENOENT') {
        return []
      }
      throw err
    })
}

Minivault.prototype.indexSync = function (id) {
  var buffer = null
  try {
    buffer = fs.readFileSync(this._getIndexPath(id))
  } catch (err) {
    if (err.code === 'ENOENT') {
      return []
    }
    throw err
  }
  return this._decrypt(buffer)
}

Minivault.prototype.get = function (id) {
  return readFile(this._getPath(id)).then(this._decrypt.bind(this))
}

Minivault.prototype.getSync = function (id) {
  var buffer = fs.readFileSync(this._getPath(id))
  return this._decrypt(buffer)
}

Minivault.prototype.put = function (id, data) {
  var root = this._getRootPath()
  return stat(root)
    .catch(function () {
      return mkdirp(root)
    })
    .then(function () {
      return writeFile(this._getPath(id), this._encrypt(data))
    }.bind(this))
    .then(this.index.bind(this))
    .then(function (index) {
      if (index.indexOf(id) < 0) {
        index.push(id)
        return this._writeIndex(index)
      }
    }.bind(this))
}

Minivault.prototype.putSync = function (id, data) {
  var root = this._getRootPath()
  try {
    fs.statSync(root)
  } catch (e) {
    mkdirp_.sync(root)
  }
  fs.writeFileSync(this._getPath(id), this._encrypt(data))
  var index = this.indexSync()
  if (index.indexOf(id) < 0) {
    index.push(id)
    this._writeIndexSync(index)
  }
}

Minivault.prototype.delete = function (id) {
  return unlink(this._getPath(id))
    .then(this.index.bind(this))
    .then(function (index) {
      var i = index.indexOf(id)
      if (i >= 0) {
        index.splice(i, 1)
        return this._writeIndex(index)
      }
    }.bind(this))
}

Minivault.prototype.deleteSync = function (id) {
  fs.unlinkSync(this._getPath(id))
  var index = this.indexSync()
  var i = index.indexOf(id)
  if (i >= 0) {
    index.splice(i, 1)
    this._writeIndexSync(index)
  }
}

Minivault.prototype._writeIndex = function (index) {
  return writeFile(this._getIndexPath(), this._encrypt(index))
}

Minivault.prototype._writeIndexSync = function (index) {
  fs.writeFileSync(this._getIndexPath(), this._encrypt(index))
}

Minivault.prototype._encrypt = function (data) {
  var cipher = crypto.createCipher(this._getAlgorithm(), this._getSecret())
  var contents = this._serialize(data)
  return Buffer.concat([cipher.update(contents), cipher.final()])
}

Minivault.prototype._decrypt = function (buffer) {
  var decipher = crypto.createDecipher(this._getAlgorithm(), this._getSecret())
  var data = Buffer.concat([decipher.update(buffer), decipher.final()])
  return this._deserialize(data.toString('utf8'))
}

Minivault.prototype._serialize = function (data) {
  return JSON.stringify(data)
}

Minivault.prototype._deserialize = function (data) {
  return JSON.parse(data)
}

Minivault.prototype._getIndexPath = function () {
  return path.join(this._getRootPath(), 'index')
}

Minivault.prototype._getPath = function (id) {
  var sha1 = crypto.createHash('sha1')
  sha1.update(id)
  return path.join(this._getRootPath(), sha1.digest('hex'))
}

Minivault.prototype._getRootPath = function () {
  return (typeof this._config.root === 'string') ? this._config.root :
    path.join(userHome, '.minivault')
}

Minivault.prototype._getSecret = function () {
  return this._config.secret
}

Minivault.prototype._getAlgorithm = function () {
  return this._config.algorithm || 'aes256'
}

module.exports = Minivault
