angular.module('amplify.services', [])
    .factory('Transaction', function (AmplifyPay) {
        var o = {
            current: { },
            type: '',
            description: '',
            result: {},
            transactionRef: '',
            success: false,
            errorMessage: ''
        };
        o.makePayment = function () {

        };
        o.init = function () {

        };
        o.proceedPayment = function () {
            var payload = {
                email: o.current.email,
                full_name: o.current.full_name,
                phoneNumber: o.current.phone_number,
                referenceNo: o.current.reference_no,
                amount: o.current.package.amount,
                paymentCode: o.current.package.payment_code,
                description: o.current.type+' '+o.current.package.name
            };
            var successFn = function (transactionRef) {
                o.success = true;
                o.transactionRef = transactionRef;
            };
            var failFn = function (errorMessage) {
                o.errorMessage = errorMessage;
            };
            var planId = '5001';
            var referenceId = 'AMP1111';
            AmplifyPay.makePayment(payload.full_name, payload.email,
                payload.description, payload.amount, referenceId, planId, successFn, failFn);
            $http.post(ApiEndPoint.url+'/payment', payload)
                .then(function (response) {
                    //server response with status code 200
                    console.log(response);
                    window.location.href = response.data.payment_url;
                }, function (response) {
                    console.log(response.data.error);
                });
        };
        return o;
    })
    .factory('util', function () {
        var o = {};
        o.determineSubscriptionEndDate = function (data) {
            if(!data.infinite)
            {
                var startDate = new Date(data.start_date);
                var endDateMoment = moment(startDate);
                switch (data.frequency)
                {
                    case 'Every Month':
                        switch (data.duration)
                        {
                            case 'A Month':
                                data.end_date = endDateMoment.add(1, 'months').toDate();
                                break;
                            case '2 Months':
                                data.end_date = endDateMoment.add(2, 'months').toDate();
                                break;
                            case '6 Months':
                                data.end_date = endDateMoment.add(6, 'months').toDate();
                                break;
                            case '9 Months':
                                data.end_date = endDateMoment.add(9, 'months').toDate();
                                break;
                            case '1 Year':
                                data.end_date = endDateMoment.add(1, 'years').toDate();
                                break;
                        }
                        break;
                    case 'Every 3 Months':
                        switch (data.duration)
                        {
                            case '3 Months':
                                data.end_date = endDateMoment.add(3, 'months').toDate();
                                break;
                            case '6 Months':
                                data.end_date = endDateMoment.add(6, 'months').toDate();
                                break;
                            case '9 Months':
                                data.end_date = endDateMoment.add(9, 'months').toDate();
                                break;
                            case '1 Year':
                                data.end_date = endDateMoment.add(1, 'years').toDate();
                                break;
                        }
                        break;
                    case 'Every 6 Months':
                        switch (data.duration)
                        {
                            case '6 Months':
                                data.end_date = endDateMoment.add(6, 'months').toDate();
                                break;
                            case '1 Year':
                                data.end_date = endDateMoment.add(1, 'years').toDate();
                                break;
                            case '2 Years':
                                data.end_date = endDateMoment.add(2, 'years').toDate();
                                break;
                        }
                        break;
                }
            }
            else
            {
                //ensure end date and duration are not set for continous subscriptions
                data.end_date = null;
                data.duration = null;
            }
            return data;
        };
        return o;
    })
    .factory('Subscription', function(restmod, ApiEndPoint, $http) {
        return restmod.model('/subscriptions').mix({
            $extend: {
                Record: {
                    pause: function() {
                        this.paused = true;
                        this.active = false;
                        this.cancelled = false;
                        return $http.put(ApiEndPoint.url+'/subscriptions/'+this.id+'/pause');
                    },
                    resume: function() {
                        this.paused = false;
                        this.active = true;
                        this.cancelled = false;
                        return $http.put(ApiEndPoint.url+'/subscriptions/'+this.id+'/resume');
                    },
                    cancel: function() {
                        this.cancelled = true;
                        this.paused = false;
                        this.active = false;
                        return $http.put(ApiEndPoint.url+'/subscriptions/'+this.id+'/cancel');
                    }
                }
            },
        });
    })
    .factory('Frequency', function(){
        var o = {
            all: [
                {
                    name: 'Every Month',
                    multiples: ['A Month', '2 Months', '6 Months', '9 Months', '1 Year']
                },
                {
                    name: 'Every 3 Months',
                    multiples: ['3 Months', '6 Months', '6 Months', '9 Months', '1 Year']
                },
                {
                    name: 'Every 6 Months',
                    multiples: ['6 Months', '1 Year', '2 Years']
                }
            ]
        };
        return o;
    })
    .factory('Loading', function ($ionicLoading) {
        var o = {};
        o.show = function (text) {
            $ionicLoading.show({template: text});
        };
        o.hide = function () {
            $ionicLoading.hide();
        };
        return o;
    })
