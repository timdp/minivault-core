'use strict'

export default vault => {
  for (let i = 1; i <= 3; ++i) {
    vault.putSync('id' + i, {password: 'password' + i})
  }
}
