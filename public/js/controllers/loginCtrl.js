(function() {

  angular
    .module('meanApp')
    .controller('loginCtrl', loginCtrl);

    function loginCtrl () {
      console.log('Login controller is running');
    }

})();
