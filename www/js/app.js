// This is a JavaScript file
var app = angular.module( 'myApp', ['onsen.directives']);

app.controller('AppController', function(initService, formatDate, calcStWeekDate, calcEdWeekDate, $scope) {
    $scope.title = "コース別仕訳表";
    $scope.cource = "A6";
    $scope.productList = {};
    $scope.getProductList = {};
    $scope.deliveryList = {};
    $scope.insertBtnHide = true;
    $scope.updateBtnHide = true;
    $scope.copyBtnHide = true;
    $scope.maxClientId = 0;
    var debug = 1;
    
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
                var db = window.openDatabase("Database", "1.0", "TestDatabase", 2048);
                // var db = window.openDatabase("Database", "1.0", "TestDatabase", 200000);
                if(db.version == "" || debug == 1){
                    // alert("1- create db version:" + db.version);
                    console.log('not exist db');
                    // DB無いので作ります
                    db.transaction(
                        function(tx){
                            // 初期データの作成(client)
                            tx.executeSql('DROP TABLE IF EXISTS MClient');
                            tx.executeSql('CREATE TABLE IF NOT EXISTS MClient (clientId INTEGER PRIMARY KEY AUTOINCREMENT, categoryName text, clientName text, deleteFlg integer not null default 0)');
                            for (i = 0; i < initService.init_client.length; i++) {
                                tx.executeSql('INSERT INTO MClient VALUES (' + initService.init_client[i].clientId + ', "' + initService.init_client[i].categoryName + '", "' + initService.init_client[i].clientName + '", 0)');
                            }
                            // 初期データの作成(products)
                            tx.executeSql('DROP TABLE IF EXISTS MProduct');
                            tx.executeSql('CREATE TABLE IF NOT EXISTS MProduct (productId INTEGER PRIMARY KEY AUTOINCREMENT, productName text, deleteFlg integer not null default 0)');
                            for (i = 0; i < initService.init_product.length; i++) {
                                tx.executeSql('INSERT INTO MProduct VALUES (' + initService.init_product[i].productId + ', "' + initService.init_product[i].productName + '", 0)');
                            }
                            // 初期データの作成(delivery)
                            tx.executeSql('DROP TABLE IF EXISTS TDelivery');
                            tx.executeSql('CREATE TABLE IF NOT EXISTS TDelivery (deliveryId INTEGER PRIMARY KEY AUTOINCREMENT, clientId integer, productId integer, deliveryStDate text, mon integer, wed integer, fri integer, other integer, deleteFlg integer not null default 0)');
                            for (i = 0; i < initService.init_delivery.length; i++) {
                                tx.executeSql('INSERT INTO TDelivery VALUES (' + (i + 1) + ', ' + initService.init_delivery[i].clientId + ', ' + initService.init_delivery[i].productId + ', "' + initService.init_delivery[i].deliveryStDate + '", ' + initService.init_delivery[i].mon + ', ' + initService.init_delivery[i].wed + ', ' + initService.init_delivery[i].fri + ', ' + initService.init_delivery[i].other + ', 0)');
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
                $scope.insertBtnHide = true;
                var db = window.openDatabase("Database","1.0","TestDatabase",2048);
                // var db = window.openDatabase("Database","1.0","TestDatabase",200000);
                // alert("2- db version:" + db.version);
                db.transaction(
                    function(tx){
                        // alert("dd");
                        // tx.executeSql('SELECT m1.categoryName as categoryName, m1.clientName as clientName, m1.clientId as clientId, m2.productName as productName, m2.productId as productId, t.deliveryId as deliveryId, t.deliveryStDate as deliveryStDate, t.mon as mon, t.wed as wed, t.fri as fri, t.other as other FROM MClient m1 LEFT JOIN (SELECT * FROM TDelivery WHERE deliveryStDate = "' + $scope.weekDaySt + '" and deleteFlg = 0) t ON m1.clientId = t.clientId and t.deleteFlg = 0 LEFT JOIN MProduct m2 ON m2.productId = t.productId and m2.deleteFlg = 0', [], querySuccess, errorCB);
                        tx.executeSql('SELECT m1.categoryName as categoryName, m1.clientName as clientName, m1.clientId as clientId, m2.productName as productName, m2.productId as productId, t.deliveryId as deliveryId, t.deliveryStDate as deliveryStDate, t.mon as mon, t.wed as wed, t.fri as fri, t.other as other FROM (SELECT * FROM TDelivery WHERE deliveryStDate = "' + $scope.weekDaySt + '" and deleteFlg = 0) t LEFT JOIN MClient m1 ON m1.clientId = t.clientId and m1.deleteFlg = 0 LEFT JOIN MProduct m2 ON m2.productId = t.productId and m2.deleteFlg = 0', [], querySuccess, errorCB);
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
                
                var deliveryArray = new Array();
                var deliveryCount = 0;
                // *************************
                // クエリ成功時の処理をかく
                // *************************
                var fflg = false;
                var _clientId;
                var productArray = new Array();
                var rowData = {};
                for (var i = 0; i < len; i++) {
                  // alert(results.rows.item(i).categoryName + "/" + results.rows.item(i).clientName + "/" + results.rows.item(i).productName + "/" + results.rows.item(i).deliveryId + "/" + results.rows.item(i).mon + "/" + results.rows.item(i).wed + "/" + results.rows.item(i).fri);
                  fflg = _clientId == results.rows.item(i).clientId ? true : false;
                  if (!fflg) {
                    rowData = {};
                    rowData.categoryName = results.rows.item(i).categoryName;
                    rowData.clientName = results.rows.item(i).clientName;
                    rowData.clientId = results.rows.item(i).clientId;
                    productArray = new Array();
                  }
                  var rowProductData = {};
                  if(results.rows.item(i).deliveryId != null) {
                      deliveryCount++;
                  }
                  rowProductData.deliveryId = results.rows.item(i).deliveryId;
                  rowProductData.clientId = results.rows.item(i).clientId;
                  rowProductData.productId = results.rows.item(i).productId;
                  rowProductData.deliveryStDate = results.rows.item(i).deliveryStDate;
                  rowProductData.productName = results.rows.item(i).productName;
                  rowProductData.mon = results.rows.item(i).mon;
                  rowProductData.wed = results.rows.item(i).wed;
                  rowProductData.fri = results.rows.item(i).fri;
                  rowProductData.other = results.rows.item(i).other;
                  productArray.push(rowProductData);
                  if (!fflg) {
                    rowData.products = productArray;
                    deliveryArray.push(rowData);
                  }
                  _clientId = results.rows.item(i).clientId;
                }
                $scope.deliveryList = deliveryArray;

                // if (len > 0 && deliveryCount == 0) {
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

                // scopeの更新と反映
                $scope.$apply($scope.deliveryList); // ★
                // alert("query success");
                console.log('End query');
                // alert(JSON.stringify($scope.deliveryList));
                resolve();
            };
            
            var errorCB = function(err) {
                // alert("");
                console.log("Error occured while executing SQL: "+err.code);
            };
        });
    };

    // 検索(Product)
    var selectProductDatabase = function(){
        return new Promise(function(resolve, reject){
            setTimeout(function(){
                console.log('Start selectDatabase');
                var db = window.openDatabase("Database","1.0","TestDatabase",2048);
                // var db = window.openDatabase("Database","1.0","TestDatabase",200000);
                // alert("3- db version:" + db.version);
                db.transaction(
                    function(tx){
                        // alert("dd");
                        tx.executeSql('SELECT m.productId, m.productName, ifnull(sum(t.mon), 0) as mon, ifnull(sum(t.wed), 0) as wed, ifnull(sum(t.fri), 0) as fri, ifnull(sum(t.other), 0) as other FROM MProduct m LEFT JOIN (SELECT * FROM TDelivery WHERE deliveryStDate = "' + $scope.weekDaySt + '" and deleteFLg = 0) t on m.productId = t.productId and m.deleteFlg = 0 GROUP BY m.productId', [], querySuccess, errorCB);
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
                    rowData.productId = results.rows.item(i).productId;
                    rowData.productName = results.rows.item(i).productName;
                    rowData.mon = results.rows.item(i).mon;
                    rowData.wed = results.rows.item(i).wed;
                    rowData.fri = results.rows.item(i).fri;
                    rowData.other = results.rows.item(i).other;
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
    
    // 一覧取得(Product)
    var getProductDatabase = function(){
        return new Promise(function(resolve, reject){
            setTimeout(function(){
                console.log('Start selectDatabase');
                var db = window.openDatabase("Database","1.0","TestDatabase",2048);
                // var db = window.openDatabase("Database","1.0","TestDatabase",200000);
                // alert("3- db version:" + db.version);
                db.transaction(
                    function(tx){
                        // alert("dd");
                        tx.executeSql('SELECT m.productId, m.productName FROM MProduct m WHERE m.deleteFLg = 0', [], querySuccess, errorCB);
                    }, 
                    function(){
                        // alert("7- select fail");
                        // 失敗時
                    },
                    function(){
                        // alert("7- select success");
                        // 成功時
                    }
                );
                console.log('End getDatabase');
            },100);
            
            var querySuccess = function(tx,results){
                // alert("7- query success");
                var len = results.rows.length;
                // alert(len);
                console.log('Start query');

                var productArray = new Array();
                // *************************
                // クエリ成功時の処理をかく
                // *************************
                for (var i = 0; i < len; i++) {
                    // alert(results.rows.item(i).productId + '/' + results.rows.item(i).productName);
                    var rowData = {};
                    rowData.productId = results.rows.item(i).productId;
                    rowData.productName = results.rows.item(i).productName;
                    productArray.push(rowData);
                }
                 $scope.getProductList = productArray;

                // scopeの更新と反映
                $scope.$apply($scope.getProductList);        // ★
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
    
    // ClientID最大値取得(Client)
    var getMaxClientId = function(){
        return new Promise(function(resolve, reject){
            setTimeout(function(){
                console.log('Start getMaxClientId');
                var db = window.openDatabase("Database","1.0","TestDatabase",2048);
                // var db = window.openDatabase("Database","1.0","TestDatabase",200000);
                // alert("12- db version:" + db.version);
                db.transaction(
                    function(tx){
                        // alert("dd");
                        tx.executeSql('SELECT MAX(clientId) as maxClientId FROM MClient', [], querySuccess, errorCB);
                    }, 
                    function(){
                        // alert("12- select fail");
                        // 失敗時
                    },
                    function(){
                        // alert("12- select success");
                        // 成功時
                    }
                );
                console.log('End getDatabase');
            },100);
            
            var querySuccess = function(tx,results){
                // alert("12- query success");
                $scope.maxClientId = results.rows.item(0).maxClientId + 1;
                $scope.$apply($scope.maxClientId); // ★
                // alert($scope.maxClientId);
                resolve();
            };
            
            var errorCB = function(err) {
                // console.log("Error occured while executing SQL: "+err.code);
            };
        });
    };

    // Copy(Delivery)
    var copyDeliveryDatabase = function(){
        return new Promise(function(resolve, reject){
            setTimeout(function(){
                console.log('Start copyDatabase');
                var db = window.openDatabase("Database","1.0","TestDatabase",2048);
                // var db = window.openDatabase("Database","1.0","TestDatabase",200000);
                // alert("5- db version:" + db.version);
                db.transaction(
                    function(tx){
                        tmpDate = new Date($scope.weekDaySt);
                        tmpDate.setDate(tmpDate.getDate() - 7);
                        // alert(tmpDate);
                        tx.executeSql('SELECT m1.categoryName as categoryName, m1.clientName as clientName, m1.clientId as clientId, m2.productName as productName, m2.productId as productId, t.deliveryId as deliveryId, t.deliveryStDate as deliveryStDate, t.mon as mon, t.wed as wed, t.fri as fri, t.other as other FROM (SELECT * FROM TDelivery WHERE deliveryStDate = "' + formatDate(tmpDate) + '" and deleteFlg = 0) t LEFT JOIN MClient m1 ON m1.clientId = t.clientId and m1.deleteFlg = 0 LEFT JOIN MProduct m2 ON m2.productId = t.productId and m2.deleteFlg = 0', [], querySuccess, errorCB);
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
                var productArray = new Array();
                var rowData = {};
                for (var i = 0; i < len; i++) {
                  // alert(results.rows.item(i).categoryName + "/" + results.rows.item(i).clientName + "/" + results.rows.item(i).productName + "/" + results.rows.item(i).mon + "/" + results.rows.item(i).wed + "/" + results.rows.item(i).fri);
                  fflg = _clientId == results.rows.item(i).clientId ? true : false;
                  if (!fflg) {
                    rowData = {};
                    rowData.categoryName = results.rows.item(i).categoryName;
                    rowData.clientName = results.rows.item(i).clientName;
                    productArray = new Array();
                  }
                  var rowProductData = {};
                  rowProductData.deliveryId = "";
                  rowProductData.clientId = results.rows.item(i).clientId;
                  rowProductData.productId = results.rows.item(i).productId;
                  rowProductData.deliveryStDate = $scope.weekDaySt;
                  rowProductData.productName = results.rows.item(i).productName;
                  rowProductData.mon = results.rows.item(i).mon;
                  rowProductData.wed = results.rows.item(i).wed;
                  rowProductData.fri = results.rows.item(i).fri;
                  rowProductData.other = results.rows.item(i).other;
                  productArray.push(rowProductData);
                  if (!fflg) {
                    rowData.products = productArray;
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
    
    // if(debug == 0) {
      // selectProductDatabase().then(selectDeliveryDatabase());
    // }else{
      createDatabase().then(selectProductDatabase).then(selectDeliveryDatabase());
    // }
    
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
    };

    $scope.updateAlert = function() {
      ons.notification.alert({
        title: '更新',
        messageHTML: '完了',
        buttonLabel: 'OK',
        animation: 'default',
        callback: function() {
        }
      });
    };

    $scope.copy = function() {
      copyDeliveryDatabase();
    };

    // 配達先データのInsert
    $scope.insert = function() {
      insertDeliveryDatabase().then(selectProductDatabase()).then(selectDeliveryDatabase());
      $scope.insertBtnHide = true;
      $scope.insertAlert();
    };

    // 配達先データのInsert後、Dialog
    $scope.insertAlert = function() {
      ons.notification.alert({
          title: "追加",
          messageHTML : '完了',
          buttonLabel : 'OK',
          animation : 'default',
          callback : function() {
          }
      });  
    };
    
    // 顧客データのInsert
    $scope.dialogDispAddClient = function() {
      ons.createDialog('clientAddDialog.html', {
        parentScope: $scope
      }).then(function(clientAddDialog) {
        $scope._clientId = "";
        $scope._categoryName = "";
        $scope._clientName = "";
        getProductDatabase();
        clientAddDialog.show();
      });
    };

    // 配達先データのInsert
    $scope.insertClient = function(_categoryName, _clientName, _productId, _mon, _wed, _fri, _other) {
      // alert(_categoryName);
      getMaxClientId().then(insertClientDatabase(_categoryName, _clientName)).then(insertProductForClientDatabase($scope.maxClientId, _productId, _mon, _wed, _fri, _other)).then(selectProductDatabase()).then(selectDeliveryDatabase());
      clientAddDialog.hide();
    };

    // 配達先データのUpdate
    $scope.dialogDispUpdClient = function(_clientId, _categoryName, _clientName) {
      ons.createDialog('clientUpdDialog.html', {
        parentScope: $scope
      }).then(function(clientUpdDialog) {
        // alert(_categoryName);
        $scope._clientId = _clientId;
        $scope._categoryName = _categoryName;
        $scope._clientName = _clientName;
        clientUpdDialog.show();
      });
    };

    // 配達先データのUpdate
    $scope.updateClient = function(_clientId, _categoryName, _clientName) {
      // alert(_categoryName);
      updateClientDatabase(_clientId, _categoryName, _clientName).then(selectDeliveryDatabase());
      clientUpdDialog.hide();
    };

    // 配達先の商品データのInsert
    $scope.dialogDispAddProductForClient = function(_clientId) {
      ons.createDialog('clientProductAddDialog.html', {
        parentScope: $scope
      }).then(function(clientProductAddDialog) {
        // alert(_categoryName);
        $scope._clientId = _clientId;
        getProductDatabase();
        clientProductAddDialog.show();
      });
    };
    
    $scope.insertProductForClient = function(_clientId, _productId, _mon, _wed, _fri, _other) {
      // alert(_clientId + "/" + _productId + "/" + _other);
      insertProductForClientDatabase(_clientId, _productId, _mon, _wed, _fri, _other).then(selectProductDatabase()).then(selectDeliveryDatabase());
      clientProductAddDialog.hide();
    };

    // 商品データのInsert
    $scope.dialogDispAddProduct = function() {
      ons.createDialog('productAddDialog.html', {
        parentScope: $scope
      }).then(function(productAddDialog) {
        $scope._productName = "";
        productAddDialog.show();
      });
    };
    
    $scope.insertProduct = function(_productName) {
      // alert(_productId + "/" + _productName);
      insertProductDatabase(_productName).then(selectProductDatabase()).then(selectDeliveryDatabase());
      productAddDialog.hide();
    };

    // 配達先商品データのDelete
    $scope.dialogDispDelProductForClient = function(_deliveryId) {
      ons.createDialog('clientProductDelDialog.html', {
        parentScope: $scope
      }).then(function(clientProductDelDialog) {
        // alert(_deliveryId);
        $scope._deliveryId = _deliveryId;
        clientProductDelDialog.show();
      });
    };

    $scope.deleteData = function(_type, _key) {
      // alert(_type + "/" + _key);
      deleteDatabase(_type, _key).then(selectProductDatabase()).then(selectDeliveryDatabase());
      clientProductDelDialog.hide();
    };

    // Client Database for insert
    var insertClientDatabase = function(_categoryName, _clientName){
      return new Promise(function(resolve, reject) {
        // タイムアウト値の設定は任意
        setTimeout(function(){
          console.log('Start insertClientDatabase');
          var db = window.openDatabase("Database", "1.0", "TestDatabase", 2048);
          // var db = window.openDatabase("Database", "1.0", "TestDatabase", 200000);
            db.transaction(
              function(tx){
                // alert('INSERT INTO MClient(clientId, categoryName, clientName) VALUES (' + $scope.maxClientId + ',"' + _categoryName + '", "' + _clientName + '")');
                tx.executeSql('INSERT INTO MClient(clientId, categoryName, clientName) VALUES (' + $scope.maxClientId + ',"' + _categoryName + '", "' + _clientName + '")');
              }, 
              function(){
                // 失敗時
                // alert("8- insert fail");
              }, 
              function(){
                // 成功時
                // alert("8- insert success");
          resolve();
              }
          );
          console.log('End insertClientDatabase');
        },100);
      });
    };

    // Client Database for update
    var updateClientDatabase = function(_clientId, _categoryName, _clientName){
      return new Promise(function(resolve, reject) {
        // タイムアウト値の設定は任意
        setTimeout(function(){
          console.log('Start updateClientDatabase');
          var db = window.openDatabase("Database", "1.0", "TestDatabase", 2048);
          // var db = window.openDatabase("Database", "1.0", "TestDatabase", 200000);
            db.transaction(
              function(tx){
                // alert(_clientId + "/" + _categoryName + "/" + _clientName);
                // alert('UPDATE MProduct SET productName = "' + _productName + '" WHERE productId = ' + _productId + ';');
                tx.executeSql('UPDATE MClient SET categoryName = "' + _categoryName + '", clientName = "' + _clientName + '" WHERE clientId = ' + _clientId + ';');
              }, 
              function(){
                // 失敗時
                // alert("9- insert fail");
              }, 
              function(){
                // 成功時
                // alert("9- insert success");
          resolve();
              }
          );
          console.log('End updateClientDatabase');
        },100);
      });
    };

    // Product Database for insert
    var insertProductDatabase = function(_productName){
      return new Promise(function(resolve, reject) {
        // タイムアウト値の設定は任意
        setTimeout(function(){
          console.log('Start insertProductDatabase');
          var db = window.openDatabase("Database", "1.0", "TestDatabase", 2048);
          // var db = window.openDatabase("Database", "1.0", "TestDatabase", 200000);
            db.transaction(
              function(tx){
                // alert(_productId + "/" + _productName);
                // alert('UPDATE MProduct SET productName = "' + _productName + '" WHERE productId = ' + _productId + ';');
                tx.executeSql('INSERT INTO MProduct(productName) VALUES ("' + _productName + '")');
              }, 
              function(){
                // 失敗時
                // alert("6- insert fail");
              }, 
              function(){
                // 成功時
                // alert("6- insert success");
          resolve();
              }
          );
          console.log('End insertProductDatabase');
        },100);
      });
    };

    // 商品データのUpdate
    $scope.dialogDispUpdProduct = function(_productId, _productName) {
      ons.createDialog('productUpdDialog.html', {
        parentScope: $scope
      }).then(function(productUpdDialog) {
        $scope._productName = _productName;
        $scope._productId = _productId;
        productUpdDialog.show();
      });
    };
    
    $scope.updateProduct = function(_productId, _productName) {
      // alert(_productId + "/" + _productName);
      updateProductDatabase(_productId, _productName).then(selectProductDatabase()).then(selectDeliveryDatabase());
      productUpdDialog.hide();
    };

    // Product Database for update
    var updateProductDatabase = function(_productId, _productName){
      return new Promise(function(resolve, reject) {
        // タイムアウト値の設定は任意
        setTimeout(function(){
          console.log('Start updateProductDatabase');
          var db = window.openDatabase("Database", "1.0", "TestDatabase", 2048);
          // var db = window.openDatabase("Database", "1.0", "TestDatabase", 200000);
            db.transaction(
              function(tx){
                // alert(_productId + "/" + _productName);
                // alert('UPDATE MProduct SET productName = "' + _productName + '" WHERE productId = ' + _productId + ';');
                tx.executeSql('UPDATE MProduct SET productName = "' + _productName + '" WHERE productId = ' + _productId + ';');
              }, 
              function(){
                // 失敗時
                // alert("7- update fail");
              }, 
              function(){
                // 成功時
                // alert("7- update success");
          resolve();
              }
          );
          console.log('End updateProductDatabase');
        },100);
      });
    };

    // Delivery Database for update
    var updateDeliveryDatabase = function(){
      return new Promise(function(resolve, reject) {
        // タイムアウト値の設定は任意
        setTimeout(function(){
          console.log('Start updateDeliveryDatabase');
          var db = window.openDatabase("Database", "1.0", "TestDatabase", 2048);
          // var db = window.openDatabase("Database", "1.0", "TestDatabase", 200000);
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
                    tx.executeSql('UPDATE TDelivery SET mon = ' + rowData2.mon + ', wed = ' + rowData2.wed + ', fri = ' + rowData2.fri + ', other = ' + rowData2.other + ' WHERE deliveryId = ' + rowData2.deliveryId + ';');
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
          var db = window.openDatabase("Database", "1.0", "TestDatabase", 2048);
          // var db = window.openDatabase("Database", "1.0", "TestDatabase", 200000);
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
                    tx.executeSql('INSERT INTO TDelivery(clientId, productId, deliveryStDate, mon, wed, fri, other) VALUES (' + rowData2.clientId + ', ' + rowData2.productId + ', "' + rowData2.deliveryStDate + '", ' + rowData2.mon + ', ' + rowData2.wed + ', ' + rowData2.fri + ', ' + rowData2.other + ')');
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

    // Client Product Database for insert
    var insertProductForClientDatabase = function(_clientId, _productId, _mon, _wed, _fri, _other){
      return new Promise(function(resolve, reject) {
        // タイムアウト値の設定は任意
        setTimeout(function(){
          console.log('Start insertProductForClientDatabase');
          var db = window.openDatabase("Database", "1.0", "TestDatabase", 2048);
          // var db = window.openDatabase("Database", "1.0", "TestDatabase", 200000);
            db.transaction(
              function(tx){
                // alert($scope.maxClientId);
                _clientId = $scope.maxClientId;
                // alert('INSERT INTO TDelivery(clientId, productId, deliveryStDate, mon, wed, fri, other) VALUES (' + _clientId + ', ' + _productId + ', "' + $scope.weekDaySt + '", ' + _mon + ', ' + _wed + ', ' + _fri + ', ' + _other + ')');
                tx.executeSql('INSERT INTO TDelivery(clientId, productId, deliveryStDate, mon, wed, fri, other) VALUES (' + _clientId + ', ' + _productId + ', "' + $scope.weekDaySt + '", ' + _mon + ', ' + _wed + ', ' + _fri + ', ' + _other + ')');
              }, 
              function(){
                // 失敗時
                // alert("10- create fail");
              }, 
              function(){
                // 成功時
                // alert("10- create success");
              }
          );
          console.log('End insertProductForClientDatabase');
          resolve();
        },100);
      });
    };

    // All Type Database for delete
    var deleteDatabase = function(_type, _key){
      return new Promise(function(resolve, reject) {
        // タイムアウト値の設定は任意
        setTimeout(function(){
          console.log('Start deleteDatabase');
          var db = window.openDatabase("Database", "1.0", "TestDatabase", 2048);
          // var db = window.openDatabase("Database", "1.0", "TestDatabase", 200000);
            db.transaction(
              function(tx){
                var sqlString = '';
                switch (_type) {
                  case 1: // MProduct
                    sqlString = 'UPDATE MProduct SET deleteFlg = 1 WHERE productId = ' + _key;
                    break;
                  case 2: // MClient
                    sqlString = 'UPDATE MClient SET deleteFlg = 1 WHERE clientId = ' + _key;
                    break;
                  case 3: // TDelivery
                    sqlString = 'UPDATE TDelivery SET deleteFlg = 1 WHERE deliveryId = ' + _key;
                    break;
                }
                // alert(sqlString);
                tx.executeSql(sqlString);
              }, 
              function(){
                // 失敗時
                // alert("11- create fail");
              }, 
              function(){
                // 成功時
                // alert("11- create success");
              }
          );
          console.log('End deleteDatabase');
          resolve();
        },100);
      });
    };

});
