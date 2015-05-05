'use strict'

module.exports = function (vault) {
  for (var i = 1; i <= 3; ++i) {
    vault.putSync('id' + i, {password: 'password' + i})
  }
}
