(function () {

  angular
    .module('meanApp')
    .directive('navigation', navigation);

  function navigation () {
    return {
      restrict: 'EA',
      templateUrl: './js/directives/navigation/navigation.template.html',
      controller: 'navigationCtrl as navvm'
    };
  }

})();
