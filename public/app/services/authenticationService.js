/**
 * The AuthenticationService handles auth calls to the server and redirection to and from the login page.
 */
angular.module('AI').factory('authenticationService', [
    '$http',
    '$location',
    '$q',
    '$rootScope',
    'localStorage',

    function ($http,
              $location,
              $q,
              $rootScope,
              localStorage) {

        'use strict';

        var authenticationService = {
            authChecked: false,
            redirectedUrl: '',
            token: localStorage.get(localStorage.keys.TOKEN)
        };

        /**
         * Ping the server to see if the user is authenticated
         * @returns {Promise} Resolved if authenticated. Rejected if not authenticated.
         */
        authenticationService.isAuthenticated = function (ignoreFail) {
            var dfd = $q.defer();

            $http({
                method: 'GET',
                url: "api/auth",
                ignoreAuthFail: true
            }).then(function (response) {
                $rootScope.authenticatedUser = response.data;
                dfd.resolve();
            }, function () {
                $rootScope.authenticatedUser = null;
                dfd.reject();
            });

            return dfd.promise;
        };

        /**
         * Used as a global resolve during state resolve to check if the user is authenticated. This will resolve
         * true if authentication has previously succeeded rather than calling the server again. If the app has not
         * been previously authenticated, a ping will be sent to the server to update the authentication status on the
         * client.
         * @returns {Promise} Resolved regardless.
         */
        authenticationService.hasStateBeenAuthenticated = function () {
            var dfd = $q.defer();

            if (this.authChecked || !this.token) {
                dfd.resolve();
            } else {
                this.isAuthenticated(true).then(function () {
                    authenticationService.authChecked = true;
                    dfd.resolve();
                }, function () {
                    authenticationService.authChecked = true;
                    dfd.resolve();
                });
            }

            return dfd.promise;
        };

        /**
         * Calls the authentication endpoint on the server to log a user in.
         * @param {String} username
         * @param {String} password
         * @returns {Promise} Resolved if authenticated. Rejected if not authenticated.
         */
        authenticationService.login = function (username, password) {
            var dfd = $q.defer();

            $http({
                method: 'POST',
                url: "api/auth",
                data: {username: username, password: password}
            }).then(function (response) {
                $rootScope.authenticatedUser = response.data.user;
                authenticationService.token = response.data.token;
                localStorage.set(localStorage.keys.TOKEN, response.data.token);
                dfd.resolve();
            }, function () {
                $rootScope.authenticatedUser = null;
                dfd.reject();
            });

            return dfd.promise;
        };

        authenticationService.logout = function () {
            $http({
                method: 'DELETE',
                url: "api/auth"
            }).finally(function () {
                localStorage.remove(localStorage.keys.TOKEN);
                $rootScope.authenticatedUser = null;
                authenticationService.token = "";
            });
        };

        /**
         * Calls the authentication endpoint on the server to register a user.
         * @param {String} username
         * @param {String} password
         * @returns {Promise} Resolved if authenticated. Rejected if not authenticated.
         */
        authenticationService.register = function (username, password) {
            var dfd = $q.defer();

            $http({
                method: 'POST',
                url: "api/users",
                data: {username: username, password: password}
            }).then(function (response) {
                $rootScope.authenticatedUser = response.data.user;
                authenticationService.token = response.data.token;
                localStorage.set(localStorage.keys.TOKEN, response.data.token);
                dfd.resolve();
            }, function (response) {
                $rootScope.authenticatedUser = null;
                dfd.reject(response);
            });

            return dfd.promise;
        };

        /**
         * Navigate to the login page and record the page that was redirected from.
         * Do not do anything if the current page is the login page.
         */
        authenticationService.redirectToLogin = function () {
            $rootScope.authenticatedUser = null;
            if ($location.path().indexOf('/login') === -1) {
                this.redirectedUrl = $location.path();
                $location.url('/login');
            }
        };

        /**
         * Redirect to the page that was recorded before redirecting to the login page.
         * If there was no page recorded or the page recorded is the login page, navigate to the home page.
         */
        authenticationService.redirectFromLogin = function () {
            if (this.redirectedUrl && this.redirectedUrl.indexOf('/login') === -1) {
                $location.url(this.redirectedUrl);
            } else {
                $location.url('/');
            }

            this.redirectedUrl = '';
        };

        return authenticationService;
    }
]);