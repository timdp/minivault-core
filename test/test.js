/* global describe, it, before */

var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var tmp = require('tmp')
var path = require('path')
var Minivault = require('../')

chai.use(chaiAsPromised)
var expect = chai.expect

var BUILD_FIXTURES = false

var SECRET = 'p4ssw0rd!'
var FIXTURES_PATH = path.join(__dirname, 'fixtures')

var tempDir = null
var getVault = function (fixtureID, badAuth) {
  var secret = badAuth ? 'NOPE' + SECRET : SECRET
  var root
  if (fixtureID) {
    tempDir = null
    root = path.join(FIXTURES_PATH, fixtureID)
  } else {
    tempDir = tmp.dirSync()
    root = path.join(tempDir.name, '.minivault')
  }
  return new Minivault({secret: secret, root: root})
}

describe('Minivault', function () {
  before(function () {
    if (BUILD_FIXTURES) {
      require('./lib/build-fixtures')(SECRET, FIXTURES_PATH)
    }
  })

  describe('#new()', function () {
    it('requires a configuration object', function () {
      expect(function () {
        new Minivault() // eslint-disable-line no-new
      }).to.throw(Error)
    })

    it('requires a secret', function () {
      expect(function () {
        new Minivault({secret: ''}) // eslint-disable-line no-new
      }).to.throw(Error)
    })

    it('stores the secret', function () {
      var vault = new Minivault({secret: SECRET})
      expect(vault._getSecret()).to.equal(SECRET)
    })

    it('stores the algorithm', function () {
      var algorithm = 'aes192'
      var vault = new Minivault({secret: SECRET, algorithm: algorithm})
      expect(vault._getAlgorithm()).to.equal(algorithm)
    })

    it('defaults to aes256', function () {
      var vault = new Minivault({secret: SECRET})
      expect(vault._getAlgorithm()).to.equal('aes256')
    })

    it('stores the root path', function () {
      var tempDir = tmp.dirSync()
      var vault = new Minivault({secret: SECRET, root: tempDir.name})
      expect(vault._getRootPath()).to.equal(tempDir.name)
      tempDir.removeCallback()
    })
  })

  describe('#index()', function () {
    it('returns an empty array by default', function () {
      var vault = getVault()
      expect(vault.index()).to.eventually.deep.equal([])
    })

    it('returns stored contents', function () {
      var vault = getVault('id_password_x3')
      expect(vault.index()).to.eventually.deep.equal(['id1', 'id2', 'id3'])
    })

    it('rejects on an uninitialized vault', function () {
      var vault = getVault()
      expect(vault.index()).to.be.rejected
    })

    it('rejects on a bad secret', function () {
      var vault = getVault('id_password_x3', true)
      expect(vault.index()).to.be.rejected
    })
  })

  describe('#indexSync()', function () {
    it('returns an empty array by default', function () {
      var vault = getVault()
      expect(vault.indexSync()).to.deep.equal([])
    })

    it('returns stored contents', function () {
      var vault = getVault('id_password_x3')
      expect(vault.indexSync()).to.deep.equal(['id1', 'id2', 'id3'])
    })

    it('throws on a bad secret', function () {
      var vault = getVault('id_password_x3', true)
      expect(function () {
        vault.indexSync()
      }).to.throw(Error)
    })
  })

  describe('#get()', function () {
    it('retrieves the data for an ID', function () {
      var vault = getVault()
      expect(vault.get('id1')).to.eventually.deep.equal({password: 'password1'})
    })

    it('rejects on a nonexistent ID', function () {
      var vault = getVault('id_password_x3')
      expect(vault.get('id42')).to.be.rejected
    })

    it('rejects on a bad secret', function () {
      var vault = getVault('id_password_x3', true)
      expect(vault.get('id1')).to.be.rejected
    })
  })

  describe('#getSync()', function () {
    it('retrieves the data for an ID', function () {
      var vault = getVault('id_password_x3')
      expect(vault.getSync('id1')).to.deep.equal({password: 'password1'})
    })

    it('throws on a nonexistent ID', function () {
      var vault = getVault('id_password_x3')
      expect(function () {
        vault.getSync('id42')
      }).to.throw(Error)
    })

    it('throws on a bad secret', function () {
      var vault = getVault('id_password_x3', true)
      expect(function () {
        vault.getSync('id1')
      }).to.throw(Error)
    })
  })

  describe('#put()', function () {
    it('stores the data for an ID', function () {
      var vault = getVault()
      expect(vault.put('id1', {password: 'letmein'})
        .then(function () {
          return vault.get('id1')
        })).to.eventually.deep.equal({password: 'letmein'})
    })

    it('overwrites data', function () {
      var vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      expect(vault.put('id1', {password: 'letmeout'})
        .then(function () {
          return vault.get('id1')
        })).to.eventually.deep.equal({password: 'letmeout'})
    })

    it('updates the index', function () {
      var vault = getVault()
      expect(vault.put('id1', {password: 'letmein'})
        .then(function () {
          return vault.index()
        })).to.eventually.deep.equal(['id1'])
    })

    it('rejects on a bad secret', function () {
      var vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      vault._config.secret = 'NOPE' + SECRET
      expect(vault.put('id2', {password: 'letmein'})).to.be.rejected
    })
  })

  describe('#putSync()', function () {
    it('stores the data for an ID', function () {
      var vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      expect(vault.getSync('id1')).to.deep.equal({password: 'letmein'})
    })

    it('overwrites data', function () {
      var vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      vault.putSync('id1', {password: 'letmeout'})
      expect(vault.getSync('id1')).to.deep.equal({password: 'letmeout'})
    })

    it('updates the index', function () {
      var vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      expect(vault.indexSync()).to.deep.equal(['id1'])
    })

    it('throws on a bad secret', function () {
      var vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      vault._config.secret = 'NOPE' + SECRET
      expect(function () {
        vault.putSync('id2', {password: 'letmein'})
      }).to.throw(Error)
    })
  })

  describe('#delete()', function () {
    it('removes data', function () {
      var vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      expect(vault.delete('id1')
        .then(function () {
          try {
            vault.getSync('id1')
          } catch (err) {
            return err
          }
        })).to.eventually.be.an.instanceof(Error)
    })

    it('updates the index', function () {
      var vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      vault.putSync('id2', {password: 'letmeout'})
      expect(vault.delete('id1')
        .then(function () {
          return vault.index()
        })).to.eventually.deep.equal(['id2'])
    })

    it('rejects on a bad secret', function () {
      var vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      vault._config.secret = 'NOPE' + SECRET
      expect(vault.delete('id1')).to.be.rejected
    })
  })

  describe('#deleteSync()', function () {
    it('removes data', function () {
      var vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      vault.deleteSync('id1')
      expect(function () {
        vault.getSync('id1')
      }).to.throw(Error)
    })

    it('updates the index', function () {
      var vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      vault.putSync('id2', {password: 'letmeout'})
      vault.deleteSync('id1')
      expect(vault.indexSync()).to.deep.equal(['id2'])
    })

    it('throws on a bad secret', function () {
      var vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      vault._config.secret = 'NOPE' + SECRET
      expect(function () {
        vault.deleteSync('id1', {password: 'letmein'})
      }).to.throw(Error)
    })
  })
})
