angular.module('AI').controller('PluginsCtrl', [
    '$rootScope',
    '$scope',
    '$http',
    'plugins',

    function ($rootScope,
              $scope,
              $http,
              plugins) {

        $scope.plugins = plugins;
        $scope.availablePlugins = [];
        $scope.saving = false;

        $scope.tabs = [
            {name: "Loaded", active: true},
            {name: "Find New Plugins", active: false}
        ];

        $scope.setActiveTab = function (index) {
            var i;
            for (i = 0; i < $scope.tabs.length; i++) {
                $scope.tabs[i].active = false;
            }
            $scope.tabs[index].active = true;
        };

        var updatePlugin = function (plugin) {
            $scope.saving = true;
            return $http.put("/api/plugins/" + plugin.namespace, plugin).then(function (response) {
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

    }
]);