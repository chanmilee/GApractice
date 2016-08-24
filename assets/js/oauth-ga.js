/**
 * Created by chanmil on 8/19/16.
 */

(function () {
    var apiKey = 'AIzaSyCukNdRlY6AJRGHcVVD-0Epm9gmE7oG5qs';
    var clientId = '376554739838-inpe882e6md7cgblspav1k1hgv49ui74.apps.googleusercontent.com';
    // Set authorized scope.
    var scopes = 'profile https://www.googleapis.com/auth/analytics.readonly';


    var accountId, webPropertyId, profileId;
    var RESULT_NA = 'N/A';
    var auditTable =
        [{'id':'A01', 'result':RESULT_NA, 'cell':'E2:E2', 'dimension':'ga:userGender', 'metric':'ga:sessions'},
            {'id':'B01', 'result':RESULT_NA, 'cell':'E4:E4', 'dimension':'ga:pagePath', 'metric':'ga:sessions'},
            {'id':'C01', 'result':RESULT_NA, 'cell':'E9:E9'}
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
            makeApiCall();
        });
    }

    function makeApiCall() {
        gapi.client.load('analytics', 'v3').then(function() {
            // Get a list of all Google Analytics accounts for this user
            gapi.client.analytics.management.accounts.list().then(handleAccounts);
        });
    }

    function handleAccounts(response) {
        // Handles the response from the accounts list method.
        if (response.result.items && response.result.items.length) {
            // Get the first Google Analytics account.
            // Assume that user has only one account.
            var firstAccountId = response.result.items[0].id;
            var accountName = response.result.items[0].name;

            // Get account selection
            var accOptions = document.getElementById('acc');
            addOptions(accOptions, accountName, firstAccountId);

            // Query for properties.
            queryProperties(firstAccountId);
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
        // Handles the response from the webproperties list method.
        if (response.result.items && response.result.items.length) {
            var items = response.result.items;
            var firstAccountId = response.result.items[0].accountId;

            // Get property selection
            var propOptions = document.getElementById('prop');

            // Add properties
            for (j = 0; j < response.result.totalResults; j++) {
                addOptions(propOptions, items[j].name, items[j].id);
            }

            // Change option values based on the selected value.
            propOptions.addEventListener("change", function() {
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
            .then(handleProfiles)
            .then(null, function(err) {
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
                doAudit();
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

    // added 09/24/2016

    function getAccountInfo() {
        accountId = document.getElementById('acc').value;
        webPropertyId = document.getElementById('prop').value;
        profileId = document.getElementById('view').value;

        console.log('Selected Ids : '
            + '\n' + 'accountId : ' + accountId
            + '\n' + 'propertyId : ' + webPropertyId
            + '\n' + 'viewId : '+ profileId);
    }


    function doAudit() {
        // Get GA information
        getAccountInfo();


        for (var i = 0; i < auditTable.length; i++) {
            var id;
            var dimension = auditTable[i].dimension;
            if (typeof(dimension) === 'undefined') {
                console.log('dimension is undefined');
                id = auditTable[i].id;
                auditTable[i].result = runAudit_M(id);
            } else {
                id = profileId;
                var metric = auditTable[i].metric;
                //var filter = auditTable[i].filter;
                //auditTable[i].result = runAudit_R(id, dimension, metric, filter);
            }
        }
        //reportResult();
    }

    function runAudit_M(id) {
        // Audit using Google management API
        var result;
        switch (id) {
            case 'C01':
                result = runC01();
                break;
            default:
                console.log('not C01');
                break;
        }
        return result;
    }

    function runAudit_R(id, dimension, metric) { //, filter) {
        // Audit using Google Reporting API
        console.log('id: ' + id + ', dimension : ' + dimension + ', metric : ' + metric); // + ', filter : ' + filter);
        var result;


        // Make a request to the API
        // https://developers.google.com/analytics/devguides/reporting/core/v4/rest/v4/reports/batchGet
        // https://developers.google.com/analytics/devguides/reporting/core/v4/samples

        gapi.client.request({
            'path': '/v4/reports:batchGet',
            'root': 'https://analyticsreporting.googleapis.com/',
            'method': 'POST',
            'body': {
                //})
                //api.client.analyticsreporting.reports.batchGet({
                'reportRequests': [
                    {
                        'viewId': profileId,
                        'dateRanges': [{
                            'startDate': '7daysAgo',
                            'endDate': 'yesterday'
                        }],
                        'metrics': [{
                            'expression': metric
                        }],
                        'dimensions': [{
                            'name': dimension
                        }]
                    }]
                //}).execute(handleReportingResults);
            }
        }).then(handleReportingResults)
        // }).then(function (response) {
        //     var formattedJson = JSON.stringify(response.result, null, 2);
        //     document.getElementById('query-output').value = formattedJson;
        //     console.log(formattedJson);
        // })

        console.log('runAudit_R result : ' + result);
    }

    function runC01() {
        console.log('account & propert Id : ' + accountId + ', ' + webPropertyId);

        // Get a list of all adWords link for the users
        gapi.client.analytics.management.webPropertyAdWordsLinks.list({
            'accountId': accountId,
            'webPropertyId': webPropertyId
        }).then(handleAdwordslists);
    }

    function handleAdwordslists(response) {
        var result;

        if (response && !response.error) {
            var info = response.result;
            var count = info.totalResults;

            for (var i = 0; i < count; i++) {
                var formattedJson = JSON.stringify(info.items[i], null, 2);
                document.getElementById('C01').value = formattedJson;
            }
        }
    }

    function handleReportingResults(response){
        console.log(response);
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