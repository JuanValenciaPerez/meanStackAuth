'use strict';

// Dependencies
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var cors = require('cors');

module.exports = function(app) {
  app.use('/', bodyParser.json());
  app.use('/', morgan('dev'));
  app.use('/', cors());
  app.use('/', express.static('./public'));
};
