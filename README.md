# MEAN Stack Authentication

## 1.0 Server-side

### 1.1 Creating the MongoDB Data Schema with Mongoose

User Schema: `app/models/user.js`

`Dependencies`:
```javascript
var mongoose = require( 'mongoose' );
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var config = require('../config/config');
```

`User Schema`:
```javascript
var userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  hash: String,
  salt: String
});
```

`User Methods`:
```javascript
userSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

userSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
  return this.hash === hash;
};

userSchema.methods.generateJwt = function() {
  var expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  return jwt.sign({
    _id: this._id,
    email: this.email,
    name: this.name,
    exp: parseInt(expiry.getTime() / 1000),
  }, config.jwt.secret);
};
```

### 1.2 Setup Passport to Handle the Express Authentication

First we have to install `passport` and `passport-local` locally.

`$ npm install passport passport-local --save`

Next we have to configure `Passport`. The strategy definition will look like this:

Strategy: `app/config/passport.js`

`Dependencies`:
```javascript
var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');
```

`Middelware`:
```javascript
module.exports = function(passport) {
  passport.use(new LocalStrategy({
      usernameField: 'email'
    },
    function(username, password, done) {
      User.findOne({ email: username }, function (err, user) {
        if (err) { return done(err); }
        // Return if user not found in database
        if (!user) {
          return done(null, false, {
            message: 'User not found'
          });
        }
        // Return if password is wrong
        if (!user.validPassword(password)) {
          return done(null, false, {
            message: 'Password is wrong'
          });
        }
        // If credentials are correct, return the user object
        return done(null, user);
      });
    }
  ));
};
```

Now `Passport` just needs to be added to the application. So in `index.js` we need to require the `Passport` module, require and invoke `passport.js` as middleware.

Server: `index.js`

`Dependencies`:
```javascript
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
```

`Passport middelware`:
```javascript
require('./app/config/passport')(passport);
```
