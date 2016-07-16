(function() {

  angular
    .module('meanApp')
    .controller('profileCtrl', profileCtrl);

    function profileCtrl () {
      console.log('Profile controller is running');
    }

})();
