'use strict'

import userHome from 'user-home'
import promisify from 'es6-promisify'
import mkdirp_ from 'mkdirp'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)
const stat = promisify(fs.stat)
const mkdirp = promisify(mkdirp_)

class Minivault {
  constructor (config) {
    if (config === null || typeof config !== 'object') {
      throw new Error('Invalid configuration')
    }
    if (typeof config.secret !== 'string' || config.secret.length === 0) {
      throw new Error('Invalid secret')
    }
    this._config = config
  }
  get indexPath () {
    return path.join(this.rootPath, 'index')
  }
  get rootPath () {
    return (typeof this._config.root === 'string') ? this._config.root :
      path.join(userHome, '.minivault')
  }
  get secret () {
    return this._config.secret
  }
  get algorithm () {
    return this._config.algorithm || 'aes256'
  }
  index () {
    return readFile(this.indexPath)
      .then(buffer => this._decrypt(buffer), err => {
        if (err.code === 'ENOENT') {
          return []
        }
        throw err
      })
  }
  indexSync () {
    let buffer = null
    try {
      buffer = fs.readFileSync(this.indexPath)
    } catch (err) {
      if (err.code === 'ENOENT') {
        return []
      }
      throw err
    }
    return this._decrypt(buffer)
  }
  get (id) {
    return readFile(this._getPath(id))
      .then(buffer => this._decrypt(buffer))
  }
  getSync (id) {
    return this._decrypt(fs.readFileSync(this._getPath(id)))
  }
  put (id, data) {
    const root = this.rootPath
    return stat(root)
      .catch(() => mkdirp(root))
      .then(() => writeFile(this._getPath(id), this._encrypt(data)))
      .then(() => this.index())
      .then(index => {
        if (index.indexOf(id) < 0) {
          index.push(id)
          return this._writeIndex(index)
        }
      })
  }
  putSync (id, data) {
    const root = this.rootPath
    try {
      fs.statSync(root)
    } catch (e) {
      mkdirp_.sync(root)
    }
    fs.writeFileSync(this._getPath(id), this._encrypt(data))
    const index = this.indexSync()
    if (index.indexOf(id) < 0) {
      index.push(id)
      this._writeIndexSync(index)
    }
  }
  delete (id) {
    return unlink(this._getPath(id))
      .then(() => this.index())
      .then(index => {
        const i = index.indexOf(id)
        if (i >= 0) {
          index.splice(i, 1)
          return this._writeIndex(index)
        }
      })
  }
  deleteSync (id) {
    fs.unlinkSync(this._getPath(id))
    const index = this.indexSync()
    const i = index.indexOf(id)
    if (i >= 0) {
      index.splice(i, 1)
      this._writeIndexSync(index)
    }
  }
  _writeIndex (index) {
    return writeFile(this.indexPath, this._encrypt(index))
  }
  _writeIndexSync (index) {
    fs.writeFileSync(this.indexPath, this._encrypt(index))
  }
  _getPath (id) {
    const sha1 = crypto.createHash('sha1')
    sha1.update(id)
    return path.join(this.rootPath, sha1.digest('hex'))
  }
  _encrypt (data) {
    const cipher = crypto.createCipher(this.algorithm, this.secret)
    const contents = Minivault._serialize(data)
    return Buffer.concat([cipher.update(contents), cipher.final()])
  }
  _decrypt (buffer) {
    const decipher = crypto.createDecipher(this.algorithm, this.secret)
    const data = Buffer.concat([decipher.update(buffer), decipher.final()])
    return Minivault._deserialize(data.toString('utf8'))
  }
  static _serialize (data) {
    return JSON.stringify(data)
  }
  static _deserialize (data) {
    return JSON.parse(data)
  }
}

export default Minivault
