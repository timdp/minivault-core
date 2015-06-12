'use strict'

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import path from 'path'

global.SECRET = 'p4ssw0rd!'
global.FIXTURES_PATH = path.join(__dirname, '..', 'fixtures')

if (process.env.BUILD_FIXTURES) {
  require('./build-fixtures')(global.SECRET, global.FIXTURES_PATH)
}

chai.use(chaiAsPromised)

global.expect = chai.expect
