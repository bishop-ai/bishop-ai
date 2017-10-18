angular.module('AI').controller('PluginsCtrl', [
    '$rootScope',
    '$scope',
    '$location',
    '$http',
    'plugins',

    function ($rootScope,
              $scope,
              $location,
              $http,
              plugins) {

        $scope.plugins = plugins;
        $scope.availablePackages = [];
        $scope.saving = false;
        $scope.loadingAvailable = false;
        $scope.filter = "";

        $scope.tabs = [
            {name: "Installed Plugins", active: true},
            {name: "Find New Plugins", active: false}
        ];

        $scope.loadingAvailable = true;
        $http.get("api/packages").then(function (response) {
            $scope.loadingAvailable = false;

            var installedPkgNames = [];
            var i;
            for (i = 0; i < $scope.plugins.length; i++) {
                installedPkgNames.push($scope.plugins[i].name);
            }

            $scope.availablePackages = response.data.filter(function (pkg) {
                return installedPkgNames.indexOf(pkg.name) === -1;
            });
        }, function () {
            $scope.loadingAvailable = false;
        });

        $scope.setActiveTab = function (index) {
            var i;
            for (i = 0; i < $scope.tabs.length; i++) {
                $scope.tabs[i].active = false;
            }
            $scope.tabs[index].active = true;
        };

        var updatePlugin = function (plugin) {
            $scope.saving = true;
            return $http.put("api/plugins/" + plugin.name, plugin).then(function (response) {
                $scope.saving = false;
                return response;
            }, function (error) {
                $scope.saving = false;
                return error;
            });
        };

        $scope.enablePlugin = function (plugin) {
            plugin.enabled = true;

            updatePlugin(plugin).then(function () {
                $rootScope.$broadcast("fire");
            }, function () {
                alert("Error enabling plugin");
            });
        };

        $scope.disablePlugin = function (plugin) {
            plugin.enabled = false;

            updatePlugin(plugin).then(function () {
                $rootScope.$broadcast("fire");
            }, function () {
                alert("Error disabling plugin");
            });
        };

        $scope.installPackage = function (pkg) {
            $http.post("api/packages/", pkg).then(function () {
                $location.path("/plugins/" + pkg.name);
                $rootScope.$broadcast("fire");
            }, function () {
                alert("Error installing plugin");
            });
        };
    }
]);