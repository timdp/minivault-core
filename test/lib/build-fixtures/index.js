'use strict'

import path from 'path'
import Minivault from '../../../'

export default (SECRET, FIXTURES_PATH) => {
  const builders = [
    'id_password_x3'
  ]

  for (let builderID of builders) {
    const builder = require('./' + builderID)
    const root = path.join(FIXTURES_PATH, builderID)
    const vault = new Minivault({secret: SECRET, root})
    builder(vault)
  }
}
