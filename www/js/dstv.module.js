'use strict';

angular.module('amplify.dstv', [])

.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('app.dstv', {
            url: "/dstv",
            views: {
                'tab-home': {
                    templateUrl: "templates/dstv/dstv.html",
                    controller: 'DstvCtrl'
                }
            }
        })

        .state('app.dstv_confirm', {
            url: "/dstv_confirm",
            views: {
                'tab-home': {
                    templateUrl: "templates/dstv/confirm.html",
                    controller: 'DstvConfirmCtrl'
                }
            }
        })
        .state('app.dstv_subscription_confirm', {
            url: "/dstv/subscription_confirm",
            views: {
                'tab-home': {
                    templateUrl: "templates/dstv/confirm_subscription.html",
                    controller: 'DstvSubscriptionCtrl'
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
.controller('DstvCtrl', ['$scope','$state','DstvPackage','Transaction','Frequency','util','$auth', function($scope, $state, DstvPackage, Transaction, Frequency, util, $auth) {
    $scope.dstvForm = {};
    $scope.subscriptionForm = {};
    $scope.packages = DstvPackage.all;
    $scope.subscriptionFrequencies = Frequency.all;
    $scope.frequencyMultiples = [];
    $scope.isSubscription = false;
    $scope.$watch('isSubscription', function (newValue, oldValue) {
        //isSubscription is checked
        if(newValue)
        {
            $scope.subscriptionForm.selectedPackage = $scope.dstvForm.selectedPackage;
            $scope.subscriptionForm.reference_no = $scope.dstvForm.reference_no;
            $scope.subscriptionForm.amount = $scope.dstvForm.amount;
        }
    });
    $scope.setAmount = function()
    {
        $scope.dstvForm.amount = $scope.dstvForm.selectedPackage.amount;
    };
    $scope.confirmDstvPayment = function () {
        $scope.dstvForm.package = $scope.dstvForm.selectedPackage;
        Transaction.current = $scope.dstvForm;
        Transaction.type = 'DSTV ';
        Transaction.description = 'DSTV '+$scope.dstvForm.package.name;
        $state.go('app.dstv_confirm');
    };
    $scope.updateFrequencyMultiples = function () {
        $scope.frequencyMultiples = $scope.subscriptionForm.selectedFrequency.multiples;
    };
    $scope.setSubscriptionAmount = function()
    {
        $scope.subscriptionForm.amount = $scope.subscriptionForm.selectedPackage.amount;
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
        Transaction.type = 'DSTV Subscription';
        Transaction.description = 'DSTV Subscription for '+$scope.subscriptionForm.package.name;
        if($scope.isAuthenticated())
        {
            $state.go('app.dstv_subscription_confirm');
        }
        else
        {
            $scope.login();
        }
    };

    //start date picker
    var startDatePicker = {
        callback: function (dateString) {
            console.log('Return value from the datepicker popup is : ' + dateString, new Date(dateString));
        }
    };

    $scope.openStartDatePicker = function(){
        console.log('opening start date');
        ionicDatePicker.openDatePicker(startDatePicker);
    };

}])
.controller('DstvConfirmCtrl', ['$scope','$state','Transaction','$http','ApiEndPoint', function($scope, $state, Transaction, $http, ApiEndPoint) {
    $scope.currentTransaction = Transaction.current;
    Transaction.makePayment();
    if(Transaction.success)
    {

    }
    else
    {
        alert(Transaction.errorMessage);
    }
}])
.controller('DstvSubscriptionCtrl', ['$scope', '$state','Transaction','DstvPackage','$http','ApiEndPoint','hasPreviousTransactions', function($scope, $state, Transaction, DstvPackage, $http, ApiEndPoint, hasPreviousTransactions) {
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
.factory('DstvPackage', function($filter) {
    var o = {
        all: [
            {name: 'Access (₦ 1,800.00)', payment_code: '28', amount: '1800'},
            {name: 'Access + Asia (₦ 6,600.00)', payment_code: '32', amount: '6600'},
            {name: 'Access + HD/ExtraView (₦ 3,960.00)', payment_code: '35', amount: '3960'},
            {name: 'Asia Add-on (₦ 4,800.00)', payment_code: '34', amount: '4800'},
            {name: 'Asia (₦ 4,800.00)', payment_code: '17', amount: '4800'},
            {name: 'Asian + HD/ExtraView (₦ 6,960.00)', payment_code: '60', amount: '6960'},
            {name: 'Family (₦ 3,600.00)', payment_code: '06', amount: '3600'},
            {name: 'Family + Asia (₦ 8,400.00)', payment_code: '37', amount: '8400'},
            {name: 'Family + HD/ExtraView (₦ 5,760.00)', payment_code: '10', amount: '5760'}
        ]
    };
    o.findByPaymentCode = function (code) {
        return $filter('filter')(o.all, {payment_code: code})[0];
    };
    return o;
})