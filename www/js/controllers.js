angular.module('amplify.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $auth, localStorageService, $rootScope, Transaction, Subscription, Loading, $ionicPopup) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  $scope.$on('$ionicView.enter', function(e) {
    if($auth.isAuthenticated())
    {
      $rootScope.current_user = localStorageService.get('currentUser');
    }
    else
    {
      $rootScope.current_user = {};
    }
  });

    //listen for device offline event
  $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
      $ionicPopup.confirm({
          title: 'No Internet Connection',
          content: 'Sorry, no internet connectivity detected. Please reconnect and try again.'
      })
          .then(function(result) {
              if(!result) {
                  ionic.Platform.exitApp();
              }
          });
  });

  //check if user is authenticated
  $scope.isAuthenticated = function()
  {
    return $auth.isAuthenticated();
  };

  //handle sign out
  $scope.logout = function() {
    $auth.logout();
  };

  $scope.syncCurrentUser = function (user) {
    $rootScope.current_user = user; //save in application root scope
    localStorageService.set('currentUser', user); //save in local storage in case user refreshes the page
  }

  // Form data for the login modal
  $scope.loginData = {};
  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.loginModal = modal;
  });
  // Open the login modal
  $scope.login = function() {
    $scope.loginModal.show();
  };
  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.loginModal.hide();
  };
  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    $scope.showLoading('Logging in...');
    $auth.login($scope.loginData)
        .then(function(resp) {
          // handle success response
          $scope.syncCurrentUser(resp.data.user);//register user in local storage and $rootScope and retrieve as $scope.current_user
          $scope.closeLogin();
        })
        .catch(function(resp) {
          // handle error response
          $scope.error = resp.data.error;
        });
        $scope.hideLoading();
  };

  // Form data for the sign up modal
  $scope.registrationForm = {};
  // Create the sign up modal that we will use later
  $ionicModal.fromTemplateUrl('templates/signup.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.regModal = modal;
  });
  // Open the signup modal
  $scope.signup = function() {
    $scope.regModal.show();
  };
  // Triggered in the sign up modal to close it
  $scope.closeSignup = function() {
    $scope.regModal.hide();
  };
  // Perform the login action when the user submits the login form
  $scope.doSignUp = function() {
    $auth.signup($scope.registrationForm)
        .then(function(resp) {
          // handle success response
          //login user after signup
          $auth.login({email: $scope.registrationForm.email, password: $scope.registrationForm.password})
              .then(function(resp) {
                $scope.syncCurrentUser(resp.data.user);
                $scope.closeSignup();
              });
          //swal("success", "Registration successful", "success");
        })
        .catch(function(resp) {
          // handle error response
          $scope.error = resp.data[0];
          console.log(resp.data[0]);
        });
  };

  //create subscription
  $scope.createSubscription = function () {
    var subscribeImmediately = Transaction.current.immediately == undefined ? false : true;
    var data = {
      start_date: Transaction.current.start_date,
      amount: Transaction.current.amount,
      infinite: Transaction.current.infinite,
      package: Transaction.current.package.payment_code,
      reference_no: Transaction.current.reference_no,
      frequency: Transaction.current.frequency,
      duration: Transaction.current.duration,
      description: Transaction.description,
      immediately: subscribeImmediately
    };
    Subscription.$create({subscription: data})
        .$then(
            function(response){
              if(response.payment_url)
              {
                window.location.href = response.payment_url;
              }
              else
              {
                  $ionicPopup.alert({
                      title: 'Success!',
                      template: 'Subscription saved successfully!'
                  });
              }
            },
            function(reason){
                $ionicPopup.alert({
                    title: 'Error!',
                    template: reason.data
                });
            }
        );
  };

    //indicate activity
    $scope.showLoading = function(text) {
        Loading.show(text);
    };
    $scope.hideLoading = function(){
        Loading.hide();
    };
})


