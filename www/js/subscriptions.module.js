'use strict';

angular.module('amplify.subscriptions', [])

.config(['$stateProvider', function($stateProvider, ionicDatePickerProvider) {
    //configure datepicker
    var datePickerObj = {
        inputDate: new Date(),
        titleLabel: 'Select a Date',
        setLabel: 'Okay',
        closeLabel: 'Cancel',
        templateType: 'modal',
        from: new Date(),
        showTodayButton: false,
        dateFormat: 'dd MMMM yyyy',
        closeOnSelect: true,
    };
    ionicDatePickerProvider.configDatePicker(datePickerObj);
    $stateProvider
        .state('app.subscriptions', {
            url: "/subscriptions",
            templateUrl: "subscriptions_view/list.html",
            controller: 'SubscriptionsCtrl',
            resolve: {
                $title: function () {
                    return 'Subscriptions'
                },
                subscriptions: function (Subscription) {
                    return Subscription.$collection().$fetch();
                }
            }
        })
        .state('app.subscriptions_show', {
            url: "/subscriptions/show/:id",
            templateUrl: "subscriptions_view/show.html",
            controller: 'ShowSubscriptionCtrl',
            resolve: {
                $title: function() {
                    return 'Subscription Detail'
                },
                currentSubscription: function(ApiEndPoint, $stateParams, $http) {
                    console.log('sub id '+$stateParams.id);
                    return $http.get(ApiEndPoint.url+'/subscriptions/'+$stateParams.id)
                        .then(function (res) {
                            return res.data;
                        });
                }
            }
        })
        .state('app.subscriptions_edit', {
            url: "/subscriptions/:id/edit",
            templateUrl: "subscriptions_view/edit.html",
            controller: 'EditSubscriptionCtrl',
            resolve: {
                $title: function() {
                    return 'Edit Subscription'
                },
                currentSubscription: function(ApiEndPoint, $stateParams, $http) {
                    return $http.get(ApiEndPoint.url+'/subscriptions/'+$stateParams.id)
                        .then(function (res) {
                            return res.data;
                        });
                },
                packages: function ($http, currentSubscription, ApiEndPoint) {
                    return $http.get(ApiEndPoint.url+'/subscriptions/packages/'+currentSubscription.id)
                        .then(function (res) {
                            return res.data;
                        });
                }
            }
        })
        .state('app.subscription_transactions', {
            url: "/subscriptions/:id/transactions",
            templateUrl: "subscriptions_view/transactions.html",
            controller: 'TransactionsSubscriptionCtrl',
            resolve: {
                $title: function() {
                    return 'Subscription Transactions'
                },
                subscription: function(ApiEndPoint, $stateParams, $http) {
                    return $http.get(ApiEndPoint.url+'/subscriptions/'+$stateParams.id)
                        .then(function (res) {
                            return res.data;
                        });
                },
                transactions: function ($http, subscription, ApiEndPoint) {
                    return $http.get(ApiEndPoint.url+'/subscriptions/transactions/'+subscription.id)
                        .then(function (res) {
                            return res.data.transactions;
                        });
                }
            }
        })
}])

.controller('SubscriptionsCtrl', ['$scope','$state','subscriptions','Subscription', function($scope, $state, subscriptions, Subscription) {
    $scope.subscriptions = subscriptions; //injected by router resolve

    //monitor changes in subscriptions for each subscription object
    $scope.$watch('subscriptions', function (newSubscriptions, oldSubscriptions, scope) {
        //newSubscriptions automatically assigned to $scope.subscriptions
    }, true);

}])
.controller('ShowSubscriptionCtrl', ['$scope','currentSubscription', function($scope, currentSubscription) {
    $scope.subscription = currentSubscription; //injected by router resolve
}])
.controller('EditSubscriptionCtrl', ['$scope','currentSubscription','packages','ApiEndPoint','$http', function($scope, currentSubscription, packages, ApiEndPoint, $http) {
    $scope.subscriptionForm = currentSubscription; //injected by router resolve
    $scope.subscriptionForm.start_date = new Date($scope.subscriptionForm.start_date);
    if(!$scope.subscriptionForm.infinite)
    {
        $scope.subscriptionForm.end_date = new Date($scope.subscriptionForm.end_date);
    }
    $scope.packages = packages;
    $scope.updateSelectedPackage = function () {
        $scope.subscriptionForm.amount = $scope.selectedPackage.amount;
    };
    //edit subscription
    $scope.editSubscription = function () {
        console.log($scope.selectedPackage);
        var data = {
            amount: $scope.subscriptionForm.amount,
            item_id: $scope.selectedPackage.id,
            reference_no: $scope.subscriptionForm.reference_no,
            description: 'Subscription for '+ $scope.selectedPackage.name
        };
        $http.put(ApiEndPoint.url+"/subscriptions/"+$scope.subscriptionForm.id, data)
            .then(function (resp) {
                swal('success', 'Subscription saved successful!', 'success');
            }, function (resp) {
                swal('error', 'Could not save subscription! Try again.', 'error');
            })
    };
}])
.controller('TransactionsSubscriptionCtrl', ['$scope','subscription','transactions','$http','ApiEndPoint', function($scope, subscription, transactions) {
    $scope.subscription = subscription; //injected by router resolve
    $scope.transactions = transactions;
    $scope.currentPage = 1;
    //when pagination page changed
    $scope.pageChanged = function ()
    {
        $http.get(ApiEndPoint.url+'/transactions?page='+$scope.currentPage)
            .then(function (res) {
                angular.copy(res.data.transactions, $scope.transactions);
            });
    }
}]);