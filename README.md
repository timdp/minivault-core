# Minivault (Core) [![npm](https://img.shields.io/npm/v/minivault-core.svg)](https://www.npmjs.com/package/minivault-core) ![Bower](https://img.shields.io/bower/v/minivault-core.svg) [![Build Status](https://img.shields.io/travis/timdp/minivault-core.svg)](https://travis-ci.org/timdp/minivault-core) [![Coverage Status](https://img.shields.io/coveralls/timdp/minivault-core.svg)](https://coveralls.io/r/timdp/minivault-core)

A pretty rudimentary vault. Keeps a key-value store under `~/.minivault`,
encrypted with a password.

This package provides the core API. For the Web front end, see
[minivault](https://www.npmjs.com/package/minivault).

## Usage

```js
var Minivault = require('minivault-core');

var vault = new Minivault({secret: 'myMasterPassword'});

vault.get('someKey')
  .then(function(data) {
    console.info('Data for someKey:', data);
  })
  .catch(function(err) {
    console.error(err);
  });

vault.put('someOtherKey', data)
  .then(function() {
    console.info('Data stored');
  })
  .catch(function(err) {
    console.error(err);
  });

vault.delete('uselessKey')
  .then(function() {
    console.info('Key deleted');
  })
  .catch(function(err) {
    console.error(err);
  });
```

## Author

[Tim De Pauw](https://tmdpw.eu/)

## License

Copyright &copy; 2015 Tim De Pauw

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
