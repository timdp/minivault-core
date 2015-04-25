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

var Minivault = function(options) {
  this._options = options || {};
};

Minivault.prototype.get = function(id) {
  return readFile(this._getPath(id)).then(this._decrypt.bind(this));
};

Minivault.prototype.getSync = function(id) {
  var buffer = fs.readFileSync(this._getPath(id));
  return this._decrypt(buffer);
};

Minivault.prototype.put = function(id, data) {
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

Minivault.prototype.putSync = function(id, data) {
  var root = this._getRootPath();
  try {
    fs.statSync(root);
  } catch (e) {
    fs.mkdirSync(root);
  }
  fs.writeFileSync(this._getPath(id), this._encrypt(data));
};

Minivault.prototype.delete = function(id) {
  return unlink(this._getPath(id));
};

Minivault.prototype.deleteSync = function(id) {
  fs.unlinkSync(this._getPath(id));
};

Minivault.prototype._encrypt = function(data) {
  var cipher = crypto.createCipher(this._getAlgorithm(), this._getSecret());
  var contents = this._serialize(data);
  return Buffer.concat([cipher.update(contents), cipher.final()]);
};

Minivault.prototype._decrypt = function(buffer) {
  var decipher = crypto.createDecipher(this._getAlgorithm(), this._getSecret());
  var data = Buffer.concat([decipher.update(buffer), decipher.final()]);
  return this._deserialize(data.toString('utf8'));
};

Minivault.prototype._serialize = function(data) {
  return JSON.stringify(data);
};

Minivault.prototype._deserialize = function(data) {
  return JSON.parse(data);
};

Minivault.prototype._getPath = function(id) {
  var sha1 = crypto.createHash('sha1');
  sha1.update(id);
  return path.join(this._getRootPath(), sha1.digest('hex'));
};

Minivault.prototype._getRootPath = function() {
  return path.join(userHome, '.minivault');
};

Minivault.prototype._getSecret = function() {
  return this._options.secret;
};

Minivault.prototype._getAlgorithm = function() {
  return this._options.algorithm || 'aes256';
};

module.exports = Minivault;
