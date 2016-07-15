'use strict';

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
