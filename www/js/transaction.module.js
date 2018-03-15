'use strict';

angular.module('amplify.transactions', [])

.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('app.transactions', {
            url: "/transactions",
            views: {
                'tab-transactions': {
                    templateUrl: "templates/transactions/list.html",
                    controller: 'TransactionsCtrl'
                }
            },
            resolve: {
                transactions: function ($http, ApiEndPoint, Loading) {
                    Loading.show('Loading...');
                    return $http.get(ApiEndPoint.url+'/transactions')
                        .then(function (res) {
                            Loading.hide();
                            return res.data.transactions;
                        });
                }
            }
        })
        .state('app.transaction_verify', {
            url: "/transaction_verify?tran_response",
            views: {
                'tab-transactions': {
                    templateUrl: "templates/transactions/verify.html",
                }
            },
            onEnter: function($stateParams, $http, $state, Transaction, ApiEndPoint){
                var transactionReference = $stateParams.tran_response;
                var payload = {transactionReference: transactionReference};
                $http.post(ApiEndPoint.url+'/verify_payment', payload)
                    .then(function (response) {
                        var data = response.data;
                        if(data.status == 'success')
                        {
                            Transaction.result = data.detail;
                            swal("Success!", "Transaction successful", "success");
                            $state.go('app.receipt')
                        }
                        else
                        {
                            swal("Transaction Failed!", data.description, "warning");
                            $state.go('app.home');
                        }
                    }, function (response) {
                        console.log(response.data.error);
                        swal("Transaction Failed!", response.data.error, "warning");
                        $state.go('app.home');
                    })
            }
        })
}])

.controller('TransactionsCtrl', ['$scope','transactions','$http','ApiEndPoint', function($scope, transactions, $http, ApiEndPoint) {
    $scope.transactions = transactions;
    $scope.data = $scope.transactions.data;
    //load more
    $scope.loadNextPage = function(){
        $scope.showLoading('Loading...');
        $http.get($scope.transactions.next_page_url)
            .then(function (res) {
                $scope.data = $scope.data.concat(res.data.transactions.data); //merge the new data with the previous data
                $scope.transactions =  res.data.transactions;
                $scope.hideLoading();
            });
    };
    $scope.hasMore = function () {
        return $scope.transactions.next_page_url != null;
    }
}])