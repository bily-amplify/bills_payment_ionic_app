'use strict';

angular.module('amplify.ekedc', [])

.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('app.ekedc', {
            url: "/ekedc",
            views: {
                'tab-home': {
                    templateUrl: "templates/ekedc/ekedc.html",
                    controller: 'EkedcCtrl',
                }
            }
        })
        .state('app.ekedc_confirm', {
            url: "/ekedc_confirm",
            views: {
                'tab-home': {
                    templateUrl: "templates/ekedc/confirm.html",
                    controller: 'EkedcConfirmCtrl'
                }
            }
        })
        .state('app.ekedc_subscription_confirm', {
            url: "/ekedc/subscription_confirm",
            views: {
                'tab-home': {
                    templateUrl: "templates/ekedc/confirm_subscription.html",
                    controller: 'EkedcSubscriptionCtrl'
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

.controller('EkedcCtrl', ['$scope','$state','EkedcPackage','Transaction','Frequency','util', function($scope, $state, EkedcPackage, Transaction, Frequency, util) {
    $scope.ekedcForm = {};
    $scope.subscriptionForm = {};
    $scope.packages = EkedcPackage.all;
    $scope.subscriptionFrequencies = Frequency.all;
    $scope.frequencyMultiples = [];
    $scope.isSubscription = false;
    $scope.$watch('isSubscription', function (newValue, oldValue) {
        //isSubcription checked
        if(newValue)
        {
            $scope.subscriptionForm.selectedPackage = $scope.ekedcForm.selectedPackage;
            $scope.subscriptionForm.reference_no = $scope.ekedcForm.reference_no;
            $scope.subscriptionForm.amount = $scope.ekedcForm.amount;
        }
    });

    $scope.confirmEkedcPayment = function () {
        $scope.ekedcForm.package = $scope.ekedcForm.selectedPackage;
        Transaction.current = $scope.ekedcForm;
        Transaction.type = 'EKEDC';
        Transaction.description = 'EKEDC '+$scope.ekedcForm.package.name;
        $state.go('app.ekedc_confirm');
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
        Transaction.type = 'EKEDC Subscription';
        Transaction.description = 'EKEDC Subscription for '+$scope.subscriptionForm.package.name;
        if($scope.isAuthenticated())
        {
            $state.go('app.ekedc_subscription_confirm');
        }
        else
        {
            $scope.login();
        }
    };
}])
.controller('EkedcConfirmCtrl', ['$scope','$state','Transaction','$http','ApiEndPoint', function($scope, $state, Transaction, $http, ApiEndPoint) {
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
.controller('EkedcSubscriptionCtrl', ['$scope', '$state','Transaction','EkedcPackage','$http','ApiEndPoint','hasPreviousTransactions', function($scope, $state, Transaction, EkedcPackage, $http, ApiEndPoint, hasPreviousTransactions) {
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
.factory('EkedcPackage', function($filter) {
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