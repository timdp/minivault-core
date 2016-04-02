'use strict'

import fs from 'fs'
import path from 'path'

export default (vault) => {
  fs.writeFileSync(path.join(vault.rootPath, 'index'), 'FAIL', {encoding: 'utf8'})
}
