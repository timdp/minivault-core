'use strict'

import del from 'del'
import fs from 'fs'
import path from 'path'
import Minivault from '../../../'

export default (SECRET, FIXTURES_PATH) => {
  const builders = [
    'corrupted',
    'uninitialized',
    'id_password_x3'
  ]

  for (let builderID of builders) {
    const builder = require('./' + builderID)
    const root = path.join(FIXTURES_PATH, builderID)
    const vault = new Minivault({secret: SECRET, root})
    del.sync(vault.rootPath)
    fs.mkdirSync(vault.rootPath)
    builder(vault)
  }
}
