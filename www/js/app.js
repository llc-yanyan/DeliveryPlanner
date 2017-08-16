// This is a JavaScript file
var app = angular.module( 'myApp', ['onsen.directives']);

app.controller('AppController', function(initService, formatDate, calcStWeekDate, calcEdWeekDate, $scope) {
    $scope.title = "コース別仕訳表";
    $scope.cource = "A6";
    $scope.productList = {};
    $scope.deliveryList = {};
    $scope.insertBtnHide = true;
    $scope.updateBtnHide = true;
    $scope.copyBtnHide = true;
    var debug = 0;
    
    // 開始日の算出
    today = new Date();
    if(today.getDay() == 0){ // 日曜日対応
        today.setDate(today.getDate() - 6);
    }else{
        today.setDate(today.getDate() - (today.getDay() - 1));
    }
    
    $scope.weekDaySt = formatDate(calcStWeekDate(today));
    $scope.weekDayEd = formatDate(calcEdWeekDate(today));
    
    // DB生成
    var createDatabase = function(){
        return new Promise(function(resolve, reject) {
            // タイムアウト値の設定は任意
            setTimeout(function(){
                console.log('Start createDatabase');
                var db = window.openDatabase("Database", "1.0", "TestDatabase", 200000);
                if(db.version == "" || debug == 1){
                    // alert("1- create db version:" + db.version);
                    console.log('not exist db');
                    // DB無いので作ります
                    db.transaction(
                        function(tx){
                            // 初期データの作成(client)
                            tx.executeSql('DROP TABLE IF EXISTS MClient');
                            tx.executeSql('CREATE TABLE IF NOT EXISTS MClient (clientId INTEGER PRIMARY KEY AUTOINCREMENT, categoryName text, clientName text)');
                            for (i = 0; i < initService.init_client.length; i++) {
                                tx.executeSql('INSERT INTO MClient VALUES (' + initService.init_client[i].clientId + ', "' + initService.init_client[i].categoryName + '", "' + initService.init_client[i].clientName + '")');
                            }
                            // 初期データの作成(products)
                            tx.executeSql('DROP TABLE IF EXISTS MProduct');
                            tx.executeSql('CREATE TABLE IF NOT EXISTS MProduct (productId INTEGER PRIMARY KEY AUTOINCREMENT, productName text)');
                            for (i = 0; i < initService.init_product.length; i++) {
                                tx.executeSql('INSERT INTO MProduct VALUES (' + initService.init_product[i].productId + ', "' + initService.init_product[i].productName + '")');
                            }
                            // 初期データの作成(delivery)
                            tx.executeSql('DROP TABLE IF EXISTS TDelivery');
                            tx.executeSql('CREATE TABLE IF NOT EXISTS TDelivery (deliveryId INTEGER PRIMARY KEY AUTOINCREMENT, clientId, productId, deliveryStDate text, mon, wed, fri, other)');
                            for (i = 0; i < initService.init_delivery.length; i++) {
                                tx.executeSql('INSERT INTO TDelivery VALUES (' + (i + 1) + ', ' + initService.init_delivery[i].clientId + ', ' + initService.init_delivery[i].productId + ', "' + initService.init_delivery[i].deliveryStDate + '", ' + initService.init_delivery[i].mon + ', ' + initService.init_delivery[i].wed + ', ' + initService.init_delivery[i].fri + ', ' + initService.init_delivery[i].other + ')');
                            }
                        }, 
                        function(){
                          // 失敗時
                          // alert("1- create fail");
                        }, 
                        function(){
                          // 成功時
                          // alert("1- create success");
                          resolve();
                        }
                    );
                }else{
                    console.log('exist db');            
                    // alert("exist db");
                }
                console.log('End createDatabase');
            },100);
        });
    };

    // 検索(Delivery)
    var selectDeliveryDatabase = function(){
        return new Promise(function(resolve, reject){
            setTimeout(function(){
                console.log('Start selectDatabase');
                var db = window.openDatabase("Database","1.0","TestDatabase",200000);
                // alert("2- db version:" + db.version);
                db.transaction(
                    function(tx){
                        // alert("dd");
                        tx.executeSql('SELECT m1.categoryName as categoryName, m1.clientName as clientName, m1.clientId as clientId, m2.productName as productName, m2.productId as productId, t.deliveryId as deliveryId, t.deliveryStDate as deliveryStDate, t.mon as mon, t.wed as wed, t.fri as fri, t.other as other FROM (SELECT * FROM TDelivery WHERE deliveryStDate = "' + $scope.weekDaySt + '") t LEFT JOIN MClient m1 ON m1.clientId = t.clientId LEFT JOIN MProduct m2 ON m2.productId = t.productId', [], querySuccess, errorCB);
                    }, 
                    function(){
                        // alert("2- select fail");
                        // 失敗時
                    },
                    function(){
                        // alert("2- select success");
                        // 成功時
                    }
                );                    
                console.log('End selectDatabase');
            },100);
            
            var querySuccess = function(tx,results){
                // alert("2- query success");
                var len = results.rows.length;
                // alert(len);
                console.log('Start query');
                if (len == 0) {
                  $scope.updateBtnHide = true;
                  if (today >= new Date()) {
                    $scope.copyBtnHide = false;
                  } else {
                    $scope.copyBtnHide = true;
                  }
                } else {
                  $scope.updateBtnHide = false;
                  $scope.copyBtnHide = true;
                }
                
                var deliveryArray = new Array();
                // *************************
                // クエリ成功時の処理をかく
                // *************************
                var fflg = false;
                var _clientId;
                for (var i = 0; i < len; i++) {
                  // alert(results.rows.item(i).categoryName + "/" + results.rows.item(i).clientName + "/" + results.rows.item(i).productName + "/" + results.rows.item(i).deliveryId + "/" + results.rows.item(i).mon + "/" + results.rows.item(i).wed + "/" + results.rows.item(i).fri);
                  fflg = _clientId == results.rows.item(i).clientId ? true : false;
                  if (!fflg) {
                    var rowData = {};
                    rowData['categoryName'] = results.rows.item(i).categoryName;
                    rowData['clientName'] = results.rows.item(i).clientName;
                    var productArray = new Array();
                  }
                  var rowProductData = {};
                  rowProductData['deliveryId'] = results.rows.item(i).deliveryId;
                  rowProductData['clientId'] = results.rows.item(i).clientId;
                  rowProductData['productId'] = results.rows.item(i).productId;
                  rowProductData['deliveryStDate'] = results.rows.item(i).deliveryStDate;
                  rowProductData['productName'] = results.rows.item(i).productName;
                  rowProductData['mon'] = results.rows.item(i).mon
                  rowProductData['wed'] = results.rows.item(i).wed
                  rowProductData['fri'] = results.rows.item(i).fri
                  rowProductData['other'] = results.rows.item(i).other;
                  productArray.push(rowProductData);
                  if (!fflg) {
                    rowData['products'] = productArray;
                    deliveryArray.push(rowData);
                  }
                  _clientId = results.rows.item(i).clientId;
                }
                $scope.deliveryList = deliveryArray;

                // scopeの更新と反映
                $scope.$apply($scope.deliveryList); // ★
                // alert("query success");
                console.log('End query');
                // alert(JSON.stringify($scope.deliveryList));
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
                // alert("3- db version:" + db.version);
                db.transaction(
                    function(tx){
                        // alert("dd");
                        tx.executeSql('SELECT m.productName, ifnull(sum(t.mon), 0) as mon, ifnull(sum(t.wed), 0) as wed, ifnull(sum(t.fri), 0) as fri, ifnull(sum(t.other), 0) as other FROM MProduct m LEFT JOIN (SELECT * FROM TDelivery WHERE deliveryStDate = "' + $scope.weekDaySt + '") t on m.productId = t.productId GROUP BY m.productId', [], querySuccess, errorCB);
                    }, 
                    function(){
                        // alert("3- select fail");
                        // 失敗時
                    },
                    function(){
                        // alert("3- select success");
                        // 成功時
                    }
                );                    
                console.log('End selectDatabase');
            },100);
            
            var querySuccess = function(tx,results){
                // alert("3- query success");
                var len = results.rows.length;
                // alert(len);
                console.log('Start query');

                var productArray = new Array();
                // *************************
                // クエリ成功時の処理をかく
                // *************************
                for (var i = 0; i < len; i++) {
                    // alert(results.rows.item(i).productName + '/' + results.rows.item(i).mon + '/' + results.rows.item(i).wed + '/' + results.rows.item(i).fri);
                    var rowData = {};
                    rowData['productName'] = results.rows.item(i).productName;
                    rowData['mon'] = results.rows.item(i).mon;
                    rowData['wed'] = results.rows.item(i).wed;
                    rowData['fri'] = results.rows.item(i).fri;
                    rowData['other'] = results.rows.item(i).other;
                    productArray.push(rowData);
                }
                 $scope.productList = productArray;

                // scopeの更新と反映
                $scope.$apply($scope.productList);        // ★
                // alert("query success");
                console.log('End query');
                // alert(JSON.stringify($scope.productList));
                resolve();
            };
            
            var errorCB = function(err) {
                console.log("Error occured while executing SQL: "+err.code);
            };
        });
    };

    // Copy(Delivery)
    var copyDeliveryDatabase = function(){
        return new Promise(function(resolve, reject){
            setTimeout(function(){
                console.log('Start copyDatabase');
                var db = window.openDatabase("Database","1.0","TestDatabase",200000);
                // alert("5- db version:" + db.version);
                db.transaction(
                    function(tx){
                        tmpDate = new Date($scope.weekDaySt);
                        tmpDate.setDate(tmpDate.getDate() - 7);
                        // alert(tmpDate);
                        tx.executeSql('SELECT m1.categoryName as categoryName, m1.clientName as clientName, m1.clientId as clientId, m2.productName as productName, m2.productId as productId, t.deliveryId as deliveryId, t.deliveryStDate as deliveryStDate, t.mon as mon, t.wed as wed, t.fri as fri, t.other as other FROM (SELECT * FROM TDelivery WHERE deliveryStDate = "' + formatDate(tmpDate) + '") t LEFT JOIN MClient m1 ON m1.clientId = t.clientId LEFT JOIN MProduct m2 ON m2.productId = t.productId', [], querySuccess, errorCB);
                    }, 
                    function(){
                        // alert("5- select fail");
                        // 失敗時
                    },
                    function(){
                        // alert("5- select success");
                        // 成功時
                    }
                );                    
                console.log('End selectDatabase');
            },100);
            
            var querySuccess = function(tx,results){
                // alert("5- query success");
                var len = results.rows.length;
                // alert(len);
                console.log('Start query');
                
                var deliveryArray = new Array();
                // *************************
                // クエリ成功時の処理をかく
                // *************************
                var fflg = false;
                var _clientId;
                for (var i = 0; i < len; i++) {
                  // alert(results.rows.item(i).categoryName + "/" + results.rows.item(i).clientName + "/" + results.rows.item(i).productName + "/" + results.rows.item(i).mon + "/" + results.rows.item(i).wed + "/" + results.rows.item(i).fri);
                  fflg = _clientId == results.rows.item(i).clientId ? true : false;
                  if (!fflg) {
                    var rowData = {};
                    rowData['categoryName'] = results.rows.item(i).categoryName;
                    rowData['clientName'] = results.rows.item(i).clientName;
                    var productArray = new Array();
                  }
                  var rowProductData = {};
                  rowProductData['deliveryId'] = "";
                  rowProductData['clientId'] = results.rows.item(i).clientId;
                  rowProductData['productId'] = results.rows.item(i).productId;
                  rowProductData['deliveryStDate'] = $scope.weekDaySt;
                  rowProductData['productName'] = results.rows.item(i).productName;
                  rowProductData['mon'] = results.rows.item(i).mon
                  rowProductData['wed'] = results.rows.item(i).wed
                  rowProductData['fri'] = results.rows.item(i).fri
                  rowProductData['other'] = results.rows.item(i).other;
                  productArray.push(rowProductData);
                  if (!fflg) {
                    rowData['products'] = productArray;
                    deliveryArray.push(rowData);
                  }
                  _clientId = results.rows.item(i).clientId;
                }
                $scope.deliveryList = deliveryArray;

                $scope.insertBtnHide = false;
                $scope.copyBtnHide = true;

                // scopeの更新と反映
                $scope.$apply($scope.deliveryList); // ★
                // alert("5- query success");
                console.log('End query');
                // alert(JSON.stringify($scope.deliveryList));
                resolve();
            };
            
            var errorCB = function(err) {
                console.log("Error occured while executing SQL: "+err.code);
            };
        });
    };
    
    if(debug == 0) {
      selectProductDatabase().then(selectDeliveryDatabase());
    }else{
      createDatabase().then(selectProductDatabase).then(selectDeliveryDatabase());
    }
    
    $scope.prevWeek = function() {
      // 開始日の算出
      today.setDate(today.getDate() - 7);
      // alert(today.getDate());
      $scope.weekDaySt = formatDate(calcStWeekDate(today));
      $scope.weekDayEd = formatDate(calcEdWeekDate(today));
    
      // データの再取得
      selectProductDatabase().then(selectDeliveryDatabase());
    };
    
    $scope.nextWeek = function() {
      // 開始日の算出
      today.setDate(today.getDate() + 7);
      // alert(today.getDate());
      $scope.weekDaySt = formatDate(calcStWeekDate(today));
      $scope.weekDayEd = formatDate(calcEdWeekDate(today));
    
      // データの再取得
      selectProductDatabase().then(selectDeliveryDatabase());
    };

    $scope.update = function() {
      updateDeliveryDatabase().then(selectProductDatabase()).then(selectDeliveryDatabase());
      $scope.updateAlert();
    }

    $scope.updateAlert = function() {
      ons.notification.alert({
        title: '更新',
        messageHTML: '完了',
        buttonLabel: 'OK',
        animation: 'default',
        callback: function() {
        }
      })
    }

    $scope.copy = function() {
      copyDeliveryDatabase();
    }

    $scope.insert = function() {
      insertDeliveryDatabase().then(selectProductDatabase()).then(selectDeliveryDatabase());
      $scope.insertBtnHide = true;
      $scope.insertAlert();
    }

    $scope.insertAlert = function() {
      ons.notification.alert({
        title: '追加',
        messageHTML: '完了',
        buttonLabel: 'OK',
        animation: 'default',
        callback: function() {
        }
      })
    }

    // Delivery Database for update
    var updateDeliveryDatabase = function(){
      return new Promise(function(resolve, reject) {
        // タイムアウト値の設定は任意
        setTimeout(function(){
          console.log('Start updateDeliveryDatabase');
          var db = window.openDatabase("Database", "1.0", "TestDatabase", 200000);
            db.transaction(
              function(tx){

                var len = $scope.deliveryList.length;
                for (var i = 0; i < len; i++) {
                  var rowData = $scope.deliveryList[i];
                  // alert(JSON.stringify(rowData));

                  var len2 = rowData.products.length;
                  for (var i2 = 0; i2 < len2; i2++) {
                    // alert(JSON.stringify(rowData.products[i2]));
                    var rowData2 = rowData.products[i2];
                    // alert('UPDATE TDelivery SET mon = ' + rowData2['mon'] + ', wed = ' + rowData2['wed'] + ', fri = ' + rowData2['fri'] + ', other = ' + rowData2['other'] + ' WHERE clientId = ' + rowData2['clientId'] + ' AND productId = ' + rowData2['productId'] + ' AND deliveryStDate = "' + rowData2['deliveryStDate']+ '";');
                    tx.executeSql('UPDATE TDelivery SET mon = ' + rowData2['mon'] + ', wed = ' + rowData2['wed'] + ', fri = ' + rowData2['fri'] + ', other = ' + rowData2['other'] + ' WHERE deliveryId = ' + rowData2['deliveryId'] + ';');
                  }
                }
              }, 
              function(){
                // 失敗時
                // alert("4- create fail");
              }, 
              function(){
                // 成功時
                // alert("4- create success");
              }
          );
          console.log('End createDatabase');
          resolve();
        },100);
      });
    };

    // Delivery Database for insert
    var insertDeliveryDatabase = function(){
      return new Promise(function(resolve, reject) {
        // タイムアウト値の設定は任意
        setTimeout(function(){
          console.log('Start insertDeliveryDatabase');
          var db = window.openDatabase("Database", "1.0", "TestDatabase", 200000);
            db.transaction(
              function(tx){

                var len = $scope.deliveryList.length;
                for (var i = 0; i < len; i++) {
                  var rowData = $scope.deliveryList[i];
                  // alert(JSON.stringify(rowData));

                  var len2 = rowData.products.length;
                  for (var i2 = 0; i2 < len2; i2++) {
                    // alert(JSON.stringify(rowData.products[i2]));
                    var rowData2 = rowData.products[i2];
                    // alert('INSERT INTO TDelivery(clientId, productId, deliveryStDate, mon, wed, fri, other) VALUES (' + rowData2['clientId'] + ', ' + rowData2['productId'] + ', "' + rowData2['deliveryStDate'] + '", ' + rowData2['mon'] + ', ' + rowData2['wed'] + ', ' + rowData2['fri'] + ', ' + rowData2['other'] + ')');
                    tx.executeSql('INSERT INTO TDelivery(clientId, productId, deliveryStDate, mon, wed, fri, other) VALUES (' + rowData2['clientId'] + ', ' + rowData2['productId'] + ', "' + rowData2['deliveryStDate'] + '", ' + rowData2['mon'] + ', ' + rowData2['wed'] + ', ' + rowData2['fri'] + ', ' + rowData2['other'] + ')');
                  }
                }
              }, 
              function(){
                // 失敗時
                // alert("6- create fail");
              }, 
              function(){
                // 成功時
                // alert("6- create success");
              }
          );
          console.log('End createDatabase');
          resolve();
        },100);
      });
    };

});
