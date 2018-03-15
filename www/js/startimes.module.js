'use strict';

angular.module('amplify.startimes', ['ui.router'])

.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('app.startimes', {
            url: "/startimes",
            views: {
                'tab-home': {
                    templateUrl: "templates/startimes/startimes.html",
                    controller: 'StartimesCtrl',
                }
            }
        })
        .state('app.startimes_confirm', {
            url: "/startimes_confirm",
            views: {
                'tab-home': {
                    templateUrl: "templates/startimes/confirm.html",
                    controller: 'StartimesConfirmCtrl'
                }
            }
        })
        .state('app.startimes_subscription_confirm', {
            url: "/startimes/subscription_confirm",
            views: {
                'tab-home': {
                    templateUrl: "templates/startimes/confirm_subscription.html",
                    controller: 'StartimesSubscriptionCtrl'
                }
            },
            resolve: {
                hasPreviousTransactions: function ($http, ApiEndPoint) {
                    return $http.get(ApiEndPoint.url+'/transactions/check')
                        .then(function (res) {
                            return res.data.hasRecentSuccessfulTransaction;
                        })
                }
            }
        })
}])

.controller('StartimesCtrl', ['$scope','$state','StartimesPackage','Transaction','Frequency','util', function($scope, $state, StartimesPackage, Transaction, Frequency, util) {
    $scope.startimesForm = {};
    $scope.subscriptionForm = {};
    $scope.packages = StartimesPackage.all;
    $scope.subscriptionFrequencies = Frequency.all;
    $scope.frequencyMultiples = [];
    $scope.isSubscription = false;
    $scope.$watch('isSubscription', function (newValue, oldValue) {
        //isSubcription checked
        if(newValue)
        {
            $scope.subscriptionForm.selectedPackage = $scope.startimesForm.selectedPackage;
            $scope.subscriptionForm.reference_no = $scope.startimesForm.reference_no;
            $scope.subscriptionForm.amount = $scope.startimesForm.amount;
        }
    });

    $scope.confirmStartimesPayment = function () {
        $scope.startimesForm.package = $scope.startimesForm.selectedPackage;
        Transaction.current = $scope.startimesForm;
        Transaction.type = 'Startimes ';
        Transaction.description = 'Startimes '+$scope.startimesForm.package.name;
        $state.go('app.startimes_confirm');
    };
    $scope.updateFrequencyMultiples = function () {
        $scope.frequencyMultiples = $scope.subscriptionForm.selectedFrequency.multiples;
    };

    //monitor subscribe immediately checkbox and assign start date current time
    $scope.$watch('subscriptionForm.immediately', function (newValue, oldValue) {
        if(newValue)
        {
            $scope.subscriptionForm.start_date = new Date();
        }
    });
    $scope.confirmSubscription = function () {
        $scope.subscriptionForm.package = $scope.subscriptionForm.selectedPackage;
        $scope.subscriptionForm.frequency = $scope.subscriptionForm.selectedFrequency.name;

        //Do end date algorithm from frequency and duration for none continous subscription
        var data = util.determineSubscriptionEndDate($scope.subscriptionForm);

        Transaction.current = data;
        Transaction.type = 'Startimes Subscription';
        Transaction.description = 'Startimes Subscription for '+$scope.subscriptionForm.package.name;

        if($scope.isAuthenticated())
        {
            $state.go('app.startimes_subscription_confirm');
        }
        else
        {
            $scope.login();
        }
    };
}])
.controller('StartimesConfirmCtrl', ['$scope','$state','Transaction','$http','ApiEndPoint', function($scope, $state, Transaction, $http, ApiEndPoint) {
    $scope.currentTransaction = Transaction.current;

    $scope.proceedPayment = function () {
        var currentTransaction = Transaction.current;
        var payload = {
            email: currentTransaction.email,
            full_name: currentTransaction.full_name,
            phoneNumber: currentTransaction.phone_number,
            referenceNo: currentTransaction.reference_no,
            amount: currentTransaction.amount,
            paymentCode: currentTransaction.package.payment_code,
            description: Transaction.type+' '+currentTransaction.package.name
        };
        $http.post(ApiEndPoint.url+'/payment', payload)
            .then(function (response) {
                //server response with status code 200
                console.log(response);
                window.location.href = response.data.payment_url;
            }, function (response) {
                console.log(response.data.error);
            });
    }
}])
.controller('StartimesSubscriptionCtrl', ['$scope', '$state','Transaction','StartimesPackage','$http','ApiEndPoint','hasPreviousTransactions', function($scope, $state, Transaction, StartimesPackage, $http, ApiEndPoint, hasPreviousTransactions) {
    $scope.currentTransaction = Transaction.current;
    $scope.hasPreviousTransactions = hasPreviousTransactions;
    $scope.proceedPayment = function () {
        var currentTransaction = Transaction.current;
        var payload = {
            email: currentTransaction.email,
            full_name: currentTransaction.full_name,
            phoneNumber: currentTransaction.phone_number,
            referenceNo: currentTransaction.reference_no,
            amount: currentTransaction.amount,
            paymentCode: currentTransaction.package.payment_code,
            description: Transaction.type+' '+currentTransaction.package.name
        };
        $http.post(ApiEndPoint.url+'/payment', payload)
            .then(function (response) {
                //server response with status code 200
                console.log(response);
                window.location.href = response.data.payment_url;
            }, function (response) {
                console.log(response.data.error);
            });
    }
}])
.factory('StartimesPackage', function($filter) {
    var o = {
        all: [
            {name: 'Startimes Custom package', payment_code: 'startimes', amount: '0'}
        ]
    };
    o.findByPaymentCode = function (code) {
        return $filter('filter')(o.all, {payment_code: code})[0];
    };
    return o;
})