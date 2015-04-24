var userHome = require('user-home'),
    promisify = require('es6-promisify'),
    crypto = require('crypto'),
    fs = require('fs'),
    path = require('path');

var readFile = promisify(fs.readFile),
    writeFile = promisify(fs.writeFile),
    unlink = promisify(fs.unlink),
    mkdir = promisify(fs.mkdir),
    stat = promisify(fs.stat);

var Keychain = function(options) {
  this._options = options || {};
};

Keychain.prototype.get = function(id) {
  return readFile(this._getPath(id)).then(this._decrypt.bind(this));
};

Keychain.prototype.put = function(id, data) {
  var that = this;
  var root = this._getRootPath();
  return stat(root)
    .catch(function() {
      return mkdir(root);
    })
    .then(function() {
      return writeFile(that._getPath(id), that._encrypt(data));
    });
};

Keychain.prototype.delete = function(id) {
  return unlink(this._getPath(id));
};

Keychain.prototype._encrypt = function(data) {
  var cipher = crypto.createCipher(this._getAlgorithm(), this._getSecret());
  var contents = this._serialize(data);
  return Buffer.concat([cipher.update(contents), cipher.final()]);
};

Keychain.prototype._decrypt = function(buffer) {
  var decipher = crypto.createDecipher(this._getAlgorithm(), this._getSecret());
  var data = Buffer.concat([decipher.update(buffer), decipher.final()]);
  return this._deserialize(data.toString('utf8'));
};

Keychain.prototype._serialize = function(data) {
  return JSON.stringify(data);
};

Keychain.prototype._deserialize = function(data) {
  return JSON.parse(data);
};

Keychain.prototype._getPath = function(id) {
  var sha1 = crypto.createHash('sha1');
  sha1.update(id);
  return path.join(this._getRootPath(), sha1.digest('hex'));
};

Keychain.prototype._getRootPath = function() {
  return path.join(userHome, '.keychain');
};

Keychain.prototype._getSecret = function() {
  return this._options.secret;
};

Keychain.prototype._getAlgorithm = function() {
  return this._options.algorithm || 'aes256';
};

module.exports = Keychain;
