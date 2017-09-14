angular.module('AI').directive('scrollBottom', [
    function () {
        return {
            restrict: 'A',
            scope: {
                'updateOn': '=scrollBottom'
            },
            link: function (scope, elem) {

                scope.$watch('updateOn', function () {
                    elem.animate({ scrollTop: elem[0].scrollHeight}, 1000);
                }, true);

            }
        };
    }
]);