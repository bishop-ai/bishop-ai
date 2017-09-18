angular.module('AI').directive('scrollBottom', [
    function () {
        return {
            restrict: 'A',
            scope: {
                'updateOn': '=scrollBottom'
            },
            link: function (scope, elem) {

                scope.$watch('updateOn', function () {
                    elem.scrollTop(Number.MAX_SAFE_INTEGER);
                }, true);

            }
        };
    }
]);