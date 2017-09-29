angular.module('AI').directive('fadeOut', [
    function () {
        return {
            restrict: 'A',
            scope: {
                'when': '=fadeOut'
            },
            link: function (scope, elem, attrs) {

                var scrollParent = elem.parent().parent();

                var atBottom = function() {
                    return scrollParent[0].scrollHeight - scrollParent.parent().height() === scrollParent.scrollTop();
                };

                if (scope.when && (!attrs.withScroll || atBottom())) {
                    elem.stop().fadeTo(3000, 0.1);
                }

                elem.hover(function () {
                    if (scope.when && (!attrs.withScroll || atBottom())) {
                        elem.stop().fadeTo(1000, 1);
                    }
                }, function () {
                    if (scope.when && (!attrs.withScroll || atBottom())) {
                        elem.stop().fadeTo(3000, 0.1);
                    }
                });

                if (attrs.withScroll) {
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

            }
        };
    }
]);