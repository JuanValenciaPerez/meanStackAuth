(function() {

  angular
    .module('meanApp')
    .controller('profileCtrl', profileCtrl);

  profileCtrl.$inject = ['$location', 'profile'];
  function profileCtrl($location, profile) {
    var vm = this;

    vm.user = {};

    profile.getProfile()
      .success(function(data) {
        vm.user = data;
      })
      .error(function(e) {
        console.log(e);
      });
  }

})();
