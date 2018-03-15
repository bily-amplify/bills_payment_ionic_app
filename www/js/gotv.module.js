'use strict';

angular.module('amplify.gotv', [])

.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('app.gotv', {
            url: "/gotv",
            views: {
                'tab-home': {
                    templateUrl: "templates/gotv/gotv.html",
                    controller: 'GotvCtrl'
                }
            }
        })
        .state('app.gotv_confirm', {
            url: "/gotv_confirm",
            views: {
                'tab-home': {
                    templateUrl: "templates/gotv/confirm.html",
                    controller: 'GotvConfirmCtrl'
                }
            }
        })
        .state('app.gotv_subscription_confirm', {
            url: "/gotv/subscription_confirm",
            views: {
                'tab-home': {
                    templateUrl: "templates/gotv/confirm_subscription.html",
                    controller: 'GotvSubscriptionCtrl',
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

.controller('GotvCtrl', ['$scope','$state','GotvPackage','Transaction','Frequency','util', function($scope, $state, GotvPackage, Transaction, Frequency, util) {
    $scope.gotvForm = {};
    $scope.subscriptionForm = {};
    $scope.packages = GotvPackage.all;
    $scope.subscriptionFrequencies = Frequency.all;
    $scope.frequencyMultiples = [];
    $scope.isSubscription = false;
    $scope.$watch('isSubscription', function (newValue, oldValue) {
        //isSubcription checked
        if(newValue)
        {
            $scope.subscriptionForm.selectedPackage = $scope.gotvForm.selectedPackage;
            $scope.subscriptionForm.reference_no = $scope.gotvForm.reference_no;
            $scope.subscriptionForm.amount = $scope.gotvForm.amount;
        }
    });

    $scope.setAmount = function()
    {
        //retrieve selected package object by payment_code
        var selectedPackage = $scope.gotvForm.selectedPackage;
        $scope.gotvForm.amount = selectedPackage.amount;
    };
    $scope.confirmGotvPayment = function () {
        $scope.gotvForm.package = $scope.gotvForm.selectedPackage;
        Transaction.current = $scope.gotvForm;
        Transaction.type = 'GoTV ';
        Transaction.description = 'GoTV '+$scope.gotvForm.package.name;
        $state.go('app.gotv_confirm');
    };
    $scope.updateFrequencyMultiples = function () {
        $scope.frequencyMultiples = $scope.subscriptionForm.selectedFrequency.multiples;
    };
    $scope.setSubscriptionAmount = function()
    {
        //retrieve selected package object by payment_code
        var selectedPackage = $scope.subscriptionForm.selectedPackage;
        $scope.subscriptionForm.amount = selectedPackage.amount;
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
        Transaction.type = 'GoTV Subscription';
        Transaction.description = 'GoTV Subscription for '+$scope.subscriptionForm.package.name;
        if($scope.isAuthenticated())
        {
            $state.go('app.gotv_subscription_confirm');
        }
        else
        {
            $scope.login();
        }
    };
}])
.controller('GotvConfirmCtrl', ['$scope','$state','Transaction','$http','ApiEndPoint', function($scope, $state, Transaction, $http, ApiEndPoint) {
    $scope.currentTransaction = Transaction.current;

    $scope.proceedPayment = function () {
        var currentTransaction = Transaction.current;
        var payload = {
            email: currentTransaction.email,
            full_name: currentTransaction.full_name,
            phoneNumber: currentTransaction.phone_number,
            referenceNo: currentTransaction.reference_no,
            amount: currentTransaction.package.amount,
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
.controller('GotvSubscriptionCtrl', ['$scope', '$state','Transaction','GotvPackage','$http','ApiEndPoint','hasPreviousTransactions', function($scope, $state, Transaction, GotvPackage, $http, ApiEndPoint, hasPreviousTransactions) {
    $scope.currentTransaction = Transaction.current;
    $scope.hasPreviousTransactions = hasPreviousTransactions;
    $scope.proceedPayment = function () {
        var currentTransaction = Transaction.current;
        var payload = {
            email: currentTransaction.email,
            full_name: currentTransaction.full_name,
            phoneNumber: currentTransaction.phone_number,
            referenceNo: currentTransaction.reference_no,
            amount: currentTransaction.package.amount,
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
.factory('GotvPackage', function($filter) {
    var o = {
        all: [
            {name: 'GoTV Lite Monthly (NGN 400.00)', payment_code: '117', amount: '400'},
            {name: 'GoTV Lite Quarterly (NGN 1,050.00)', payment_code: '116', amount: '1050'},
            {name: 'GoTV Lite Annual (NGN 3,100.00)', payment_code: '35', amount: '3100'},
            {name: 'GoTV Value (NGN 1,200.00)', payment_code: '112', amount: '1200'},
            {name: 'GoTV Plus (NGN 1,800.00)', payment_code: '111', amount: '1800'},
            {name: 'GoTV Mobile Access (NGN 600.00)', payment_code: '60', amount: '600'}
        ]
    };
    o.findByPaymentCode = function (code) {
        return $filter('filter')(o.all, {payment_code: code})[0];
    };
    return o;
})