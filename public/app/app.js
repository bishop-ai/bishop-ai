angular.module('AI', ['ngRoute', 'ngSanitize']);

angular.module('AI').constant('version', "1.0.0");
angular.module('AI').constant('debugMode', 0);
angular.module('AI').constant('appName', 'J.A.R.V.I.S.');

angular.module('AI').factory('socket', ['socketFactory', function (socketFactory) {
    return socketFactory();
}]);

angular.module('AI').config([
    '$routeProvider',

    function ($routeProvider) {
        // Setup the Module routes mapping URLs to Controller/View
        $routeProvider
            .when('/', {
                templateUrl: 'app/views/interface.html',
                controller: 'InterfaceCtrl'
            })
            .when('/plugins', {
                templateUrl: 'app/views/plugins.html',
                controller: 'PluginsCtrl',
                resolve: {
                    plugins: ['$http', function ($http) {
                        return $http.get("/api/plugins").then(function (response) {
                            return response.data;
                        });
                    }]
                }
            });
    }
]);

angular.module('AI').run([
    '$rootScope',
    'appName',

    function ($rootScope,
              appName) {

        $rootScope.appName = appName;
    }
]);

