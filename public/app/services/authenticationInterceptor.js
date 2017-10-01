/**
 * The authentication interceptor catches any request that returns 401 or 403 errors and
 * automatically redirects the user to the login page. The route that was originally requested is recorded so that
 * after login, the route can be reloaded.
 */
angular.module('AI').factory('authenticationInterceptor', [
    '$q',
    '$injector',

    function ($q,
              $injector) {

        'use strict';

        return {
            responseError: function (rejection) {
                var authenticationService = $injector.get('authenticationService');

                if ((rejection.status === 401 || rejection.status === 403) && rejection.config.ignoreAuthFail !== true) {
                    authenticationService.redirectToLogin();
                }

                return $q.reject(rejection);
            },
            request: function (config) {
                var authenticationService = $injector.get('authenticationService');

                config.headers['x-access-token'] = authenticationService.token;
                return config;
            }
        };
    }
]);