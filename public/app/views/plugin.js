angular.module('AI').controller('PluginCtrl', [
    '$rootScope',
    '$scope',
    '$http',
    '$interpolate',
    'plugin',

    function ($rootScope,
              $scope,
              $http,
              $interpolate,
              plugin) {

        $scope.plugin = plugin;
        $scope.saving = false;

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

        $scope.startOauth = function (option) {
            var url = $interpolate(option.oauth.url)($scope);

            var width = 450,
                height = 730,
                left = (screen.width / 2) - (width / 2),
                top = (screen.height / 2) - (height / 2);

            window.addEventListener("message", function (event) {
                $scope.$apply(function () {
                    var params = JSON.parse(event.data);
                    if (params[option.oauth.urlParam]) {
                        option.value = params[option.oauth.urlParam];
                    }
                });
            }, false);

            window.open(url,
                'OAuth Authentication',
                'menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left
            );
        };
    }
]);