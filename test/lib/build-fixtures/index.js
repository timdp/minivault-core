var path = require('path'),
    Minivault = require('../../../');

module.exports = function(SECRET, FIXTURES_PATH) {
  var builders = [
    'id_password_x3'
  ];

  builders.forEach(function(builderID) {
    var builder = require('./' + builderID);
    var root = path.join(FIXTURES_PATH, builderID);
    var vault = new Minivault({secret: SECRET, root: root});
    builder(vault);
  });
};
