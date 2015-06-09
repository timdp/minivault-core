'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$defineProperty = require('babel-runtime/core-js/object/define-property')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

_Object$defineProperty(exports, '__esModule', {
  value: true
});

var _userHome = require('user-home');

var _userHome2 = _interopRequireDefault(_userHome);

var _es6Promisify = require('es6-promisify');

var _es6Promisify2 = _interopRequireDefault(_es6Promisify);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var readFile = (0, _es6Promisify2['default'])(_fs2['default'].readFile);
var writeFile = (0, _es6Promisify2['default'])(_fs2['default'].writeFile);
var unlink = (0, _es6Promisify2['default'])(_fs2['default'].unlink);
var stat = (0, _es6Promisify2['default'])(_fs2['default'].stat);
var mkdirp = (0, _es6Promisify2['default'])(_mkdirp2['default']);

var Minivault = (function () {
  function Minivault(config) {
    _classCallCheck(this, Minivault);

    if (config === null || typeof config !== 'object') {
      throw new Error('Invalid configuration');
    }
    if (typeof config.secret !== 'string' || config.secret.length === 0) {
      throw new Error('Invalid secret');
    }
    this._config = config;
  }

  _createClass(Minivault, [{
    key: 'index',
    value: function index() {
      var _this = this;

      return readFile(this.indexPath).then(function (buffer) {
        return _this._decrypt(buffer);
      }, function (err) {
        if (err.code === 'ENOENT') {
          return [];
        }
        throw err;
      });
    }
  }, {
    key: 'indexSync',
    value: function indexSync() {
      var buffer = null;
      try {
        buffer = _fs2['default'].readFileSync(this.indexPath);
      } catch (err) {
        if (err.code === 'ENOENT') {
          return [];
        }
        throw err;
      }
      return this._decrypt(buffer);
    }
  }, {
    key: 'get',
    value: function get(id) {
      var _this2 = this;

      return readFile(this._getPath(id)).then(function (buffer) {
        return _this2._decrypt(buffer);
      });
    }
  }, {
    key: 'getSync',
    value: function getSync(id) {
      return this._decrypt(_fs2['default'].readFileSync(this._getPath(id)));
    }
  }, {
    key: 'put',
    value: function put(id, data) {
      var _this3 = this;

      var root = this.rootPath;
      return stat(root)['catch'](function () {
        return mkdirp(root);
      }).then(function () {
        return writeFile(_this3._getPath(id), _this3._encrypt(data));
      }).then(function () {
        return _this3.index();
      }).then(function (index) {
        if (index.indexOf(id) < 0) {
          index.push(id);
          return _this3._writeIndex(index);
        }
      });
    }
  }, {
    key: 'putSync',
    value: function putSync(id, data) {
      var root = this.rootPath;
      try {
        _fs2['default'].statSync(root);
      } catch (e) {
        _mkdirp2['default'].sync(root);
      }
      _fs2['default'].writeFileSync(this._getPath(id), this._encrypt(data));
      var index = this.indexSync();
      if (index.indexOf(id) < 0) {
        index.push(id);
        this._writeIndexSync(index);
      }
    }
  }, {
    key: 'delete',
    value: function _delete(id) {
      var _this4 = this;

      return unlink(this._getPath(id)).then(function () {
        return _this4.index();
      }).then(function (index) {
        var i = index.indexOf(id);
        if (i >= 0) {
          index.splice(i, 1);
          return _this4._writeIndex(index);
        }
      });
    }
  }, {
    key: 'deleteSync',
    value: function deleteSync(id) {
      _fs2['default'].unlinkSync(this._getPath(id));
      var index = this.indexSync();
      var i = index.indexOf(id);
      if (i >= 0) {
        index.splice(i, 1);
        this._writeIndexSync(index);
      }
    }
  }, {
    key: '_writeIndex',
    value: function _writeIndex(index) {
      return writeFile(this.indexPath, this._encrypt(index));
    }
  }, {
    key: '_writeIndexSync',
    value: function _writeIndexSync(index) {
      _fs2['default'].writeFileSync(this.indexPath, this._encrypt(index));
    }
  }, {
    key: '_getPath',
    value: function _getPath(id) {
      var sha1 = _crypto2['default'].createHash('sha1');
      sha1.update(id);
      return _path2['default'].join(this.rootPath, sha1.digest('hex'));
    }
  }, {
    key: '_encrypt',
    value: function _encrypt(data) {
      var cipher = _crypto2['default'].createCipher(this.algorithm, this.secret);
      var contents = Minivault._serialize(data);
      return Buffer.concat([cipher.update(contents), cipher.final()]);
    }
  }, {
    key: '_decrypt',
    value: function _decrypt(buffer) {
      var decipher = _crypto2['default'].createDecipher(this.algorithm, this.secret);
      var data = Buffer.concat([decipher.update(buffer), decipher.final()]);
      return Minivault._deserialize(data.toString('utf8'));
    }
  }, {
    key: 'indexPath',
    get: function () {
      return _path2['default'].join(this.rootPath, 'index');
    }
  }, {
    key: 'rootPath',
    get: function () {
      return typeof this._config.root === 'string' ? this._config.root : _path2['default'].join(_userHome2['default'], '.minivault');
    }
  }, {
    key: 'secret',
    get: function () {
      return this._config.secret;
    }
  }, {
    key: 'algorithm',
    get: function () {
      return this._config.algorithm || 'aes256';
    }
  }], [{
    key: '_serialize',
    value: function _serialize(data) {
      return JSON.stringify(data);
    }
  }, {
    key: '_deserialize',
    value: function _deserialize(data) {
      return JSON.parse(data);
    }
  }]);

  return Minivault;
})();

exports['default'] = Minivault;
module.exports = exports['default'];