/* App Module */

angular.module('percdocs', []).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when('/',  {templateUrl: 'partials/index.html',  
                  controller: EntryCtrl}).
      when('/documentation', {templateUrl: 'partials/documentation.html', 
                              controller: DocCtrl}).
      when('/about', {templateUrl: 'partials/about.html', 
                              controller: DocCtrl}).
      otherwise({redirectTo: '/'});
}]);
