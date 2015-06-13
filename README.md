# Minivault (Core)

[![npm](https://img.shields.io/npm/v/minivault-core.svg)](https://www.npmjs.com/package/minivault-core) [![Build Status](https://img.shields.io/travis/timdp/minivault-core.svg)](https://travis-ci.org/timdp/minivault-core) [![Coverage Status](https://img.shields.io/coveralls/timdp/minivault-core.svg)](https://coveralls.io/r/timdp/minivault-core) [![JavaScript Standard Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](https://github.com/feross/standard)

A pretty rudimentary vault. Keeps a key-value store under `~/.minivault`,
encrypted with a password.

This package provides the core API.
You may also be interested in the
[Web front end](https://www.npmjs.com/package/minivault)
and the
[RESTful API](https://www.npmjs.com/package/minivault-rest).

## Usage

```js
var Minivault = require('minivault-core')

var vault = new Minivault({secret: 'myMasterPassword'})

vault.get('someKey')
  .then(function (data) {
    console.info('Data for someKey:', data)
  })
  .catch(function (err) {
    console.error(err)
  })

vault.put('someOtherKey', data)
  .then(function () {
    console.info('Data stored')
  })
  .catch(function (err) {
    console.error(err)
  })

vault.delete('uselessKey')
  .then(function () {
    console.info('Key deleted')
  })
  .catch(function (err) {
    console.error(err)
  })

vault.index()
  .then(function (keys) {
    console.info('Keys in vault:', keys)
  })
  .catch(function (err) {
    console.error(err)
  })
```

A synchronous API is also available. The corresponding functions are
`getSync`, `putSync`, `deleteSync`, and `indexSync`.

## Author

[Tim De Pauw](https://tmdpw.eu/)

## License

MIT
