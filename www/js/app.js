// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'amplify' is the name of this angular module(also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'amplify.controllers' is found in controllers.js
angular.module('amplify',
    [
        'ionic',
        'amplify.controllers',
        'amplify.services',
        'amplify.dstv',
        'amplify.gotv',
        'amplify.startimes',
        'amplify.smile',
        'amplify.spectranet',
        'amplify.swift',
        'amplify.ekedc',
        'amplify.ikedc',
        'amplify.transactions',
        'satellizer',
        'LocalStorageModule',
        'angular-datepicker',
        'angularMoment',
        'restmod'
    ])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
      // Check for network connection
      // if(window.Connection) {
      //     if(navigator.connection.type == Connection.NONE) {
      //         $ionicPopup.confirm({
      //             title: 'No Internet Connection',
      //             content: 'Sorry, no internet connectivity detected. Please reconnect and try again.'
      //         })
      //             .then(function(result) {
      //                 if(!result) {
      //                     ionic.Platform.exitApp();
      //                 }
      //             });
      //     }
      // }

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    //configure amplify pay
    if(window.cordova)
    {
        //Configure Amplify Payment Plugin
        var AmplifyPay = cordova.require("cordova/plugin/amplify_pay");
        AmplifyPay.config = {merchantId: 'Z9ODEKBS90KQHJBKRKF9RW', apiKey: '7e85bc3d-405e-45e4-9de2-b1bee227a679'};
    }
  });
})
.constant('ApiEndPoint', {
  url: 'http://localhost:8000/api'
})
.config(function($stateProvider, $urlRouterProvider, $authProvider, localStorageServiceProvider, ApiEndPoint, restmodProvider, AmplifyPay) {
  //configure satellizer module
  $authProvider.baseUrl = ApiEndPoint.url;
  $authProvider.loginUrl = '/auth/sign_in';
  $authProvider.signupUrl = '/auth/signup';
  $authProvider.tokenName = 'token';
  $authProvider.logoutRedirect = '/app/login';

  //configure local storage
  localStorageServiceProvider.setPrefix('amplify_bills');

  //configure restmod base url
  restmodProvider.rebase({
    $config: {
        urlPrefix: ApiEndPoint.url
    }
  });


  $stateProvider
    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl'
    })

    .state('app.home', {
      url: "/home",
      views: {
        'tab-home': {
          templateUrl: "templates/home.html"
        }
      }
    })

    .state('app.subscriptions', {
      url: "/subscriptions",
      views: {
        'tab-subscriptions': {
          templateUrl: "templates/subscriptions.html",
          controller: 'PlaylistsCtrl'
        }
      }
    })


  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
});
