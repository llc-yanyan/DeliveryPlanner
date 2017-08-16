// This is a JavaScript file
var app = angular.module( 'myApp', ['onsen.directives']);

app.controller('AppController', function(deliveryService, initService, $scope) {
    $scope.title = "コース別仕訳表";
    $scope.cource = "A6";
    // $scope.productList = JSON.parse(JSON.stringify(deliveryService.products));
    $scope.productList = {};
    $scope.deliveryList = {};
    var debug = 0;
    
    // 開始日の算出
    today = new Date();
    if(today.getDay() == 0){ // 日曜日対応
        today.setDate(today.getDate() - 6);
    }else{
        today.setDate(today.getDate() - (today.getDay() - 1));
    }
    
    // 最終日の算出
    $scope.weekDaySt = today.getFullYear() +  "-" + (today.getMonth() + 1) + "-" + today.getDate();
    var calDate = new Date( today );
    // alert(calDate);
    calDate.setDate(calDate.getDate() + 6);
    // alert(calDate);
    $scope.weekDayEd = calDate.getFullYear() + "-" + (calDate.getMonth() + 1) + "-" + calDate.getDate();
    
    // DB生成
    var createDatabase = function(){
        return new Promise(function(resolve, reject) {
            // タイムアウト値の設定は任意
            setTimeout(function(){
                console.log('Start createDatabase');
                var db = window.openDatabase("Database", "1.0", "TestDatabase", 200000);
                if(db.version == "" || debug == 1){
                    alert("1- create db version:" + db.version);
                    console.log('not exist db');
                    // DB無いので作ります
                    db.transaction(
                        function(tx){
                            // 初期データの作成(client)
                            tx.executeSql('DROP TABLE IF EXISTS MClient');
                            tx.executeSql('CREATE TABLE IF NOT EXISTS MClient (clientId unique, categoryName text, clientName text)');
                            for (i = 0; i < initService.init_client.length; i++) {
                                // alert(initService.init_client[i].categoryName);
                                // alert(initService.init_client[i].clientName);
                                tx.executeSql('INSERT INTO MClient VALUES (' + initService.init_client[i].clientId + ', "' + initService.init_client[i].categoryName + '", "' + initService.init_client[i].clientName + '")');
                            }
                            // 初期データの作成(products)
                            tx.executeSql('DROP TABLE IF EXISTS MProduct');
                            tx.executeSql('CREATE TABLE IF NOT EXISTS MProduct (productId unique, productName text)');
                            for (i = 0; i < initService.init_product.length; i++) {
                                // alert(initService.init_product[i].productName);
                                tx.executeSql('INSERT INTO MProduct VALUES (' + initService.init_product[i].productId + ', "' + initService.init_product[i].productName + '")');
                            }
                            // 初期データの作成(delivery)
                            tx.executeSql('DROP TABLE IF EXISTS TDelivery');
                            tx.executeSql('CREATE TABLE IF NOT EXISTS TDelivery (deliveryId unique, clientId, productId, deliveryStDate text, mon, wed, fri)');
                            for (i = 0; i < initService.init_delivery.length; i++) {
                                // alert(initService.init_delivery[i].clientId);
                                tx.executeSql('INSERT INTO TDelivery VALUES (' + (i + 1) + ', ' + initService.init_delivery[i].clientId + ', ' + initService.init_delivery[i].productId + ', "' + initService.init_delivery[i].deliveryStDate + '", ' + initService.init_delivery[i].mon + ', ' + initService.init_delivery[i].wed + ', ' + initService.init_delivery[i].fri + ')');
                            }
                        }, 
                        function(){
                            // 失敗時
                            alert("1- create fail");
                        }, 
                        function(){
                            // 成功時
                            alert("1- create success");
                        }
                    );
                }else{
                    console.log('exist db');            
                    // alert("exist db");
                }
                console.log('End createDatabase');
                resolve();
            },100);
        });
    };

    // 検索(Delivery)
    var selectDeliveryDatabase = function(){
        return new Promise(function(resolve, reject){
            setTimeout(function(){
                console.log('Start selectDatabase');
                var db = window.openDatabase("Database","1.0","TestDatabase",200000);
                alert("2- db version:" + db.version);
                db.transaction(
                    function(tx){
                        // alert("dd");
                        tx.executeSql('SELECT m1.categoryName as categoryName, m1.clientName as clientName, m2.productName as productName, t.mon as mon, t.wed as wed, t.fri as fri FROM (SELECT * FROM TDelivery WHERE deliveryStDate = "' + $scope.weekDaySt + '") t LEFT JOIN MClient m1 ON m1.clientId = t.clientId LEFT JOIN MProduct m2 ON m2.productId = t.productId', [], querySuccess, errorCB);
                    }, 
                    function(){
                        alert("2- select fail");
                        // 失敗時
                    },
                    function(){
                        alert("2- select success");
                        // 成功時
                    }
                );                    
                console.log('End selectDatabase');
            },100);
            
            var querySuccess = function(tx,results){
                alert("2- query success");
                var len = results.rows.length;
                // alert(len);
                console.log('Start query');
                
                var deliveryArray = new Array();
                // *************************
                // クエリ成功時の処理をかく（results →　testdata）
                // *************************
                for (var i = 0; i < len; i++) {
                    alert(results.rows.item(i).categoryName + "/" + results.rows.item(i).clientName + "/" + results.rows.item(i).productName + "/" + results.rows.item(i).mon + "/" + results.rows.item(i).wed + "/" + results.rows.item(i).fri);
                    var rowData = {'categoryName' : results.rows.item(i).categoryName, 'clientName' : results.rows.item(i).clientName};
                    var productArray = new Array();
                    var rowProductData = {"productName" : results.rows.item(i).productName, "mon" : results.rows.item(i).mon, "wed" : results.rows.item(i).wed, "fri" : results.rows.item(i).fri};
                    productArray.push(rowProductData);
                    rowData['products'] = productArray;
                    deliveryArray.push(rowData);
                }
                $scope.deliveryList = deliveryArray;

                // scopeの更新と反映
                $scope.$apply($scope.deliveryList);        // ★
                // alert("query success");
                console.log('End query');
                resolve();
            };
            
            var errorCB = function(err) {
                console.log("Error occured while executing SQL: "+err.code);
            };
        });
    };

    // 検索(Product)
    var selectProductDatabase = function(){
        return new Promise(function(resolve, reject){
            setTimeout(function(){
                console.log('Start selectDatabase');
                var db = window.openDatabase("Database","1.0","TestDatabase",200000);
                alert("3- db version:" + db.version);
                db.transaction(
                    function(tx){
                        // alert("dd");
                        tx.executeSql('SELECT m.productName, ifnull(sum(t.mon), 0) as mon, ifnull(sum(t.wed), 0) as wed, ifnull(sum(t.fri), 0) as fri FROM MProduct m LEFT JOIN (SELECT * FROM TDelivery WHERE deliveryStDate = "' + $scope.weekDaySt + '") t on m.productId = t.productId GROUP BY m.productId', [], querySuccess, errorCB);
                    }, 
                    function(){
                        // alert("select fail");
                        // 失敗時
                    },
                    function(){
                        // alert("select success");
                        // 成功時
                    }
                );                    
                console.log('End selectDatabase');
            },100);
            
            var querySuccess = function(tx,results){
                alert("3- query success");
                var len = results.rows.length;
                // alert(len);
                console.log('Start query');

                var productArray = new Array();
                // *************************
                // クエリ成功時の処理をかく（results →　testdata）
                // *************************
                for (var i = 0; i < len; i++) {
                    // alert(results.rows.item(i).productName + '/' + results.rows.item(i).mon + '/' + results.rows.item(i).wed + '/' + results.rows.item(i).fri);
                    var rowData = {};
                    rowData['productName'] = results.rows.item(i).productName;
                    rowData['mon'] = results.rows.item(i).mon;
                    rowData['wed'] = results.rows.item(i).wed;
                    rowData['fri'] = results.rows.item(i).fri;
                    productArray.push(rowData);
                }
                 $scope.productList = productArray;

                // scopeの更新と反映
                $scope.$apply($scope.productList);        // ★
                // alert("query success");
                console.log('End query');
                resolve();
            };
            
            var errorCB = function(err) {
                console.log("Error occured while executing SQL: "+err.code);
            };
        });
    };

    createDatabase().then(selectProductDatabase).then(selectDeliveryDatabase());
});
