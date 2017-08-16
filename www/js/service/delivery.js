// This is a JavaScript file
app.factory("calcStWeekDate", function(){
  return function(_today){
    // return _today.getFullYear() +  "-" + (_today.getMonth() + 1) + "-" + _today.getDate();
    return _today;
  };
});

app.factory("calcEdWeekDate", function(){
  return function(_today){
    // 最終日の算出
    var _calDate = new Date( _today );
    // alert(_calDate);
    _calDate.setDate(_calDate.getDate() + 6);
    // alert(_calDate);
    // return _calDate.getFullYear() + "-" + (_calDate.getMonth() + 1) + "-" + _calDate.getDate();
    return _calDate;
  };
});

app.factory("formatDate", function(){
  return function(_date){
    return _date.getFullYear() +  "-" + (_date.getMonth() + 1) + "-" + _date.getDate();
  };
});
