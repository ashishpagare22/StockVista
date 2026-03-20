
var app = angular.module('myapp', []);

app.config(function ($provide, $sceDelegateProvider) {
    //$sceProvider.enabled(false);
 $sceDelegateProvider.resourceUrlWhitelist([
    // Allow same origin resource loads.
    'self',
    // Allow loading from outer templates domain.
    'https://www.bseindia.com*'
  ]); 

    $provide.decorator('$exceptionHandler', function ($delegate) {
        return function (exception, cause) {
            $delegate(exception, cause);
            try{
                console.log('Error occurred! '+exception);
            }
            catch(err)
            {
                console.log(err);
            }
        };
    });
});
app.value('$', $);

app.factory('stockTickerData', ['$', '$rootScope', '$http', '$timeout', function ($, $rootScope, $http, $timeout) {
   

    function stockTickerOperations() {
        var setValues;
        var updateStocks;
        var getSenValContr;
        var getIndicativePrice;
        var arrScripCode = new Array();
        $rootScope.socket;
        $rootScope.streamflag = 0;
        $rootScope.indiceflag = 0;
        $rootScope.session = -1;
        $rootScope.sessionflag = -1;
        
       

        try {

            try {

                $rootScope.socket = io.connect(sensexstreamurl, { upgrade: false, 'transports': ['websocket'] });

                $rootScope.socket.on('reconnect', function (attemptNumber) {
                    
                });

                $rootScope.socket.on('error', function (err) {
                    $rootScope.streamflag = 0;
                    console.log("err......", err);
                })

                $rootScope.socket.on('connect_error', function (error) {
                    $rootScope.streamflag = 0;
                    console.log("ecerrr", error);
                });

                $rootScope.socket.on('reconnecting', function (attemptNumber) {
                    //console.log("on reconnecting", attemptNumber)
                });

                $rootScope.socket.on('disconnect', function () {
                    $rootScope.streamflag = 0;
                    console.log("disconnected......");
                })

                $rootScope.socket.on('connect', function () {
                    console.log("Connected");
                   // $rootScope.socket.emit('joinChannel', { channel: "SenSexValue" });
                    $rootScope.socket.emit('joinChannel', { channel: "SensexIndicativePrice" });
                });
              
                if ($rootScope.sessionflag < 4) {
                    $rootScope.socket.on("SensexIndicativePrice", function (data) {

                        var data2 = JSON.parse(data)
                        var date = new Date();
                        var hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
                        var mm = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
                        $rootScope.indiceflag = data2.indicativePriceFlag;
                        $rootScope.sessionflag = data2.session;
                        $rootScope.session = (data2.session == 1 || data2.session == 2) ? "1" : ((data2.session == 3 || data2.session == 4 || data2.session == 5) ? "0" : "2");
                        if ((9 <= hh) && (hh <= 15)) {
                            //console.log("(hh) >= 15");
                            if ((hh) == 15) {
                                
                                if ((mm) <= 30) {

                                    $('#tdsp').text("");
                                    $('#tdsp01').text("");

                                    $rootScope.streamflag = 1;
                                    $('#tdsp').text(data2.currentIndex);
                                   
                                    $('#tdsp02').text(data2.date + " | " + data2.TimeHHMM);
                                    
                                    if (parseFloat(data2.percChange) < 0) {
                                        $('#tdsp01').addClass('redtext');
                                        
                                        $('#tdsp01').text(data2.percChange + " " + data2.percChange2 + " %");
                                      
                                        $('#tdsp01').removeClass('greentext');
                                        
                                    }
                                    else if (parseFloat(data2.percChange) >= 0) {
                                        $('#tdsp01').addClass('greentext');
                                        
                                        $('#tdsp01').text("+" + data2.percChange + " +" + data2.percChange2 + " %");
                                                                             
                                        $('#tdsp01').removeClass('redtext');
                                    }

                                    $('#tdindisp02').text(data2.date + " | " + data2.TimeHHMM);
                                    $('#tdindisp').text(data2.todayIndexClose);
                                    if (parseFloat(data2.IpercChange) < 0) {
                                        $('#tdindisp01').addClass('redtext');
                                        $('#tdindisp01').text(data2.IChange + " " + data2.IpercChange + " %");
                                        $('#tdindisp01').removeClass('greentext');
                                    }
                                    else if (parseFloat(data2.IpercChange) >0) {
                                        $('#tdindisp01').addClass('greentext');
                                        $('#tdindisp01').text("+" + data2.IChange + " +" + data2.IpercChange + " %");
                                        $('#tdindisp01').removeClass('redtext');
                                    }
                                    else if (parseFloat(data2.IpercChange) == 0) {
                                        $('#tdindisp01').addClass('greentext');
                                        $('#tdindisp01').text(data2.IChange + " " + data2.IpercChange + " %");
                                        $('#tdindisp01').removeClass('redtext');
                                    }
                                    else {
                                        $('#tdindisp01').text('');
                                        $('#tdindisp01').removeClass('redtext');
                                        $('#tdindisp01').removeClass('greentext');
                                    }
                                }
                                else {
                                    console.log("take value from db");
                                    $rootScope.streamflag = 0;
                                    $timeout(function () {
                                        //$rootScope.$apply(getSenVal());
                                    }, 2000);
                                }
                            }
                            else {
                                $('#tdsp').text("");
                                $('#tdsp01').text("");

                                $rootScope.streamflag = 1;
                                $('#tdsp02').text(data2.date + " | " + data2.TimeHHMM);
                             
                                $('#tdsp').text(data2.currentIndex);
                                
                               
                                if (parseFloat(data2.percChange) < 0) {
                                    $('#tdsp01').addClass('redtext');
                                    
                                    $('#tdsp01').text(data2.percChange + " " + data2.percChange2 + " %");
                                    

                                    //$('#tdssp02').text(data2.percChange2);
                                  
                                    $('#tdsp01').removeClass('greentext');
                                  

                                }
                                else if (parseFloat(data2.percChange) >= 0) {
                                    $('#tdsp01').addClass('greentext');
                                    
                                    $('#tdsp01').text("+" + data2.percChange + " +" + data2.percChange2 + " %");
                                   
                                    //$('#tdssp02').text("+" + data2.percChange2);
                                
                                  
                                    $('#tdsp01').removeClass('redtext');
                                    //$('#tdssp02').removeClass('redtext');
                                    //$('#tdssp02').removeClass('tdcolumn');
                                    
                                   
                                }
                                $('#tdindisp02').text(data2.date + " | " + data2.TimeHHMM);
                                $('#tdindisp').text(data2.todayIndexClose);
                                if (parseFloat(data2.IpercChange) < 0) {
                                    $('#tdindisp01').addClass('redtext');
                                    $('#tdindisp01').text(data2.IChange + " " + data2.IpercChange + " %");
                                    $('#tdindisp01').removeClass('greentext');
                                }
                                else if (parseFloat(data2.IpercChange) > 0) {
                                    $('#tdindisp01').addClass('greentext');
                                    $('#tdindisp01').text("+" + data2.IChange + " +" + data2.IpercChange + " %");
                                    $('#tdindisp01').removeClass('redtext');
                                }
                                else if (parseFloat(data2.IpercChange) == 0) {
                                    $('#tdindisp01').addClass('greentext');
                                    $('#tdindisp01').text(data2.IChange + " " + data2.IpercChange + " %");
                                    $('#tdindisp01').removeClass('redtext');
                                }
                                else {
                                    $('#tdindisp01').text('');
                                    $('#tdindisp01').removeClass('redtext');
                                    $('#tdindisp01').removeClass('greentext');
                                }
                            }
                        }
                        else {
                            $rootScope.streamflag = 0;
                            $timeout(function () {
                               // $rootScope.$apply(getSenVal());
                            }, 2000);
                        }
                    })
                }
                else { $rootScope.streamflag = 0;}

            }
            catch(e)
            {
               $rootScope.streamflag = 0;
                console.log(e);
            }
            return {
                setCallbacks: setCallbacks
            }
           
           
        } catch (e) {
            console.log("...eee....", e)
        }

        var setCallbacks = function (getSenVal,getIndicativeVal) {
            getSenValContr = getSenVal;
            getIndicativePrice = getIndicativeVal;
        };
        return {
            setCallbacks: setCallbacks

        }
    }

    return stockTickerOperations;
}]);

app.factory('UpdatestockTickerData', ['$', '$rootScope', '$http', '$timeout', function ($, $rootScope, $http, $timeout) {

    function UpdstockTickerOperations() {
        var initializeClient = function (stock) {

            for (var count = 0; count < $rootScope.stocks.length; count++) {
                var sccode = $rootScope.stocks[count].Symbol;
                if (sccode == stock.Symbol) {
                    var resLen = $rootScope.result.length; //console.log("$rootScope.result", $rootScope.result)
                    for (var cunt = 0; cunt < resLen; cunt++) {
                        var sym = $rootScope.result[cunt].Symbol;
                        if (sym == stock.Symbol) {//stock.Symbol
                            var BuyQty = $rootScope.stocks[count].BuyQty;
                            var BidPrice = $rootScope.stocks[count].BuyPrice;
                            var SellPrice = $rootScope.stocks[count].SellPrice;
                            var SellQty = $rootScope.stocks[count].SellQty;
                            var LTP = $rootScope.stocks[count].Price;
                            var Changeold = $rootScope.stocks[count].Change;
                            var PerChange = $rootScope.stocks[count].PercentChange;
                            var Volume = $rootScope.stocks[count].Volume;
                            var TurnOver = $rootScope.stocks[count].TurnOver;
                            var OI = $rootScope.stocks[count].OI;
                            var newStock = $rootScope.stocks[count];
                            var IndicativePrice = stock.IndicativePrice == "-" ? newStock.IndicativePrice : stock.IndicativePrice;
                            var PreCloseRate = stock.PreCloseRate == "-" ? newStock.PreCloseRate : stock.PreCloseRate;
                            var Price = stock.Price == "-" ? newStock.Price : stock.Price;
                            if (stock.MsgType != "2015") {
                                if (stock.SessionNumber == "1" || stock.SessionNumber == "2") {
                                    if (IndicativePrice != undefined && PreCloseRate != undefined) {
                                        Change = (IndicativePrice / 1).toFixed(4) == "0.0000" ? null : ((IndicativePrice / 1) - (PreCloseRate / 1)).toFixed(4) == "0.0000" ? null : ((Price / 1) - (PreCloseRate / 1)).toFixed(4);
                                    }
                                    if (Change != null && Change != "undefined") {
                                        newStock.Change = parseFloat(Change);
                                    }

                                }
                                else {
                                    if (Price != undefined && PreCloseRate != undefined) {
                                        Change = (Price / 1).toFixed(4) == "0.0000" ? null : ((Price / 1) - (PreCloseRate / 1)).toFixed(4) == "0.0000" ? null : ((Price / 1) - (PreCloseRate / 1)).toFixed(4);
                                        if (Change != null && Change != "undefined") {
                                            newStock.Change = parseFloat(Change);
                                        }
                                    }
                                }
                            }

                            for (var s in stock) {

                                if (s == "OI" && stock.OI != "-" && stock.OI != undefined) {
                                    newStock.OI = stock.OI;
                                }


                                if (s == "Price" && stock.Price != "-" && stock.Price != undefined) {
                                    newStock.Price = stock.Price;
                                }

                                if (s == "BuyPrice" && stock.BuyPrice != "-" && stock.BuyPrice != undefined) {
                                    newStock.BuyPrice = stock.BuyPrice;
                                }
                                if (s == "SellPrice" && stock.SellPrice != "-" && stock.SellPrice != undefined) {
                                    newStock.SellPrice = stock.SellPrice;
                                }



                                if (s == "BuyQty" && stock.BuyQty != "-" && stock.BuyQty != undefined) {
                                    newStock.BuyQty = stock.BuyQty;
                                }


                                if (s == "SellQty" && stock.SellQty != "-" && stock.SellQty != undefined) {
                                    newStock.SellQty = stock.SellQty;
                                }

                                if (s == "PercentChange" && stock.PercentChange != "-" && stock.PercentChange != undefined) {
                                    newStock.PercentChange = stock.PercentChange;
                                }

                                if (s == "TurnOver" && stock.TurnOver != "-" && stock.TurnOver != undefined) {
                                    newStock.TurnOver = stock.TurnOver;
                                }

                                if (s == "BuyPrice2" && stock.BuyPrice2 != "-" && stock.BuyPrice2 != undefined) {
                                    newStock.BuyPrice2 = stock.BuyPrice2;
                                }

                                if (s == "BuyPrice3" && stock.BuyPrice3 != "-" && stock.BuyPrice3 != undefined) {
                                    newStock.BuyPrice3 = stock.BuyPrice3;
                                }
                                if (s == "BuyPrice4" && stock.BuyPrice4 != "-" && stock.BuyPrice4 != undefined) {
                                    newStock.BuyPrice4 = stock.BuyPrice4;
                                }
                                if (s == "BuyPrice5" && stock.BuyPrice5 != "-" && stock.BuyPrice5 != undefined) {
                                    newStock.BuyPrice5 = stock.BuyPrice5;
                                }
                                if (s == "SellPrice2" && stock.SellPrice2 != "-" && stock.SellPrice2 != undefined) {
                                    newStock.SellPrice2 = stock.SellPrice2;
                                }
                                if (s == "SellPrice3" && stock.SellPrice3 != "-" && stock.SellPrice3 != undefined) {
                                    newStock.SellPrice3 = stock.SellPrice3;
                                }
                                if (s == "SellPrice4" && stock.SellPrice4 != "-" && stock.SellPrice4 != undefined) {
                                    newStock.SellPrice4 = stock.SellPrice4;
                                }
                                if (s == "SellPrice5" && stock.SellPrice5 != "-" && stock.SellPrice5 != undefined) {
                                    newStock.SellPrice5 = stock.SellPrice5;
                                }

                                if (s == "BuyQty2" && stock.BuyQty2 != "-" && stock.BuyQty2 != undefined) {
                                    newStock.BuyQty2 = stock.BuyQty2;
                                }
                                if (s == "BuyQty3" && stock.BuyQty3 != "-" && stock.BuyQty3 != undefined) {
                                    newStock.BuyQty3 = stock.BuyQty3;
                                }
                                if (s == "BuyQty4" && stock.BuyQty4 != "-" && stock.BuyQty4 != undefined) {
                                    newStock.BuyQty4 = stock.BuyQty4;
                                }
                                if (s == "BuyQty5" && stock.BuyQty5 != "-" && stock.BuyQty5 != undefined) {
                                    newStock.BuyQty5 = stock.BuyQty5;
                                }

                                if (s == "SellQty2" && stock.SellQty2 != "-" && stock.SellQty2 != undefined) {
                                    newStock.SellQty2 = stock.SellQty2;
                                }
                                if (s == "SellQty3" && stock.SellQty3 != "-" && stock.SellQty3 != undefined) {
                                    newStock.SellQty3 = stock.SellQty3;
                                }
                                if (s == "SellQty4" && stock.SellQty4 != "-" && stock.SellQty4 != undefined) {
                                    newStock.SellQty4 = stock.SellQty4;
                                }
                                if (s == "SellQty5" && stock.SellQty5 != "-" && stock.SellQty5 != undefined) {
                                    newStock.SellQty5 = stock.SellQty5;
                                }

                                if (s == "Bids1" && stock.Bids1 != "-" && stock.Bids1 != undefined) {
                                    newStock.Bids1 = stock.Bids1;
                                }
                                if (s == "Bids2" && stock.Bids2 != "-" && stock.Bids2 != undefined) {
                                    newStock.Bids2 = stock.Bids2;
                                }
                                if (s == "Bids3" && stock.Bids3 != "-" && stock.Bids3 != undefined) {
                                    newStock.Bids3 = stock.Bids3;
                                }
                                if (s == "Bids4" && stock.Bids4 != "-" && stock.Bids4 != undefined) {
                                    newStock.Bids4 = stock.Bids4;
                                }
                                if (s == "Bids5" && stock.Bids5 != "-" && stock.Bids5 != undefined) {
                                    newStock.Bids5 = stock.Bids5;
                                }

                                if (s == "Ask1" && stock.Ask1 != "-" && stock.Ask1 != undefined) {
                                    newStock.Ask1 = stock.Ask1;
                                }
                                if (s == "Ask2" && stock.Ask2 != "-" && stock.Ask2 != undefined) {
                                    newStock.Ask2 = stock.Ask2;
                                }
                                if (s == "Ask3" && stock.Ask3 != "-" && stock.Ask3 != undefined) {
                                    newStock.Ask3 = stock.Ask3;
                                }
                                if (s == "Ask4" && stock.Ask4 != "-" && stock.Ask4 != undefined) {
                                    newStock.Ask4 = stock.Ask4;
                                }
                                if (s == "Ask5" && stock.Ask5 != "-" && stock.Ask5 != undefined) {
                                    newStock.Ask5 = stock.Ask5;
                                }
                                if (s == "Volume" && stock.Volume != "-" && stock.Volume != undefined) {
                                    newStock.Volume = stock.Volume;
                                }
                            }

                            stock = newStock;
                            $rootScope.stocks[count] = stock;
                            var BuyQtycolor = 'BuyQtycolor' + sym;
                            var BidPriceColor = 'BidPriceColor' + sym;
                            var SellPriceColor = 'SellPriceColor' + sym;
                            var SellQtyColor = 'SellQtyColor' + sym;
                            var LTPColor = 'LTPColor' + sym;
                            var ChangeColor = 'ChangeColor' + sym;
                            var PerChangeColor = 'PerChangeColor' + sym;
                            var VolumeColor = 'VolumeColor' + sym;
                            var TurnOverColor = 'TurnOverColor' + sym;
                            var OIColor = 'OIColor' + sym;

                            //BidQty
                            if (BuyQty > stock.BuyQty) {
                                $rootScope[BuyQtycolor] = {
                                    "background-color": "#de1439",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[BuyQtycolor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    };
                                    //delete $rootScope[BuyQtycolor];
                                }, 3000);

                            }
                            else if (BuyQty < stock.BuyQty) {
                                $rootScope[BuyQtycolor] = {
                                    "background-color": "#00008c",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[BuyQtycolor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    };
                                    //delete $rootScope[BuyQtycolor];
                                }, 3000);
                            }
                            else {
                                $timeout(function () {
                                    $rootScope[BuyQtycolor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    };
                                    //delete $rootScope[BuyQtycolor];
                                }, 3000);
                            }

                            //Bid Price
                            if (BidPrice > stock.BuyPrice) {
                                $rootScope[BidPriceColor] = {
                                    "background-color": "#de1439",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[BidPriceColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    };
                                    //delete $rootScope[BidPriceColor];

                                }, 3000);
                            }
                            else if (BidPrice < stock.BuyPrice) {
                                $rootScope[BidPriceColor] = {
                                    "background-color": "#00008c",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[BidPriceColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    };
                                    //delete $rootScope[BidPriceColor];
                                }, 3000);
                            }

                            else {
                                $timeout(function () {
                                    $rootScope[BidPriceColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    };

                                }, 3000);
                            }

                            //SellPrice
                            if (SellPrice > stock.SellPrice) {
                                $rootScope[SellPriceColor] = {
                                    "background-color": "#de1439",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[SellPriceColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }
                            else if (SellPrice < stock.SellPrice) {
                                $rootScope[SellPriceColor] = {
                                    "background-color": "#00008c",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[SellPriceColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }
                            else {
                                $timeout(function () {
                                    $rootScope[SellPriceColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }



                            //SellQty
                            if (SellQty > stock.SellQty) {
                                $rootScope[SellQtyColor] = {
                                    "background-color": "#de1439",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[SellQtyColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }
                            else if (SellQty < stock.SellQty) {
                                $rootScope[SellQtyColor] = {
                                    "background-color": "#00008c",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[SellQtyColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }
                            else {
                                $timeout(function () {
                                    $rootScope[SellQtyColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }


                            //LTP
                            if (LTP > stock.Price) {
                                $rootScope[LTPColor] = {
                                    "background-color": "#de1439",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[LTPColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }
                            else if (LTP < stock.Price) {
                                $rootScope[LTPColor] = {
                                    "background-color": "#00008c",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[LTPColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }
                            else {
                                $timeout(function () {
                                    $rootScope[LTPColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }


                            //Change
                            if (Changeold > newStock.Change) {

                                $rootScope[ChangeColor] = {
                                    "background-color": "#de1439",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[ChangeColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }
                            else if (Changeold < newStock.Change) {
                                $rootScope[ChangeColor] = {
                                    "background-color": "#00008c",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[ChangeColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }
                            else {
                                $timeout(function () {
                                    $rootScope[ChangeColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }


                            //PerChange
                            if (PerChange > stock.PercentChange) {
                                $rootScope[PerChangeColor] = {
                                    "background-color": "#de1439",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[PerChangeColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }
                            else if (PerChange < stock.PercentChange) {
                                $rootScope[PerChangeColor] = {
                                    "background-color": "#00008c",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[PerChangeColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }
                            else {
                                $timeout(function () {
                                    $rootScope[PerChangeColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }


                            //Volume
                            if (Volume > stock.Volume) {
                                $rootScope[VolumeColor] = {
                                    "background-color": "#de1439",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[VolumeColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }
                            else if (Volume < stock.Volume) {
                                $rootScope[VolumeColor] = {
                                    "background-color": "#00008c",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[VolumeColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }
                            else {
                                $timeout(function () {
                                    $rootScope[VolumeColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }


                            //TurnOver
                            if (TurnOver > stock.TurnOver) {
                                $rootScope[TurnOverColor] = {
                                    "background-color": "#de1439",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[TurnOverColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }
                            else if (TurnOver < stock.TurnOver) {
                                $rootScope[TurnOverColor] = {
                                    "background-color": "#00008c",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[TurnOverColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }
                            else {
                                $timeout(function () {
                                    $rootScope[TurnOverColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }

                            //OI
                            if (OI > stock.OI) {
                                $rootScope[OIColor] = {
                                    "background-color": "#de1439",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[OIColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);

                            }
                            else if (OI < stock.OI) {
                                $rootScope[OIColor] = {
                                    "background-color": "#00008c",
                                    "color": "white"
                                }
                                $timeout(function () {
                                    $rootScope[OIColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }
                            else {
                                $timeout(function () {
                                    $rootScope[OIColor] = {
                                        "background-color": "#FFFFFF",
                                        "color": "black"
                                    }
                                }, 3000);
                            }

                            $rootScope.result[cunt] = stock;

                        }
                    }
                    var arrNew = [];
                    if ($rootScope.resultMarDepthStream.length == 1) {
                        var sym = $rootScope.resultMarDepthStream[0].Symbol;
                        if (sym == stock.Symbol) {
                            arrNew[0] = stock;
                            $rootScope.resultMarDepthStream = eval(arrNew);
                            var a = eval(arrNew);
                        }
                    }
                }
            }

        };

        return {
            initializeClient: initializeClient
        }
    };

    return UpdstockTickerOperations;
}]);

