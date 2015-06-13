/* global describe, it, expect, SECRET, FIXTURES_PATH */

'use strict'

import tmp from 'tmp'
import path from 'path'
import Minivault from '../../src/'

const getVault = (fixtureID, badAuth) => {
  const secret = badAuth ? 'NOPE' + SECRET : SECRET
  const root = fixtureID ? path.join(FIXTURES_PATH, fixtureID) :
    path.join(tmp.dirSync().name, '.minivault')
  return new Minivault({secret, root})
}

describe('Minivault', () => {
  describe('#new()', () => {
    it('requires a configuration object', () => {
      expect(() => {
        new Minivault() // eslint-disable-line no-new
      }).to.throw(Error)
    })

    it('requires a secret', () => {
      expect(() => {
        new Minivault({secret: ''}) // eslint-disable-line no-new
      }).to.throw(Error)
    })

    it('stores the secret', () => {
      const vault = new Minivault({secret: SECRET})
      expect(vault.secret).to.equal(SECRET)
    })

    it('stores the algorithm', () => {
      const algorithm = 'aes192'
      const vault = new Minivault({secret: SECRET, algorithm})
      expect(vault.algorithm).to.equal(algorithm)
    })

    it('defaults to aes256', () => {
      const vault = new Minivault({secret: SECRET})
      expect(vault.algorithm).to.equal('aes256')
    })

    it('stores the root path', () => {
      const tempDir = tmp.dirSync()
      const vault = new Minivault({secret: SECRET, root: tempDir.name})
      expect(vault.rootPath).to.equal(tempDir.name)
      tempDir.removeCallback()
    })
  })

  describe('#index()', () => {
    it('returns an empty array by default', () => {
      const vault = getVault()
      expect(vault.index()).to.eventually.deep.equal([])
    })

    it('returns stored contents', () => {
      const vault = getVault('id_password_x3')
      expect(vault.index()).to.eventually.deep.equal(['id1', 'id2', 'id3'])
    })

    it('rejects on an uninitialized vault', () => {
      const vault = getVault()
      expect(vault.index()).to.be.rejected
    })

    it('rejects on a bad secret', () => {
      const vault = getVault('id_password_x3', true)
      expect(vault.index()).to.be.rejected
    })
  })

  describe('#indexSync()', () => {
    it('returns an empty array by default', () => {
      const vault = getVault()
      expect(vault.indexSync()).to.deep.equal([])
    })

    it('returns stored contents', () => {
      const vault = getVault('id_password_x3')
      expect(vault.indexSync()).to.deep.equal(['id1', 'id2', 'id3'])
    })

    it('throws on a bad secret', () => {
      const vault = getVault('id_password_x3', true)
      expect(() => vault.indexSync()).to.throw(Error)
    })
  })

  describe('#get()', () => {
    it('retrieves the data for an ID', () => {
      const vault = getVault()
      expect(vault.get('id1')).to.eventually.deep.equal({password: 'password1'})
    })

    it('rejects on a nonexistent ID', () => {
      const vault = getVault('id_password_x3')
      expect(vault.get('id42')).to.be.rejected
    })

    it('rejects on a bad secret', () => {
      const vault = getVault('id_password_x3', true)
      expect(vault.get('id1')).to.be.rejected
    })
  })

  describe('#getSync()', () => {
    it('retrieves the data for an ID', () => {
      const vault = getVault('id_password_x3')
      expect(vault.getSync('id1')).to.deep.equal({password: 'password1'})
    })

    it('throws on a nonexistent ID', () => {
      const vault = getVault('id_password_x3')
      expect(() => vault.getSync('id42')).to.throw(Error)
    })

    it('throws on a bad secret', () => {
      const vault = getVault('id_password_x3', true)
      expect(() => vault.getSync('id1')).to.throw(Error)
    })
  })

  describe('#put()', () => {
    it('stores the data for an ID', () => {
      const vault = getVault()
      expect(vault.put('id1', {password: 'letmein'})
        .then(() => vault.get('id1'))).to.eventually.deep.equal({password: 'letmein'})
    })

    it('overwrites data', () => {
      const vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      expect(vault.put('id1', {password: 'letmeout'})
        .then(() => vault.get('id1'))).to.eventually.deep.equal({password: 'letmeout'})
    })

    it('updates the index', () => {
      const vault = getVault()
      expect(vault.put('id1', {password: 'letmein'})
        .then(() => vault.index())).to.eventually.deep.equal(['id1'])
    })

    it('rejects on a bad secret', () => {
      const vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      vault._config.secret = 'NOPE' + SECRET
      expect(vault.put('id2', {password: 'letmein'})).to.be.rejected
    })
  })

  describe('#putSync()', () => {
    it('stores the data for an ID', () => {
      const vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      expect(vault.getSync('id1')).to.deep.equal({password: 'letmein'})
    })

    it('overwrites data', () => {
      const vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      vault.putSync('id1', {password: 'letmeout'})
      expect(vault.getSync('id1')).to.deep.equal({password: 'letmeout'})
    })

    it('updates the index', () => {
      const vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      expect(vault.indexSync()).to.deep.equal(['id1'])
    })

    it('throws on a bad secret', () => {
      const vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      vault._config.secret = 'NOPE' + SECRET
      expect(() => vault.putSync('id2', {password: 'letmein'})).to.throw(Error)
    })
  })

  describe('#delete()', () => {
    it('removes data', () => {
      const vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      expect(vault.delete('id1')
        .then(() => {
          try {
            vault.getSync('id1')
          } catch (err) {
            return err
          }
        })).to.eventually.be.an.instanceof(Error)
    })

    it('updates the index', () => {
      const vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      vault.putSync('id2', {password: 'letmeout'})
      expect(vault.delete('id1')
        .then(() => vault.index())).to.eventually.deep.equal(['id2'])
    })

    it('rejects on a bad secret', () => {
      const vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      vault._config.secret = 'NOPE' + SECRET
      expect(vault.delete('id1')).to.be.rejected
    })
  })

  describe('#deleteSync()', () => {
    it('removes data', () => {
      const vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      vault.deleteSync('id1')
      expect(() => vault.getSync('id1')).to.throw(Error)
    })

    it('updates the index', () => {
      const vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      vault.putSync('id2', {password: 'letmeout'})
      vault.deleteSync('id1')
      expect(vault.indexSync()).to.deep.equal(['id2'])
    })

    it('throws on a bad secret', () => {
      const vault = getVault()
      vault.putSync('id1', {password: 'letmein'})
      vault._config.secret = 'NOPE' + SECRET
      expect(() => vault.deleteSync('id1', {password: 'letmein'})).to.throw(Error)
    })
  })
})
