
var app = angular.module('listScrip_module', ["appglobal", "topHeader", "ui.bootstrap", "smartsearch"])
app.constant('serviceurl', {
    url_listofScrip: 'ListofScripData/w',
    url_downloascsv: 'LitsOfScripCSVDownload/w',
    url_Industry: 'ddlScripIndustry/w',
    url_Group: 'ddlGroup/w'
});



app.controller('Listofscrip_controller', ['serviceurl', '$scope', '$http', '$timeout', '$injector', '$location', '$rootScope', '$window', 'mainapi', '$sce', '$filter', function Listofscrip_controller(serviceurl, $scope, $http, $timeout, $injector, $location, $rootScope, $window, mainapi, $sce, $filter) {

    $scope.loader = {
        gloading: 'loading',
        delay: false,
    };
	
    var querystr = $location.absUrl().replace(/[\\#,+()$~%.":*<>{};&=]/g, '/');
    var scripcode;
    if (querystr.length > 0 && querystr.indexOf('scrip') != -1) {

        var a = querystr.split('?');
        if (a != undefined && a.length > 1) {

            var split = a[1].split('/');
            scripcode = split[1];
            $rootScope.scripcode = scripcode;
            scripcode = split[1];
        }
        else {
            $rootScope.scripcode = '';
        }
    }

    $scope.init = function () {
        //$scope.fn_dllIndustry(1);
        $scope.fn_Groups(0);
    }

    $scope.fn_dllIndustry = function (flag) {
        $scope.loader.gloading = 'loading';
        if (flag == undefined || flag == "Select") {
            flag = 1;
        }
        var url = mainapi.newapi_domain + serviceurl.url_Industry;
        $http({ url: url, method: "GET", params: { flag: flag } }).then(function successCallback(response) {
            $scope.Industry = (response.data);
            $scope.loader.gloading = 'loaded';

        }, function errorCallback(response) {
            $scope.status = response.status + "_" + response.statusText;
            if (response.status == (500 || 503 || 403)) {
                $scope.loader.gloading = 'loaded';
            }
        });
    }

    $scope.fn_Groups = function (flag) {
        $scope.loader.gloading = 'loading';
        if (flag == undefined || flag == "Select") {
            flag = 0;
        }
        var url = mainapi.newapi_domain + serviceurl.url_Group;

        $http({ url: url, method: "GET", params: { flag: flag } }).then(function successCallback(response) {
            $scope.groups = (response.data);
            $scope.loader.gloading = 'loaded';
        }, function errorCallback(response) {
            $scope.status = response.status + "_" + response.statusText;
            if (response.status == (500 || 503 || 403)) {
                $scope.loader.gloading = 'loaded';
            }
        });
    }

    $scope.currentPage = 1;
    $scope.pageSize = 25;

    $scope.getPaginatedData = function () {
        const start = ($scope.currentPage - 1) * $scope.pageSize;
        return $scope.listofscrip.slice(start, start + $scope.pageSize);
    };

    $scope.totalPages = function () {
        return Math.ceil($scope.listofscrip.length / $scope.pageSize);
    };


    //$scope.changesegment = function () {

    //    $scope.segment = $("#ddlsegment").val();
    //    if ($scope.segment == "" || $scope.segment == undefined) {
    //        $scope.segment = "";
    //    }
    //    $scope.fn_dllIndustry($scope.segment);
    //    $scope.fn_Group($scope.segment);
    //}

    $scope.fn_ListOfScrip = function (segment, status, Group, Scripcode) {

        $scope.loader.delay = false;
        $scope.loader.gloading = 'loading';

        var url = mainapi.newapi_domain + serviceurl.url_listofScrip;
        $http({ url: url, method: "GET", params: { segment: segment, status: status, Group: Group, Scripcode: Scripcode } }).then(function successCallback(response) {

            $scope.listofscrip = (response.data);
          
            $scope.loader.gloading = 'loaded';

        }, function errorCallback(response) {
            $scope.status = response.status + "_" + response.statusText;
            if (response.status == (500 || 503 || 403)) {
                $scope.loader.delay = true;
                $scope.loader.gloading = 'loading';
            }
        });

        /* $scope.init();*/
    }

    $scope.fn_Scrip = function (segment, status, Group, Scripcode) {


        $scope.loader.gloading = 'loading';
        $scope.loader.delay = false;
        if ($("#ddlsegment").val() == undefined || $("#ddlsegment").val() == "Select") {
            //$scope.segment = "Equity";
            $scope.segment = "";
        }
        else {
            $scope.segment = $("#ddlsegment").val();
        }
        if ($("#ddlstatus").val() == undefined || $("#ddlstatus").val() == "Select") {
            //$scope.status = "Active";
            $scope.status = "";
        }
        else {
            $scope.status = $("#ddlstatus").val();
        }
        var status = $("#ddlstatus").val()

        var url = mainapi.newapi_domain + serviceurl.url_listofScrip;
        $http({ url: url, method: "GET", params: { segment: $scope.segment, status: $scope.status, Group: Group, Scripcode: Scripcode } }).then(function successCallback(response) {

            $scope.listofscrip = (response.data);
            $scope.loader.gloading = 'loaded';
            $scope.loader.delay = false;
        }, function errorCallback(response) {
            $scope.status = response.status + "_" + response.statusText;
            if (response.status == (500 || 503 || 403)) {
                $scope.loader.delay = true;
                $scope.loader.gloading = 'loading';
            }
        });
    }


    $scope.fn_downloadcsv = function () {

        var scripcode = $rootScope.scripcode == '' ? '' : $rootScope.scripcode;
        if ($("#ddlsegment").val() == "Select") {
            $scope.segment = "";
        }
        else {
            $scope.segment = String($("#ddlsegment").val() || "");
        }
        if ($("#ddlstatus").val() == undefined || $("#ddlstatus").val() == "Select") {
            $scope.status = "";
        }
        else {
            $scope.status = String($("#ddlstatus").val() || "");
        }
        if ($("#ddlGroup").val() == "" || $("#ddlGroup").val() == "Select") {
            $scope.group = "";
        }
        else {
            $scope.group = String($("#ddlGroup").val() || "");
        }
        //if ($("#ddlIndustry").val() == "" || $("#ddlIndustry").val() == "Select") {
        //    $scope.Industry = "";
        //}
        //else {
        //    $scope.Industry = $("#ddlIndustry").val();
        //}

        if ($scope.segment == "" || $scope.status == "" || $scope.group == "" || $scope.scripcode == "") {
            path = mainapi.newapi_domain + serviceurl.url_downloascsv;
            const params = new URLSearchParams({
                
                Scripcode: String(scripcode || ""),
                Group: String($scope.group || ""),
                status: String($scope.status || ""),
                segment: String($scope.segment || "")
            }).toString();

            const safeUrl = `${path}?${params}`;
            window.location.assign(safeUrl);
         

        }
        else {
            alert('Please select at least one to search record');
        }

        $scope.init();
    }


    $scope.fn_submit = function () {
$scope.currentPage = 1;
        $scope.loader.gloading = 'loading';
        $scope.loader.delay = false;
        var scripcode = $rootScope.scripcode == '' ? '' : $rootScope.scripcode;
        if ($("#ddlsegment").val() == "Select") {
            $scope.loader.gloading = 'loaded';
            $scope.segment = "";
        }
        else {
            $scope.loader.gloading = 'loaded';
            $scope.segment = $("#ddlsegment").val();
        }
        if ($("#ddlstatus").val() == undefined || $("#ddlstatus").val() == "Select") {
            $scope.loader.gloading = 'loaded';
            $scope.status = "";
        }
        else {
            $scope.loader.gloading = 'loaded';
            $scope.status = $("#ddlstatus").val();
        }
        if ($("#ddlGroup").val() == "" || $("#ddlGroup").val() == "Select") {
            $scope.loader.gloading = 'loaded';
            $scope.group = "";
        }
        else {
            $scope.loader.gloading = 'loaded';
            $scope.group = $("#ddlGroup").val();
        }
        //if ($("#ddlIndustry").val() == "" || $("#ddlIndustry").val() == "Select") {
        //    $scope.loader.gloading = 'loaded';
        //    $scope.Industry = "";
        //}
        //else {
        //    $scope.loader.gloading = 'loaded';
        //    $scope.Industry = $("#ddlIndustry").val();
        //}



        if ($scope.segment != "") {
            $scope.loader.gloading = 'loaded';
            $scope.isdatavisible = true;
            $scope.fn_ListOfScrip($scope.segment, $scope.status, $scope.group, scripcode);
        }
        else {
            $scope.loader.gloading = 'loaded';
            alert('Please Select Segment');
        }

    }

    $scope.fn_reset = function () {

        $("#scripsearchtxtbx").val('');
        //$("#ddlIndustry").val('1');
        //$scope.fn_dllIndustry(1);
        $("#ddlGroup").val("");
        //$scope.group = "";
        //$scope.Industry = "";
        $("#ddlstatus").val('Select');
        $("#ddlsegment").val('Select');
        $rootScope.scripcode == '';
        //$scope.init();
        $scope.fn_ListOfScrip();
        $scope.isdatavisible = false;
    }
    $scope.recallFunction = function () {
        $timeout(function () {
            if ($scope.loader.delay == true) { $scope.fn_Scrip(); }
            $scope.recallFunction();
        }, 20000)
    };
    $scope.recallFunction();

}]);