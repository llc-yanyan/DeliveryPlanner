// This is a JavaScript file
var app = angular.module( 'myApp', ['onsen.directives']);

app.controller('AppController', function(initService, formatDate, calcStWeekDate, calcEdWeekDate, $scope) {
    $scope.title = "コース別仕訳表";
    $scope.cource = "A6";
    $scope.productList = {}; // 商品別一覧（合計）
    $scope.getProductList = {}; // 商品名一覧（商品名）
    $scope.deliveryList = {}; // 配達先一覧（配達先）
    $scope.copyBtnHide = true;
    $scope.todayBtnHide = true;
    $scope.maxClientId = 0;
    $scope.maxClientByDateId = 0;
    $scope.updated = false;
    var dbVer = "1.0.11";
    var debug = false; // true.. is debugging
    
    // 開始日の算出
    today = new Date();
    if(today.getDay() === 0){ // 日曜日対応
        today.setDate(today.getDate() - 6);
    }else{
        today.setDate(today.getDate() - (today.getDay() - 1));
    }
    
    $scope.weekDaySt = formatDate(calcStWeekDate(today));
    $scope.weekDayEd = formatDate(calcEdWeekDate(today));

    // 検索(Delivery)
    var selectDeliveryDatabase = function(){
      // alert("selectDeliveryDatabase");
        return new Promise(function(resolve, reject){
            setTimeout(function(){
                console.log('Start selectDatabase');
                // $scope.insertBtnHide = true;
                var db = window.openDatabase("Database",dbVer,"TestDatabase",2048);
                // var db = window.openDatabase("Database","1.0","TestDatabase",200000);
                // alert("2- db version:" + db.version);
                db.transaction(
                    function(tx){
                        // alert("dd");
                        tx.executeSql('\
                        SELECT \
                          m1.categoryName as categoryName, \
                          m1.clientName as clientName, \
                          m1.clientId as clientId, \
                          t.orderNum as orderNum, \
                          m2.productName as productName, \
                          m2.productId as productId, \
                          td.deliveryId as deliveryId, \
                          t.deliveryStDate as deliveryStDate, \
                          td.mon as mon, \
                          td.wed as wed, \
                          td.fri as fri, \
                          td.other as other \
                        FROM (SELECT * FROM TClientByDate WHERE deliveryStDate = "' + $scope.weekDaySt + '" and deleteFlg = 0) t \
                        LEFT JOIN (SELECT * FROM MClient WHERE deleteFlg = 0) m1 ON t.clientId = m1.clientId \
                        LEFT JOIN TDelivery td ON td.clientbydateId = t.clientbydateId and td.deleteFlg = 0 \
                        LEFT JOIN MProduct m2 ON m2.productId = td.productId and m2.deleteFlg = 0 \
                        ORDER BY t.orderNum, m1.clientId, m2.productId', [], querySuccess, errorCB);
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
                
                var deliveryArray = [];
                var deliveryCount = 0;
                // *************************
                // クエリ成功時の処理をかく
                // *************************
                var fflg = false;
                var _clientId;
                var _orderNum = "";
                var productArray = [];
                var rowData = {};
                for (var i = 0; i < len; i++) {
                  // alert(results.rows.item(i).categoryName + "/" + results.rows.item(i).clientName + "/" + results.rows.item(i).productName + "/" + results.rows.item(i).deliveryId + "/" + results.rows.item(i).mon + "/" + results.rows.item(i).wed + "/" + results.rows.item(i).fri + "/" + results.rows.item(i).orderNum);
                  fflg = _clientId == results.rows.item(i).clientId ? true : false;
                  if (!fflg) {
                    rowData = {};
                    rowData.categoryName = results.rows.item(i).categoryName;
                    rowData.clientName = results.rows.item(i).clientName;
                    rowData.clientId = results.rows.item(i).clientId;
                    rowData.orderNum = results.rows.item(i).orderNum;
                    rowData.isExist =  true;
                    productArray = [];
                  }
                  var rowProductData = {};
                  if(results.rows.item(i).deliveryId !== null) {
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

                if (len === 0) {
                  if (today >= new Date()) {
                    $scope.copyBtnHide = false;
                  } else {
                    $scope.copyBtnHide = true;
                  }
                } else {
                  $scope.copyBtnHide = true;
                }

                // scopeの更新と反映
                $scope.$apply($scope.deliveryList); // ★
                // alet("selectDeliveryDatabase");
                // alert("query success");
                console.log('End query');
                // alert(JSON.stringify($scope.deliveryList));
                resolve();
            };
            
            var errorCB = function(err) {
                // alert("error:" + err.sqlString);
                console.log("Error occured while executing SQL: "+err.code);
            };
        });
    };

    // 検索(Product)
    var selectProductDatabase = function(){
      // alert("selectProductDatabase");
        return new Promise(function(resolve, reject){
            setTimeout(function(){
                console.log('Start selectDatabase');
                var db = window.openDatabase("Database",dbVer,"TestDatabase",2048);
                // var db = window.openDatabase("Database","1.0","TestDatabase",200000);
                // alert("3- db version:" + db.version);
                db.transaction(
                    function(tx){
                        tx.executeSql('\
                        SELECT \
                          m.productId as productId, \
                          m.productName as productName, \
                          ifnull(sum(td.mon), 0) as mon, \
                          ifnull(sum(td.wed), 0) as wed, \
                          ifnull(sum(td.fri), 0) as fri, \
                          ifnull(sum(td.other), 0) as other \
                        FROM (SELECT * FROM TClientByDate WHERE deliveryStDate = "' + $scope.weekDaySt + '" and deleteFlg = 0) t \
                        LEFT JOIN TDelivery td on td.clientbydateId = t.clientbydateId and td.deleteFlg = 0 \
                        LEFT JOIN MProduct m on m.productId = td.productId and m.deleteFlg = 0 \
                        GROUP BY m.productId', [], querySuccess, errorCB);
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

                var productArray = [];
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
                  // alert(JSON.stringify(results.rows.item(i)));
                  // alert(JSON.stringify(rowData));
                }
                $scope.productList = productArray;

                // scopeの更新と反映
                $scope.$apply($scope.productList);        // ★
                // alet("selectProductDatabase");
                // alert("query success");
                console.log('End query');
                // alert(JSON.stringify($scope.productList));
                resolve();
            };
            
            var errorCB = function(err) {
              // alert("error:" + err.sqlString);
              console.log("Error occured while executing SQL: "+err.code);
            };
        });
    };
    
    // 一覧取得(Product)
    var getProductDatabase = function(){
        return new Promise(function(resolve, reject){
            setTimeout(function(){
                console.log('Start selectDatabase');
                var db = window.openDatabase("Database",dbVer,"TestDatabase",2048);
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

                var productArray = [];
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
                // alet("getProductDatabase");
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
                var db = window.openDatabase("Database",dbVer,"TestDatabase",2048);
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
                // alet("getMaxClientId");
                // alert($scope.maxClientId);
                resolve();
            };
            
            var errorCB = function(err) {
                // console.log("Error occured while executing SQL: "+err.code);
            };
        });
    };
    
    // ClientByDateID最大値取得(ClientByDate)
    var getMaxClientByDateId = function(){
        return new Promise(function(resolve, reject){
            setTimeout(function(){
                console.log('Start getMaxClientByDateId');
                var db = window.openDatabase("Database",dbVer,"TestDatabase",2048);
                // var db = window.openDatabase("Database","1.0","TestDatabase",200000);
                // alert("12- db version:" + db.version);
                db.transaction(
                    function(tx){
                        // alert("dd");
                        tx.executeSql('SELECT MAX(clientByDateId) as maxClientByDateId FROM TClientByDate', [], querySuccess, errorCB);
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
                console.log('End getMaxClientByDateId');
            },100);
            
            var querySuccess = function(tx,results){
                // alert("12- query success");
                $scope.maxClientByDateId = results.rows.item(0).maxClientByDateId + 1;
                $scope.$apply($scope.maxClientByDateId); // ★
                // alet("maxClientByDateId");
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
                var db = window.openDatabase("Database",dbVer,"TestDatabase",2048);
                // var db = window.openDatabase("Database","1.0","TestDatabase",200000);
                // alert("5- db version:" + db.version);
                db.transaction(
                    function(tx){
                        tmpDate = new Date($scope.weekDaySt);
                        tmpDate.setDate(tmpDate.getDate() - 7);
                        // alert(tmpDate);
                        // tx.executeSql('SELECT m1.categoryName as categoryName, m1.clientName as clientName, m1.clientId as clientId, t.orderNum as orderNum, m2.productName as productName, m2.productId as productId, t.deliveryId as deliveryId, t.deliveryStDate as deliveryStDate, t.mon as mon, t.wed as wed, t.fri as fri, t.other as other FROM (SELECT * FROM TDelivery WHERE deliveryStDate = "' + formatDate(tmpDate) + '" and deleteFlg = 0) t LEFT JOIN MClient m1 ON m1.clientId = t.clientId and m1.deleteFlg = 0 LEFT JOIN MProduct m2 ON m2.productId = t.productId and m2.deleteFlg = 0 order by t.orderNum, m1.clientId, m2.productId', [], querySuccess, errorCB);
                        tx.executeSql('\
                        SELECT \
                          m1.categoryName as categoryName, \
                          m1.clientName as clientName, \
                          m1.clientId as clientId, \
                          t.orderNum as orderNum, \
                          m2.productName as productName, \
                          m2.productId as productId, \
                          td.deliveryId as deliveryId, \
                          t.deliveryStDate as deliveryStDate, \
                          td.mon as mon, \
                          td.wed as wed, \
                          td.fri as fri, \
                          td.other as other \
                        FROM (SELECT * FROM TClientByDate WHERE deliveryStDate = "' + formatDate(tmpDate) + '" and deleteFlg = 0) t \
                        LEFT JOIN (SELECT * FROM MClient WHERE deleteFlg = 0) m1 ON t.clientId = m1.clientId \
                        LEFT JOIN TDelivery td ON td.clientbydateId = t.clientbydateId and td.deleteFlg = 0 \
                        LEFT JOIN MProduct m2 ON m2.productId = td.productId and m2.deleteFlg = 0 \
                        ORDER BY t.orderNum, m1.clientId, m2.productId', [], querySuccess, errorCB);
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
                
                var deliveryArray = [];
                // *************************
                // クエリ成功時の処理をかく
                // *************************
                var fflg = false;
                var _clientId;
                var productArray = [];
                var rowData = {};
                for (var i = 0; i < len; i++) {
                  // alert(results.rows.item(i).categoryName + "/" + results.rows.item(i).clientName + "/" + results.rows.item(i).productName + "/" + results.rows.item(i).mon + "/" + results.rows.item(i).wed + "/" + results.rows.item(i).fri);
                  fflg = _clientId == results.rows.item(i).clientId ? true : false;
                  if (!fflg) {
                    rowData = {};
                    rowData.categoryName = results.rows.item(i).categoryName;
                    rowData.clientName = results.rows.item(i).clientName;
                    rowData.clientId = results.rows.item(i).clientId;
                    rowData.isExist = true;
                    productArray = [];
                  }
                  var rowProductData = {};
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

                $scope.copyBtnHide = true;
                $scope.updated = true;

                // scopeの更新と反映
                $scope.$apply($scope.deliveryList); // ★
                // alert("copyDeliveryDatabase");
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
    
    var db = window.openDatabase("Database", '', "TestDatabase", 2048);
    if(db.version != dbVer || debug == true){
      // alert("1- create db version:" + db.version + "/dbVer:" + dbVer);
      db.changeVersion(db.version, dbVer,
      function(tx) {
        // 初期データの作成(client)
        tx.executeSql('DROP TABLE IF EXISTS MClient');
        tx.executeSql('CREATE TABLE IF NOT EXISTS MClient (clientId INTEGER PRIMARY KEY AUTOINCREMENT, categoryName text, clientName text, deleteFlg integer not null default 0)');
        for (i = 0; i < initService.init_client.length; i++) {
            tx.executeSql('INSERT INTO MClient VALUES (' + initService.init_client[i].clientId + ', "' + initService.init_client[i].categoryName + '", "' + initService.init_client[i].clientName + '", 0)');
            // tx.executeSql('INSERT INTO MClient VALUES (' + initService.init_client[i].clientId + ', "' + initService.init_client[i].categoryName + '", "' + initService.init_client[i].clientName + '",' + initService.init_client[i].clientId + ', 0)');
        }
        // alert("-1");
        // 初期データの作成(products)
        tx.executeSql('DROP TABLE IF EXISTS MProduct');
        tx.executeSql('CREATE TABLE IF NOT EXISTS MProduct (productId INTEGER PRIMARY KEY AUTOINCREMENT, productName text, deleteFlg INTEGER not null default 0)');
        for (i = 0; i < initService.init_product.length; i++) {
            tx.executeSql('INSERT INTO MProduct VALUES (' + initService.init_product[i].productId + ', "' + initService.init_product[i].productName + '", 0)');
        }
        // alert("-2");
        // 初期データの作成(delivery)
        tx.executeSql('DROP TABLE IF EXISTS TClientByDate');
        tx.executeSql('CREATE TABLE IF NOT EXISTS TClientByDate (clientbydateId INTEGER PRIMARY KEY AUTOINCREMENT, clientId INTEGER, deliveryStDate text, orderNum integer, deleteFlg integer not null default 0)');
        // 初期データの作成(delivery)
        tx.executeSql('DROP TABLE IF EXISTS TDelivery');
        tx.executeSql('CREATE TABLE IF NOT EXISTS TDelivery (deliveryId INTEGER PRIMARY KEY AUTOINCREMENT, clientbydateId INTEGER, productId INTEGER, mon integer, wed integer, fri integer, other integer, deleteFlg integer not null default 0)');

        var clientId = 0;
        var deliveryStDate = '';
        var clientbydateId = 0;
        for (i = 0; i < initService.init_delivery.length; i++) {
          if(clientId != initService.init_delivery[i].clientId || deliveryStDate !=  initService.init_delivery[i].deliveryStDate) {
            clientbydateId++;
            tx.executeSql('INSERT INTO TClientByDate VALUES (' + clientbydateId + ', ' + initService.init_delivery[i].clientId + ', "' + initService.init_delivery[i].deliveryStDate + '", ' + clientbydateId + ', 0)');
            // alert("add tclientbydate!! " + initService.init_delivery[i].clientId + " / " + initService.init_delivery[i].deliveryStDate);
          }
          tx.executeSql('INSERT INTO TDelivery VALUES (' + (i + 1) + ', ' + clientbydateId + ', ' + initService.init_delivery[i].productId + ', ' + initService.init_delivery[i].mon + ', ' + initService.init_delivery[i].wed + ', ' + initService.init_delivery[i].fri + ', ' + initService.init_delivery[i].other + ', 0)');
          clientId = initService.init_delivery[i].clientId;
          deliveryStDate = initService.init_delivery[i].deliveryStDate;
          // alert("add tdelivery!! " + clientbydateId + " / " + initService.init_delivery[i].productId);
        }
        // alert("-3");
        tx.executeSql('CREATE INDEX text_stdate_idx on TClientByDate(deliveryStDate);');
        tx.executeSql('CREATE INDEX int_clientId_idx on TClientByDate(clientId);');
        tx.executeSql('CREATE INDEX int_productId_idx on TDelivery(productId);');
        // alert("-4");
      },
      function(err){
        // alert("failer." + err.message);
        // alert("failer." + JSON.stringify(err));
      },
      function(){
        selectProductDatabase();
        selectDeliveryDatabase();
        getProductDatabase();
        getMaxClientId();
        getMaxClientByDateId();
        // alert("success.");
      });
    }else{
      // alert("2- exist db version:" + db.version + "/dbVer:" + dbVer);
      selectProductDatabase();
      selectDeliveryDatabase();
      getProductDatabase();
      getMaxClientId();
      getMaxClientByDateId();
    }
    
    // Order Down
    $scope.orderDown = function(_orderNum){
      // changeOrder(_clientId, _orderNum, 1).then(selectDeliveryDatabase());
      changeOrderArray(_orderNum, _orderNum + 1);
      // $scope.updated = true;
      // alert('down' + _orderNum);
    };

    // Order Up
    $scope.orderUp = function(_orderNum){
      // changeOrder(_clientId, _orderNum, -1).then(selectDeliveryDatabase());
      changeOrderArray(_orderNum, _orderNum - 1);
      // $scope.updated = true;
      // alert('up' + _orderNum);
    };

    // Order Change Array
    var changeOrderArray = function(_orderNum, _orderTo){
    //  moveAt($scope.getProductList, _orderNum, _orderTo);
      // alert("before:" + JSON.stringify($scope.deliveryList));
      $scope.deliveryList = moveAt($scope.deliveryList, _orderNum, _orderTo);
      // alert("after:" + JSON.stringify($scope.deliveryList));
      // $scope.$apply($scope.deliveryList);
      $scope.updated = true;
    }

    $scope.today = function() {
      $scope.todayBtnHide = true;
      // 開始日の算出
      today = new Date();
      if(today.getDay() === 0){ // 日曜日対応
        today.setDate(today.getDate() - 6);
      }else{
        today.setDate(today.getDate() - (today.getDay() - 1));
      }
      // alert(today.getDate());
      $scope.weekDaySt = formatDate(calcStWeekDate(today));
      $scope.weekDayEd = formatDate(calcEdWeekDate(today));
    
      // データの再取得
      selectProductDatabase()
      selectDeliveryDatabase();
    };
    
    $scope.prevWeek = function() {
      $scope.todayBtnHide = false;
      // 開始日の算出
      today.setDate(today.getDate() - 7);
      // alert(today.getDate());
      $scope.weekDaySt = formatDate(calcStWeekDate(today));
      $scope.weekDayEd = formatDate(calcEdWeekDate(today));
    
      // データの再取得
      selectProductDatabase()
      selectDeliveryDatabase();
    };
    
    $scope.nextWeek = function() {
      $scope.todayBtnHide = false;
      // 開始日の算出
      today.setDate(today.getDate() + 7);
      // alert(today.getDate());
      $scope.weekDaySt = formatDate(calcStWeekDate(today));
      $scope.weekDayEd = formatDate(calcEdWeekDate(today));
    
      // データの再取得
      selectProductDatabase();
      selectDeliveryDatabase();
    };

    $scope.updateAlert = function() {
      ons.notification.alert({
        title: '保存',
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
      insertDeliveryDatabase().then(
        selectProductDatabase()
      ).then(
        selectDeliveryDatabase()
      );
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
        // getProductDatabase();
        clientAddDialog.show();
      });
    };

    // 顧客データのInsert(位置指定)
    $scope.dialogDispAddClient = function(_position) {
      // alert(_position);
      ons.createDialog('clientAddDialog.html', {
        parentScope: $scope
      }).then(function(clientAddDialog) {
        $scope._clientId = "";
        $scope._categoryName = "";
        $scope._clientName = "";
        $scope._position = _position;
        // getProductDatabase();
        clientAddDialog.show();
      });
    };

    // 配達先データのInsert
    $scope.insertClient = function(_categoryName, _clientName, _productId, _mon, _wed, _fri, _other, _position) {
      // alert(_categoryName + "/" + _clientName + "@" + _position);
      var rowData = {};
      rowData.clientName = _clientName;
      rowData.categoryName = _categoryName;
      rowData.clientId = $scope.maxClientId++;
      rowData.isExist = false;

      // alert(_mon);
      var rowData2 = {};
      var product = _productId.split("|");
      rowData2.productId = product[0];
      rowData2.productName = product[1];
      rowData2.mon = _mon == undefined ? 0 : _mon;
      rowData2.wed = _wed == undefined ? 0 : _wed;
      rowData2.fri = _fri == undefined ? 0 : _fri;
      rowData2.other = _other == undefined ? 0 : _other;
      // alert(JSON.stringify(rowData2));

      var productList = [];
      productList.push(rowData2);
      rowData.products = productList;

      if($scope.deliveryList.length < 1){
        // alert("a:" + $scope.deliveryList.length + " pos:" + _position);
        $scope.deliveryList.push(rowData);
      }else if(_position == 0){
        // alert("b");
        $scope.deliveryList.unshift(rowData);
      }else{
        // alert("c");
        $scope.deliveryList.splice(_position, 0, rowData);
      }

      clientAddDialog.hide();
      $scope.updated = true;
    };

    // 配達先データのUpdate
    $scope.dialogDispUpdClient = function(_clientPos, _categoryName, _clientName) {
      ons.createDialog('clientUpdDialog.html', {
        parentScope: $scope
      }).then(function(clientUpdDialog) {
        // alert(_categoryName);
        $scope._clientPos = _clientPos;
        $scope._categoryName = _categoryName;
        $scope._clientName = _clientName;
        clientUpdDialog.show();
      });
    };

    // 配達先データのUpdate
    $scope.updateClient = function(_clientPos, _categoryName, _clientName) {
      // alert("_clientPos:" + _clientPos + " / _categoryName:" + _categoryName + " / _clientName:" + _clientName);
      // updateClientDatabase(_clientPos, _categoryName, _clientName).then(selectDeliveryDatabase());
      $scope.deliveryList[_clientPos].categoryName = _categoryName;
      $scope.deliveryList[_clientPos].clientName = _clientName;

      // $scope.$apply();
      clientUpdDialog.hide();
      $scope.updated = true;
    };

    // 配達先の商品データのInsert
    $scope.dialogDispAddProductForClient = function(_clientPos) {
      ons.createDialog('clientProductAddDialog.html', {
        parentScope: $scope
      }).then(function(clientProductAddDialog) {
        // alert(_categoryName);
        $scope._clientPos = _clientPos;
        // getProductDatabase();
        clientProductAddDialog.show();
      });
    };
    
    $scope.insertProductForClient = function(_clientPos, _productId, _mon, _wed, _fri, _other) {
      // alert("_clientPos:" + _clientPos + " / _productId:" + _productId + " / _mon:" + _mon);

      var rowData2 = {};
      var product = _productId.split("|");
      rowData2.productId = product[0];
      rowData2.productName = product[1];
      rowData2.mon = _mon == undefined ? 0 : _mon;
      rowData2.wed = _wed == undefined ? 0 : _wed;
      rowData2.fri = _fri == undefined ? 0 : _fri;
      rowData2.other = _other == undefined ? 0 : _other;
      // alert(JSON.stringify(rowData2));

      $scope.deliveryList[_clientPos].products.push(rowData2);

      // $scope.$apply();
      clientProductAddDialog.hide();
      $scope.updated = true;
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
      insertProductDatabase(_productName).then(
        getProductDatabase()
      );
      // $scope.$apply();
      productAddDialog.hide();
    };

    // 配達先商品データのDelete
    $scope.dialogDispDelProductForClient = function(_clientPos, _productPos) {
      ons.createDialog('clientProductDelDialog.html', {
        parentScope: $scope
      }).then(function(clientProductDelDialog) {
        // alert(_deliveryId);
        $scope._clientPos = _clientPos;
        $scope._productPos = _productPos;
        clientProductDelDialog.show();
      });
    };

    $scope.deleteData = function(_clientPos, _productPos) {
      // alert("_clientPos:" + _clientPos + " / _productPos:" + _productPos);

      var clientData = $scope.deliveryList[_clientPos];
      // alert(JSON.stringify(clientData));
      // var productList = clientData.products.splice(_productPos, 1);
      clientData.products.splice(_productPos, 1);
      // alert(JSON.stringify(clientData));
      if(clientData.products.length > 0){
        $scope.deliveryList[_clientPos] = clientData;
      }else{
        $scope.deliveryList.splice(_clientPos, 1);
      }

      // alert(JSON.stringify($scope.deliveryList[_clientPos]));
      // $scope.$apply($scope.deliveryList);
      // alert("done");

      // $scope.$apply();
      clientProductDelDialog.hide();
      $scope.updated = true;
    };

    // Product Database for insert
    var insertProductDatabase = function(_productName){
      return new Promise(function(resolve, reject) {
        // タイムアウト値の設定は任意
        setTimeout(function(){
          console.log('Start insertProductDatabase');
          var db = window.openDatabase("Database", dbVer, "TestDatabase", 2048);
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

    // ClientByDate Database for delete
    var deleteClientByDateDatabase = function(_deliveryStDate){
      // alert("deleteClientByDateDatabase:" + _deliveryStDate);
      return new Promise(function(resolve, reject) {
        // タイムアウト値の設定は任意
        setTimeout(function(){
          console.log('Start deleteClientByDateDatabase');
          var db = window.openDatabase("Database", dbVer, "TestDatabase", 2048);
          // var db = window.openDatabase("Database", "1.0", "TestDatabase", 200000);
            db.transaction(
              function(tx){
                tx.executeSql('DELETE FROM TClientByDate WHERE deliveryStDate = "' + _deliveryStDate + '";');
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
          console.log('End deleteClientByDateDatabase');
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
      updateProductDatabase(_productId, _productName).then(
        selectProductDatabase()
      ).then(
        selectDeliveryDatabase()
      );
      productUpdDialog.hide();
    };

    $scope.changed = function() {
      // alert("updated");
      $scope.updated = true;
    }

    // updated check!!
    $scope.updatedCheck = function() {
      if($scope.updated){
        if(confirm("データが変更されています。保存しますか？")){
          $scope.save();
        }else{
          exit;
        }
      };
      // alert("aa");
    }

    $scope.save = function() {
      /**
       * Rule
       * - client
       *  clientidがない場合は、INSERT、すでに存在する場合はUPDATEにする
       *  ※削除はしない
       * - clientbydate
       *  clinetbydateは一旦すべて削除する
       *  productlistの順に処理をしていき、全て再生成する
       * ※前提
       * 先にgetMaxClientIdを管理して、その数字を配列に追加しておく
       * 配列の中には、existFlgを設定して、なければINSERT、あればUPDATE。
       * 先にclientIdを定義しているので、そのclientIdでclientByDateを設定
       */
      // alert($scope.weekDaySt);
      // alert($scope.deliveryList);
      // alert($scope.productList);
      deleteClientByDateDatabase($scope.weekDaySt).then(
        remakeDeliveryDatabase($scope.deliveryList).then(
          $scope.updateAlert()
        )
      );
    }

    // Product Database for update
    var updateProductDatabase = function(_productId, _productName){
      return new Promise(function(resolve, reject) {
        // タイムアウト値の設定は任意
        setTimeout(function(){
          console.log('Start updateProductDatabase');
          var db = window.openDatabase("Database", dbVer, "TestDatabase", 2048);
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

    var remakeDeliveryDatabase = function(_deliveryList){
      // alert("remakeDeliveryDatabase" + $scope.productList);
      return new Promise(function(resolve, reject) {
        // タイムアウト値の設定は任意
        setTimeout(function(){
          console.log('Start remakeDeliveryDatabase');
          var db = window.openDatabase("Database", dbVer, "TestDatabase", 2048);
          // var db = window.openDatabase("Database", "1.0", "TestDatabase", 200000);
          db.transaction(
            function(tx){
              // alert("remakeDeliveryDatabase!!(" + JSON.stringify(_deliveryList) + ")");
              var len = _deliveryList.length;
              // alert("remakeDeliveryDatabase!!!!");
              for (var i = 0; i < len; i++) {
                var rowData = $scope.deliveryList[i];
                // alert("rowData;" + JSON.stringify(rowData));
                if(!rowData.isExist) {
                  // INSERT
                  tx.executeSql('INSERT INTO MClient \
                  VALUES (' + rowData.clientId + ', \
                  "' + rowData.categoryName + '", \
                  "' + rowData.clientName + '", 0)');
                }else{
                  // UPDATE
                  sqlString = 'UPDATE MClient\
                    SET categoryName = "' + rowData.categoryName + '", \
                    clientName = "' + rowData.clientName + '"  \
                    WHERE clientId = ' + rowData.clientId;
                  tx.executeSql(sqlString);
                }
                // alert($scope.maxClientByDateId);
                tx.executeSql('INSERT INTO TClientByDate(clientbydateId, clientId, deliveryStDate, orderNum, deleteFlg) VALUES \
                (' + $scope.maxClientByDateId + ', ' + rowData.clientId + ', "' + $scope.weekDaySt + '", ' + i + ', 0)');

                var len2 = rowData.products.length;
                // alert("rowData.products" + JSON.stringify(rowData.products));
                for (var i2 = 0; i2 < len2; i2++) {
                  // alert(JSON.stringify(rowData.products[i2]));
                  var rowData2 = rowData.products[i2];
                  var sql = 'INSERT INTO TDelivery(clientbydateId, productId, mon, wed, fri, other) VALUES \
                  (' + $scope.maxClientByDateId + ', ' + rowData2.productId + ', ' + rowData2.mon + ', ' + rowData2.wed + ', ' + rowData2.fri + ', ' + rowData2.other + ')';
                  tx.executeSql(sql);
                }
                $scope.maxClientByDateId++;
              }
              // alert("remakeDeliveryDatabase?!");
            }, 
            function(){
              // 失敗時
              // alert("4- create fail");
            }, 
            function(){
              // 成功時
              // alert("4- create success");
              selectDeliveryDatabase();
              selectProductDatabase();

              $scope.updated = false;
              resolve();
            }
          );
          console.log('End remakeDeliveryDatabase');
        },100);
      });
    };

  var moveAt = function(array, index, at) {
    // alert("aa1 index:" + index + " / at:" + at);
    if (index === at || index > array.length -1 || at > array.length - 1) {
      // alert("aa7");
      return array;
    }

    // alert("aa2 index:" + index);
    var value = array[index];
    // alert("aa2-1 value:" + JSON.stringify(value));
    // alert("aa2-1 = " + JSON.stringify(array));
    var tail = array.slice(index + 1);

    // alert("aa3 tail:" + JSON.stringify(tail));
    array.splice(index);

    // alert("aa4");
    Array.prototype.push.apply(array, tail);

    // alert("aa5:" + at + " value:" + JSON.stringify(value));
    array.splice(at, 0, value);

    // alert("aa6");
    return array;
  }
});
