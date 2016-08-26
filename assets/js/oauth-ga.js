/**
 * Created by chanmil on 8/19/16.
 */

(function () {
    var apiKey = 'AIzaSyAF6hJyhDE3JZlsKfZPmO8SiojrjTMExUw';
    var clientId = '376554739838-8e8hq33rk1lt5hbv3nmgdcdbtqhmi7g2.apps.googleusercontent.com';
    // Set authorized scope.
    var scopes = 'profile https://www.googleapis.com/auth/analytics.readonly';

    var accountId, webPropertyId, profileId;
    var RESULT_NA = 'N/A';
    var auditTable =
        [{'id':'A01', 'items': 'Enable Advertising Reporting Features', 'result':RESULT_NA, 'dimension':'ga:userGender', 'metric':'ga:sessions'},
            {'id':'B01', 'items': 'Pageview tracking', 'result':RESULT_NA, 'dimension':'ga:pagePath', 'metric':'ga:sessions'},
            {'id':'B02', 'items': 'Event tracking', 'result':RESULT_NA, 'dimension':'ga:eventCategory', 'metric':'ga:sessions'},
            {'id':'B03', 'items': 'Set up Site Search', 'result':RESULT_NA, 'dimension':'ga:searchKeyword', 'metric':'ga:sessions'},
            {'id':'C01', 'items': 'Link AdWords Account', 'result':RESULT_NA},
            {'id':'C02', 'items': 'AdWords Auto-tagging', 'result':RESULT_NA},
            {'id':'C03', 'items': 'Custom Campaign Parameter', 'result':RESULT_NA, 'dimension':'ga:campaign','metric':'ga:sessions', 'filter':'ga:adwordsCampaignID!~.*'},
            {'id':'D01', 'items': 'Set up Goals', 'result':RESULT_NA, 'dimension':'ga:goalCompletionLocation','metric':'ga:goalCompletionsAll'},
            {'id':'D02', 'items': 'Measuring Ecommerce Activities & Transactions', 'result':RESULT_NA, 'dimension':'ga:productName', 'metric':'ga:itemQuantity'},
            {'id':'D03', 'items': 'Measuring the Checkout Process', 'result':RESULT_NA, 'dimension':'ga:productName', 'metric':'ga:productCheckouts'},
            {'id':'F01', 'items': 'Create a copy of a view as an unfiltered view', 'result':RESULT_NA}
           // {'id':'F02', 'items': 'Create separate property for each domain tracked', 'result':RESULT_NA},
           // {'id':'G01', 'items': 'Google Webmasters Tools integration', 'result':RESULT_NA}
        ];

    // Get authorization from the user to access profile info
    function initAuth() {
        gapi.client.setApiKey(apiKey);
        gapi.auth2.init({
            client_id: clientId,
            scope: scopes
        });
        var authButton = document.getElementById('auth-button');
        authButton.addEventListener("click", auth);
    }

    function auth() {
        // Return value : a Promise that is fulfilled when the user successfully authenticates and grants the requested scopes.
        gapi.auth2.getAuthInstance().signIn().then(function() {
            makeAuthApiCall();
        });
    }

    function makeAuthApiCall() {
        gapi.client.load('analytics', 'v3').then(function() {
            // Get a list of all Google Analytics accounts for this user
            gapi.client.analytics.management.accounts.list().then(handleAccounts);
        });
    }

    function handleAccounts(response) {
        // Handles the response from the accounts list method.
        if (response.result.items && response.result.items.length) {
            // Get account selection
            var accOptions = document.getElementById('acc');

            // Get Google Analytics accounts
            for (var i = 0; i < response.result.totalResults; i++) {
                var accId = response.result.items[i].id;
                var accName = response.result.items[i].name;

                addOptions(accOptions, accName, accId);
            }

            // When the selected account changed
            accOptions.addEventListener("change", function () {
                // Query for properties with selected Account value.
                queryProperties(accOptions.value);
            });
        } else {
            console.log('No accounts found for this user.');
        }
    }

    function queryProperties(accountId) {
        // Get a list of all the properties for the account.
        var request = gapi.client.analytics.management.webproperties.list(
            {'accountId': accountId})
            .then(handleProperties)
            .then(null, function(err) {
                // Log any errors.
                console.log(err);
            });
    }

    function handleProperties(response) {
        // var formattedJson = JSON.stringify(response.result, null, 2);
        // console.log(formattedJson);

        // Handles the response from the webproperties list method.
        if (response.result.items && response.result.items.length) {
            var items = response.result.items;
            var firstAccountId = response.result.items[0].accountId;
            var accId = response.result.items[0].accountId;

            // Get property selection
            var propOptions = document.getElementById('prop');

            propOptions.innerHTML = '';

            // Add properties
            for (j = 0; j < response.result.totalResults; j++) {
                addOptions(propOptions, items[j].name, items[j].id);
            }

            // Change option values based on the selected value.
            propOptions.addEventListener("change", function() {
                // console.log('account Id' + firstAccountId + ', property Id : '+ propOptions.value);
                // need to fix (09/25)
                // clear property & view options when choosing other account

                queryProfiles(firstAccountId, propOptions.value);
            }, false)

        } else {
            console.log('No properties found for this user.');
        }
    }

    function queryProfiles(accountId, propertyId) {
        // Get a list of all Views (Profiles) for the first property
        // of the first Account.
        gapi.client.analytics.management.profiles.list({
            'accountId': accountId,
            'webPropertyId': propertyId
        })
            .then(handleProfiles, function(err) {
                // Log any errors.
                console.log(err);
            });
    }


    function handleProfiles(response) {
        // Handles the response from the profiles list method.
        var items = response.result.items;

        if (response.result.items && response.result.items.length) {
            // Get the first View (Profile) ID.
            var profiles = response.result.items;
            var viewOptions = document.getElementById('view');

            // clear all view info before adding view(s) based on the selected property value.
            viewOptions.innerHTML = '';

            // Change options based on the selected value.
            for (i = 0; i < profiles.length; i++) {
                addOptions(viewOptions, profiles[i].name, profiles[i].id);
            }

            viewOptions.addEventListener("change", function() {
                //getAccountInfo();
                //doAudit();
                initAudit();
            });

        } else {
            console.log('No views (profiles) found for this user.');
        }
    }


    function queryCoreReportingApi(profileId) {
        // Query the Core Reporting API for the number sessions for
        // the past seven days.
        gapi.client.analytics.data.ga.get({
            'ids': 'ga:' + profileId,
            'start-date': '7daysAgo',
            'end-date': 'today',
            'metrics': 'ga:sessions'
        })
            .then(function (response) {
                var formattedJson = JSON.stringify(response.result, null, 2);
                document.getElementById('query-output').value = formattedJson;
                console.log(formattedJson);
            })
            .then(null, function (err) {
                // Log any errors.
                console.log(err);
            });
    }

    function addOptions (selectBox, optionName, optionVal) {
        var options = document.createElement("option");
        options.appendChild(document.createTextNode(optionName + ' ('+optionVal+')'));
        options.setAttribute("value", optionVal);
        selectBox.appendChild(options);
    }

    function clearOptions (childBox) {
        console.log('called clearOption function');
    }

    // added 09/24/2016

    function initAudit() {
        gapi.client.load('https://analyticsreporting.googleapis.com/$discovery/rest', 'v4')
            .then(function () {
                // console.log('client library success');
                doAudit();
            }, function() {
                console.log('failed to load Reporting API');
            });
    }

    function getAccountInfo() {
        accountId = document.getElementById('acc').value;
        webPropertyId = document.getElementById('prop').value;
        profileId = document.getElementById('view').value;
    }

    function buildAuditTable() {
        console.log('start to build auditTable');
        var auditDiv = document.getElementById('ga-checklist');

        // Create a div element
        for (var i = 0; i < auditTable.length; i++) {
            var middle = document.createElement('div');

            var info = document.createElement('div');
            info.innerHTML = '\<p\> ID : ' + auditTable[i].id
                + '\<p\> Item : ' + auditTable[i].items;

            var text = document.createElement('textarea');
                text.cols = "50";
                text.rows = "10";
                text.id = auditTable[i].id;

            var hr = document.createElement('hr');
                hr.size = "10";

            middle.appendChild(info);
            middle.appendChild(text);
            middle.appendChild(hr);

            // Append created div to ga-checklist div
            auditDiv.appendChild(middle);
        }
    }

    function doAudit() {
        // Get GA information
        getAccountInfo();

        // Automatically build auditTable below GA account info
        buildAuditTable();

        for (var i = 0; i < auditTable.length; i++) {
            var id = auditTable[i].id;
            var dimension = auditTable[i].dimension;
            if (typeof(dimension) === 'undefined') {
                // console.log('dimension is undefined');
                auditTable[i].result = runAudit_M(id);
            } else {
                var metric = auditTable[i].metric;
                //var filter = auditTable[i].filter;
                auditTable[i].result = runAudit_R(id, dimension, metric); //, filter);
            }
        }
    }

    function runAudit_M(id) {
        // Audit using Google management API
        var result;
        switch (id) {
            case 'C01' || 'C02':
                result = runAdwordsCheck();
                break;
            case 'F01':
                result = runF01();
                break;
            default:
                console.log('Not C01, C02, F01');
                break;
        }
        return result;
    }

    function runAudit_R(id, dimension, metric) {//, filter) {
        // Audit using Google Reporting API
        var result;

        // Make a request to the API
        gapi.client.analyticsreporting.reports.batchGet({
            'reportRequests': [
            {
                'viewId': profileId,
                'dateRanges': [{
                    'startDate': '7daysAgo',
                    'endDate': 'today'
                }],
                'metrics': [{
                    'expression': metric
                }],
                'dimensions': [{
                    'name': dimension
                }]
            }]
        }).then(function (response) {
            var result;
            var reports = response.result.reports;

            if (reports.length > 0) {
                result = 'Passed';

                // Show the report details
                for (var i = 0; i < reports.length; i++) {
                    var formattedJson = JSON.stringify(reports, null, 2);
                    document.getElementById(id).value = formattedJson;
                }
            } else {
                result = 'Failed';
            }
        }, function (error) {
            console.log(error);
        });
    }

    function runAdwordsCheck() {
        // console.log('[C01] account & propert Id : ' + accountId + ', ' + webPropertyId);

        // Get a list of all AdWordsLink for the users
        gapi.client.analytics.management.webPropertyAdWordsLinks.list({
            'accountId': accountId,
            'webPropertyId': webPropertyId
        }).then(handleAdwordslists);
    }

    function handleAdwordslists(response) {
        var result_c01;
        var result_c02;

        if (response && !response.error) {
            var info = response.result;
            var count = info.totalResults;
            var pass_all = true;
            var pass_any = false;

            // [C01] Show all AdWordsLink info written in JSON format
            for (var i = 0; i < count; i++) {
                var formattedJson = JSON.stringify(info.items[i], null, 2);
                document.getElementById('C01').value = formattedJson;
            }

            // [C02] Check each adWords account whether it is auto-tagged or not
            for (var i = 0; i < count; i++) {
                // Q. is it possible to connect more than one AdWords account to a certain view?
                // thai is, one view : one AdWords Account = 1 : 1
                var adWordsAccounts = info.items[i].adWordsAccounts;

                for (var j = 0; j < adWordsAccounts.length; j++) {
                    if (adWordsAccounts[j].autoTaggingEnabled) {
                        pass_any = true;
                    } else {
                        pass_all = false;
                    }
                }
            }

            if (pass_any) {
                result_c02 = 'Passed';
                var formattedJson = JSON.stringify(adWordsAccounts, null, 2);
                document.getElementById('C02').value = 'Result : ' + result_c02 + '\n' + formattedJson;
            }

        }
    }

    function runF01() {
        //console.log('[F01] account & propert Id : ' + accountId + ', ' + webPropertyId);
        var result;

        gapi.client.analytics.management.profiles.list({
            'accountId': accountId,
            'webPropertyId': webPropertyId
        }).then(function (response) {
            // Get a list of profile
            var profiles = response.result.items;

            if (profiles.length > 0)
                result = 'Passed';
            else
                result = 'Failed';

            // Why do we check whether enhanced ecommerce tracking is enabled for this view?
            for (var i = 0; i < profiles.length; i++) {
                if (!profiles[i].enhancedECommerceTracking === 'undefined' || profiles[i].enhancedECommerceTracking != false) {
                    result = false;
                } else {
                    result = true;
                }
            }
            document.getElementById('F01').value = 'Enhanced Ecommerce Tracking : ' + result;

        }, function () {
            // failed to a list of profile
            console.log('failed to a list of profile');
        });

    }

    // A V4 Report has 3 top-level fields: columnHeader, data, and nextPageToken
    function handleReportingResults(response){
        var result;
        var reports = response.result.reports;

        if (reports.length > 0) {
            result = 'Passed';

            // Show the headers
            for (var i = 0; i < reports.length; i++) {
                // var headerNames = [];
                // headerNames.push(reports[i].columnHeader);
                //
                // var data = [];
                // data.push(reports[i].data);
                //
                // var nextPageToken = reports[i].nextPageToken;
                //
                // console.log(headerNames)
            }
        } else {
            result = 'Failed';
        }
    }

    function reportResult() {
        var result;
        for (var i = 0; i < auditTable.length; i++) {
            var id = auditTable[i].id;
            result = auditTable[i].result;
            console.log('ID : ' + id + ', Audit Result : ' + result);
        }
    }

    gapi.load('client:auth2', initAuth);

})();