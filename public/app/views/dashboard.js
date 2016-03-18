angular.module('AI').controller('DashboardCtrl', [
    '$scope',
    '$http',
    '$location',
    'activeTab',

    function ($scope,
              $http,
              $location,
              activeTab) {

        $scope.tabs = [
            {key: "create", name: "Create Expression"},
            {key: "inbox", name: "Inbox"},
            {key: "test", name: "Test Expression"}
        ];
        if (activeTab) {
            var i;
            for (i = 0; i < $scope.tabs.length; i++) {
                if ($scope.tabs[i].key === activeTab) {
                    $scope.activeTab = $scope.tabs[i];
                    break;
                }
            }
        } else {
            $scope.activeTab = $scope.tabs[0];
        }
        $scope.setActiveTab = function (tab) {
            $scope.activeTab = tab;
            $location.search({tab: tab.key});
        };

        $scope.expressionText = "";
        $scope.testResult = "";
        $scope.fromState = 'transfer';
        $scope.toState = 'transfer';
        $scope.fromExpressions = [];
        $scope.toExpressions = [];
        $scope.expressionTrigger = null;
        $scope.expressionInjector = null;
        $scope.fromExpressionFilterValue = "";
        $scope.toExpressionFilterValue = "";

        $scope.expressions = [];
        $scope.triggers = [];
        $scope.injectors = [];

        var getExpressions = function () {
            $http.get('/api/expressions').success(function (response) {
                $scope.expressions = response;
            });
        };

        var getTriggers = function () {
            $http.get('/api/triggers').success(function (response) {
                $scope.triggers = response;
            });
        };

        var getInjectors = function () {
            $http.get('/api/injectors').success(function (response) {
                $scope.injectors = response;
            });
        };

        var getInbox = function () {
            $http.get('/api/inbox').success(function (response) {
                $scope.inbox = response;
            });
        };

        $scope.toggleFromExpression = function (expression) {
            if ($scope.fromExpressions.indexOf(expression) >= 0) {
                $scope.fromExpressions.splice($scope.fromExpressions.indexOf(expression), 1);
            } else {
                $scope.fromExpressions.push(expression);
            }
        };
        $scope.toggleToExpression = function (expression) {
            if ($scope.toExpressions.indexOf(expression) >= 0) {
                $scope.toExpressions.splice($scope.toExpressions.indexOf(expression), 1);
            } else {
                $scope.toExpressions.push(expression);
            }
        };
        $scope.toggleExpressionTrigger = function (trigger) {
            if ($scope.expressionTrigger === trigger) {
                $scope.expressionTrigger = null;
            } else {
                $scope.expressionTrigger = trigger;
            }
        };
        $scope.toggleExpressionInjector = function (injector) {
            if ($scope.expressionInjector === injector) {
                $scope.expressionInjector = null;
            } else {
                $scope.expressionInjector = injector;
            }
        };

        $scope.refreshInbox = function () {
            getInbox();
        };

        $scope.submit = function () {
            var triggerId = $scope.expressionTrigger ? $scope.expressionTrigger._id : null;
            var injectorId = $scope.expressionInjector ? $scope.expressionInjector._id : null;
            var fromExpressionsIds = [];
            var toExpressionIds = [];

            var i;
            for (i = 0; i < $scope.fromExpressions.length; i++) {
                fromExpressionsIds.push($scope.fromExpressions[i]._id);
            }
            for (i = 0; i < $scope.toExpressions.length; i++) {
                toExpressionIds.push($scope.toExpressions[i]._id);
            }

            $http.post('/api/expression-chain', {
                value: $scope.expressionText,
                fromExpressions: fromExpressionsIds,
                toExpressions: toExpressionIds,
                fromStateTransfer: $scope.fromState === 'transfer',
                toStateTransfer: $scope.toState === 'transfer',
                trigger: triggerId,
                injector: injectorId
            }).success(function () {
                $scope.expressionText = "";
                $scope.fromExpressions = [];
                $scope.toExpressions = [];
                $scope.expressionTrigger = null;
                $scope.expressionInjector = null;
                getExpressions();
            });
        };

        $scope.testExpression = function (expression) {
            if (expression) {
                $scope.testResult = "";
                $http.get('/api/test/' + encodeURIComponent(expression)).success(function (response) {
                    $scope.setActiveTab($scope.tabs[2]);
                    $scope.testResult = JSON.stringify(response, null, "  ");
                });
            }
        };

        $scope.fromExpressionFilter = function (match) {
            if (!match.validated) {
                return false;
            }
            if ($scope.toExpressions.indexOf(match) >= 0) {
                return false;
            }
            if ($scope.fromExpressionFilterValue && match.value.toLowerCase().indexOf($scope.fromExpressionFilterValue.toLowerCase()) !== 0) {
                return false;
            }
            return true;
        };

        $scope.toExpressionFilter = function (match) {
            if (!match.validated) {
                return false;
            }
            if ($scope.fromExpressions.indexOf(match) >= 0) {
                return false;
            }
            if ($scope.toExpressionFilterValue && match.value.toLowerCase().indexOf($scope.toExpressionFilterValue.toLowerCase()) !== 0) {
                return false;
            }
            return true;
        };

        $scope.setRelValidated = function (rel, validated) {
            $http.post('/api/validate-rel', {
                id: rel._id,
                validated: validated
            }).success(function () {
                getInbox();
            });
        };

        getExpressions();
        getTriggers();
        getInjectors();
        getInbox();
    }
]);