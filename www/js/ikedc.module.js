'use strict';

angular.module('amplify.ikedc', ['ui.router'])

.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('app.ikedc', {
            url: "/ikedc",
            views: {
                'tab-home': {
                    templateUrl: "templates/ikedc/ikedc.html",
                    controller: 'IkedcCtrl'
                }
            }
        })
        .state('app.ikedc_confirm', {
            url: "/ikedc_confirm",
            views: {
                'tab-home': {
                    templateUrl: "templates/ikedc/confirm.html",
                    controller: 'IkedcConfirmCtrl'
                }
            }
        })
        .state('app.ikedc_subscription_confirm', {
            url: "/ikedc/subscription_confirm",
            views: {
                'tab-home': {
                    templateUrl: "templates/ikedc/confirm_subscription.html",
                    controller: 'IkedcSubscriptionCtrl'
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

.controller('IkedcCtrl', ['$scope','$state','IkedcPackage','Transaction','Frequency','util', function($scope, $state, IkedcPackage, Transaction, Frequency, util) {
    $scope.ikedcForm = {};
    $scope.subscriptionForm = {};
    $scope.packages = IkedcPackage.all;
    $scope.subscriptionFrequencies = Frequency.all;
    $scope.frequencyMultiples = [];
    $scope.isSubscription = false;
    $scope.$watch('isSubscription', function (newValue, oldValue) {
        //isSubcription checked
        if(newValue)
        {
            $scope.subscriptionForm.selectedPackage = $scope.ikedcForm.selectedPackage;
            $scope.subscriptionForm.reference_no = $scope.ikedcForm.reference_no;
            $scope.subscriptionForm.amount = $scope.ikedcForm.amount;
        }
    });

    $scope.confirmIkedcPayment = function () {
        $scope.ikedcForm.package = $scope.ikedcForm.selectedPackage;
        Transaction.current = $scope.ikedcForm;
        Transaction.type = 'IKEDC';
        Transaction.description = 'IKEDC '+$scope.ikedcForm.package.name;
        $state.go('app.ikedc_confirm');
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
        Transaction.type = 'IKEDC Subscription';
        Transaction.description = 'IKEDC Subscription for '+$scope.subscriptionForm.package.name;

        if($scope.isAuthenticated())
        {
            $state.go('app.ikedc_subscription_confirm');
        }
        else
        {
            $scope.login();
        }
    };
}])
.controller('IkedcConfirmCtrl', ['$scope','$state','Transaction','$http','ApiEndPoint', function($scope, $state, Transaction, $http, ApiEndPoint) {
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
.controller('IkedcSubscriptionCtrl', ['$scope', '$state','Transaction','IkedcPackage','$http','ApiEndPoint','hasPreviousTransactions', function($scope, $state, Transaction, IkedcPackage, $http, ApiEndPoint, hasPreviousTransactions) {
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
.factory('IkedcPackage', function($filter) {
    var o = {
        all: [
            {name: 'Prepaid', payment_code: '03', amount: '0'},
            {name: 'Postpaid', payment_code: '06', amount: '0'},
            {name: 'Penalities', payment_code: '05', amount: '0'},
            {name: 'Loss of Revenue', payment_code: '04', amount: '0'},
            {name: 'Reconnection Fee', payment_code: '07', amount: '0'}
        ]
    };
    o.findByPaymentCode = function (code) {
        return $filter('filter')(o.all, {payment_code: code})[0];
    };
    return o;
})