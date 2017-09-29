angular.module('AI').controller('PluginCtrl', [
    '$rootScope',
    '$scope',
    '$http',
    'plugin',

    function ($rootScope,
              $scope,
              $http,
              plugin) {

        $scope.plugin = plugin;
        $scope.saving = false;

        var updatePlugin = function (plugin) {
            $scope.saving = true;
            return $http.put("/api/plugins/" + plugin.name, plugin).then(function (response) {
                $scope.saving = false;
                return response;
            }, function (error) {
                $scope.saving = false;
                return error;
            });
        };

        $scope.updatePluginOptions = function () {
            updatePlugin($scope.plugin).then(function () {
                $rootScope.$broadcast("fire");
            }, function () {
                alert("Error updating plugin");
            });
        };

        $scope.enablePlugin = function () {
            $scope.plugin.enabled = true;

            updatePlugin($scope.plugin).then(function () {
                $rootScope.$broadcast("fire");
            }, function () {
                alert("Error enabling plugin");
            });
        };

        $scope.disablePlugin = function () {
            $scope.plugin.enabled = false;

            updatePlugin($scope.plugin).then(function () {
                $rootScope.$broadcast("fire");
            }, function () {
                alert("Error disabling plugin");
            });
        };
    }
]);