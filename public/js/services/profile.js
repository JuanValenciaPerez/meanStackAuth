(function() {

  angular
    .module('meanApp')
    .service('profile', profile);

  profile.$inject = ['$http', 'authentication'];
  function profile ($http, authentication) {

    var getProfile = function () {
      return $http.get('/api/profile', {
        headers: {
          Authorization: 'Bearer '+ authentication.getToken()
        }
      });
    };

    return {
      getProfile : getProfile
    };
  }

})();
