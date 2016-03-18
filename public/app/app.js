angular.module('AI', ['ngRoute']);

angular.module('AI').constant('version', "1.0.0");
angular.module('AI').constant('debugMode', 0);
angular.module('AI').constant('appName', 'AI');

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
            .when('/dashboard', {
                templateUrl: 'app/views/dashboard.html',
                controller: 'DashboardCtrl',
                resolve: {
                    activeTab: ['$location', function ($location) {
                        return $location.search().tab;
                    }]
                },
                reloadOnSearch: false
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

