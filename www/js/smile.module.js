'use strict';

angular.module('amplify.smile', [])

.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('app.smile', {
            url: "/smile",
            views: {
                'tab-home': {
                    templateUrl: "templates/smile/smile.html",
                    controller: 'SmileCtrl'
                }
            }
        })
        .state('app.smile_confirm', {
            url: "/smile_confirm",
            views: {
                'tab-home': {
                    templateUrl: "templates/smile/confirm.html",
                    controller: 'SmileConfirmCtrl'
                }
            }
        })
        .state('app.smile_subscription_confirm', {
            url: "/smile/subscription_confirm",
            views: {
                'tab-home': {
                    templateUrl: "templates/smile/confirm_subscription.html",
                    controller: 'SmileSubscriptionCtrl'
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

.controller('SmileCtrl', ['$scope','$state','SmilePackage','Transaction','Frequency','util', function($scope, $state, SmilePackage, Transaction, Frequency, util) {
    $scope.smileForm = {};
    $scope.subscriptionForm = {};
    $scope.packages = SmilePackage.all;
    $scope.subscriptionFrequencies = Frequency.all;
    $scope.frequencyMultiples = [];
    $scope.isSubscription = false;
    $scope.$watch('isSubscription', function (newValue, oldValue) {
        //isSubcription checked
        if(newValue)
        {
            $scope.subscriptionForm.selectedPackage = $scope.smileForm.selectedPackage;
            $scope.subscriptionForm.reference_no = $scope.smileForm.reference_no;
            $scope.subscriptionForm.amount = $scope.smileForm.amount;
        }
    });

    $scope.setAmount = function()
    {
        var selectedPackage = $scope.smileForm.selectedPackage;
        $scope.smileForm.amount = selectedPackage.amount;
    };
    $scope.confirmSmilePayment = function () {
        $scope.smileForm.package = $scope.smileForm.selectedPackage;
        Transaction.current = $scope.smileForm;
        Transaction.type = 'Smile ';
        Transaction.description = 'Smile '+$scope.smileForm.package.name;
        $state.go('app.smile_confirm');
    };
    $scope.updateFrequencyMultiples = function () {
        $scope.frequencyMultiples = $scope.subscriptionForm.selectedFrequency.multiples;
    };
    $scope.setSubscriptionAmount = function()
    {
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
        Transaction.type = 'Smile Subscription';
        Transaction.description = 'Smile Subscription for '+$scope.subscriptionForm.package.name;

        if($scope.isAuthenticated())
        {
            $state.go('app.smile_subscription_confirm');
        }
        else
        {
            $scope.login();
        }
    };
}])
.controller('SmileConfirmCtrl', ['$scope','$state','Transaction','$http','ApiEndPoint', function($scope, $state, Transaction, $http, ApiEndPoint) {
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
.controller('SmileSubscriptionCtrl', ['$scope', '$state','Transaction','SmilePackage','$http','ApiEndPoint','hasPreviousTransactions', function($scope, $state, Transaction, SmilePackage, $http, ApiEndPoint, hasPreviousTransactions) {
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
.factory('SmilePackage', function($filter) {
    var o = {
        all: [
            {name: '20GB Data Bundle', payment_code: '06', amount: '17000'},
            {name: '20GB Mid Night Data Plan', payment_code: '28', amount: '6000'},
            {name: '50GB Mid Night Data Plan', payment_code: '27', amount: '12000'},
            {name: 'Unlimited Access Bundle', payment_code: '23', amount: '19800'},
            {name: 'Smile Voice Only - 90 Days Validity', payment_code: '24', amount: '1000'},
            {name: '15GB Data Bundle', payment_code: '25', amount: '10000'},
            {name: '2GB Smile Lite Plan', payment_code: '26', amount: '2000'},
            {name: '1GB Data Bundle (Smile Lite 2Mbps)', payment_code: '03', amount: '1000'},
            {name: '3GB Data Bundle', payment_code: '04', amount: '3000'},
            {name: '10GB Data Bundle', payment_code: '05', amount: '9000'},
            {name: '50GB Data Bundle', payment_code: '07', amount: '36000'},
            {name: '5GB Night and Weekend Data Bundle', payment_code: '13', amount: '4000'},
            {name: '10GB Night and Weekend Data Bundle', payment_code: '14', amount: '7500'},
            {name: '20GB Night and Weekend Data Bundle', payment_code: '15', amount: '14000'},
            {name: '100GB Data Bundle', payment_code: '08', amount: '70000'},
            {name: '200GB Data Bundle', payment_code: '09', amount: '135000'},
            {name: '5GB Data Bundle', payment_code: '11', amount: '5000'}
        ]
    };
    o.findByPaymentCode = function (code) {
        return $filter('filter')(o.all, {payment_code: code})[0];
    };
    return o;
})