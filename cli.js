var read = require('read'),
    Keychain = require('./');

var die = function(err) {
  console.error(err.stack || err);
  process.exit(1);
};

var readAll = function(fields, cb) {
  var results = [];
  var i = 0;
  var readMore = function() {
    if (i >= fields.length) {
      cb.apply(null, results);
    } else {
      var silent = (fields[i].charAt(0) === '*');
      var def = {
        prompt: (silent ? fields[i].substr(1) : fields[i]) + ': ',
        silent: silent
      };
      read(def, function(err, value) {
        if (err) {
          die(err);
        }
        if (value.length) {
          results.push(value);
          ++i;
        }
        readMore();
      });
    }
  };
  readMore();
};

var manageID = function(keychain, id, done) {
  readAll(['Key', 'Secret'], function(key, secret) {
    if (key && secret) {
      console.info('Writing data for %s', id);
      keychain.put(id, {
        key: key,
        secret: secret
      });
    }
    done();
  });
};

var manageKeychain = function(keychain) {
  readAll(['ID'], function(id) {
    keychain.get(id).then(function(data) {
      console.info('Current key for %s: %s', id, data.key);
    }, function(err) {
      if (err.code === 'ENOENT') {
        console.info('No current key for %s', id);
      } else {
        die(err);
      }
    }).then(function() {
      manageID(keychain, id, function() {
        manageKeychain(keychain);
      });
    });
  });
};

var manage = function(secret) {
  manageKeychain(new Keychain({secret: secret}));
};

var init = function() {
  readAll(['*Secret', '*Repeat'], function(secret, check) {
    if (secret !== check) {
      console.error('Secrets do not match!');
      init();
    } else {
      manage(secret);
    }
  });
};

console.log('Press Ctrl+C to exit');
init();
