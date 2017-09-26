angular.module('AI').directive('fadeOut', [
    function () {
        return {
            restrict: 'A',
            scope: {
                'when': '=fadeOut'
            },
            link: function (scope, elem) {

                var scrollParent = elem.parent().parent();

                var atBottom = function() {
                    return scrollParent[0].scrollHeight - scrollParent.parent().height() === scrollParent.scrollTop();
                };

                elem.hover(function () {
                    if (scope.when && atBottom()) {
                        elem.stop().fadeTo(1000, 1);
                    }
                }, function () {
                    if (scope.when && atBottom()) {
                        elem.stop().fadeTo(3000, 0.1);
                    }
                });

                scrollParent.scroll(function () {
                    if (scope.when) {
                        if (atBottom()) {
                            elem.stop().fadeTo(3000, 0.1);
                        } else {
                            elem.stop().fadeTo(1000, 1);
                        }
                    }
                });

            }
        };
    }
]);