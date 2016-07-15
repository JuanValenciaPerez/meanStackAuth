# MEAN Stack Authentication

## 1.0 Server-side

### 1.1 Creating the MongoDB Data Schema with Mongoose

First we have to define our User model with all its properties and methods.

#### User Schema: `app/models/user.js`

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

`Export`:
```javascript
module.exports = mongoose.model('User', userSchema);
```

### 1.2 Setup Passport to Handle the Express Authentication

First we have to install `passport` and `passport-local` locally.

```
$ npm install passport passport-local --save
```

Next we have to configure `Passport`. The strategy definition will look like this:

#### Strategy: `app/config/passport.js`

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

#### Server: `index.js`

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
### 1.3 Configure API Controllers

First we have to define the controller functions for our authentication endpoints. The `/api/register` and `/api/login` endpoints are non secure routes!

#### Authentication Controller: `app/controllers/authentication.js`

`Dependencies`:
```javascript
var passport = require('passport');
var User = require('../models/user');
```

`Helper Function`:
```javascript
function sendJSONresponse(res, status, content) {
  res.status(status);
  res.json(content);
}
```

`Register`:
```javascript
function register(req, res) {
  if(!req.body.name || !req.body.email || !req.body.password) {
    sendJSONresponse(res, 400, {
      "message": "All fields required"
    });
    return;
  }

  var user = new User();

  user.name = req.body.name;
  user.email = req.body.email;

  user.setPassword(req.body.password);

  user.save(function(err) {
    var token;
    token = user.generateJwt();
    res.status(200);
    res.json({
      "token" : token
    });
  });
}
```

`Login`:
```javascript
function login(req, res) {
  if(!req.body.email || !req.body.password) {
    sendJSONresponse(res, 400, {
      "message": "All fields required"
    });
    return;
  }

  passport.authenticate('local', function(err, user, info){
    var token;

    // If Passport throws/catches an error
    if (err) {
      res.status(404).json(err);
      return;
    }

    // If a user is found
    if(user){
      token = user.generateJwt();
      res.status(200);
      res.json({
        "token" : token
      });
    } else {
      // If user is not found
      res.status(401).json(info);
    }
  })(req, res);
}
```

`Export`:
```javascript
module.exports = {
  register: register,
  login: login
};
```

Next we have to define the profile controller for our secure `/api/profile` API route.

#### Profile Controller: `app/controllers/profile.js`

`Dependencies`:
```javascript
var User = require('../models/user');
```

`Read`:
```javascript
function read(req, res) {
  if (!req.payload._id) {
    res.status(401).json({
      "message" : "UnauthorizedError: private profile"
    });
  } else {
    User
      .findById(req.payload._id)
      .exec(function(err, user) {
        res.status(200).json(user);
      });
  }
}
```

`Export`:
```javascript
module.exports = {
  read: read
};
```

### 1.4 Configure API Routes

We have to make sure that only authenticated users can access the `/api/profile` route. The way to validate a request is to ensure that the JWT sent with it is genuine, by using the secret again. To validate the JWT we need to install the following molule:

```
$ npm install express-jwt --save
```

Then we need to require it and configure it in our secure routes.

#### Routes: `app/routes/api.js`

`Dependencies`:
```javascript
var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var config = require('../config/config');
```

`Middelware`:
```javascript
var auth = jwt({
  secret: config.jwt.secret,
  userProperty: 'payload'
});
```

`Controller`:
```javascript
var profileCtrl = require('../controllers/profile');
var authCtrl = require('../controllers/authentication');
```

`Routes`:
```javascript
router.get('/profile', auth, profileCtrl.read);
router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
```

`Export`:
```javascript
module.exports = router;
```
**Important: To secure an API Route we just have to add the `auth` middelware to the route!**

**The placement of all of these items inside `index.js` is quite important, as they need fit into a certain sequence.**

`Passport` should be initialised as Express middleware just before the API routes are added, as these routes are the first time that `Passport` will be used.

#### Server: `index.js`

`Middelware`:
```javascript
require('./app/middelware/main')(app);
app.use(passport.initialize());
app.use('/api', routesApi);
```

### 1.5 Configure Error handling

To make sure our API plays nicely, we should catch common errors and return a proper response by creating some custom middelware.

#### Server: `app/middelware/error.js`

`Middelware`:
```javascript
module.exports = function(app) {
  // Handle 404
  app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // Handle 500 and every other status
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({"message": err.name + ": " + err.message});
  });
};
```
