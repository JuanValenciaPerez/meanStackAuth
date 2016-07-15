'use strict';

// Dependencies
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');

// Passport middelware
require('./app/config/passport')(passport);

// Configuration
var config = require('./app/config/config');

// Routes
var routesApi = require('./app/routes/api');

// Express
var app = express();

// Middelware
require('./app/middelware/main')(app);
app.use(passport.initialize());
app.use('/api', routesApi);
require('./app/middelware/error')(app);

// Connection to database
mongoose.connect(config.db.uri, function(err) {
  console.log(err ? 'Connection to MongoDB failed!' : 'Connected to MongoDB at: ', config.db.uri);
});

// Connection to server
app.listen(config.server.port, function(err) {
  console.log(err ? 'Connection to node server failed!' : 'Server listening on port: ', config.server.port);
});
