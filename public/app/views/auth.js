angular.module('AI').controller('AuthCtrl', [
    '$rootScope',
    '$scope',
    '$http',
    'authenticationService',

    function ($rootScope,
              $scope,
              $http,
              authenticationService) {

        $scope.username = "";
        $scope.password = "";

        $scope.login = function () {
            if (!$scope.username || !$scope.password) {
                alert("Username and password are required.");
            }

            authenticationService.login(
                $scope.username,
                $scope.password
            ).then(function () {
                $rootScope.$emit("fire");
                authenticationService.redirectFromLogin();
            }, function () {
                alert("Incorrect username or password.");
            });
        };

        $scope.register = function () {
            if (!$scope.username || !$scope.password) {
                alert("Username and password are required.");
            }

            authenticationService.register(
                $scope.username,
                $scope.password
            ).then(function () {
                $rootScope.$emit("fire");
                authenticationService.redirectFromLogin();
            }, function (error) {
                alert(error.data);
            });
        };
    }
]);