/**
  Oh-MeijiCal2GoogleCal by 3846masa
  
  Oh-Meijiのカレンダー（課題・休講情報）をGoogleCalenderに追加します。
  【使い方】
  1.Googleカレンダーに「Meiji」という名前のカレンダーを作ります。
  !注意! このプログラムはMeijiの中身を『全て削除します』。
  
  1.Settingsの指示に従って、設定をします。
  3.保存します。
  
  4.メニューの「リソース」->「現在のプロジェクトのトリガー」
  5.「新しいトリガーを追加」
  6.関数->『main』 イベント->『時間主導型』『日タイマー』『このプログラムを実行する時間帯』
  !注意! Oh-Meijiは、毎週木曜日「8:00～8:30」にシステム停止なので、それ以外の時間帯を選択すること。
  
  7.メニューの「実行」->「main」で動かしてみて、カレンダーが更新されるか確認する。
  !注意! 実行テスト中はブラウザを閉じないこと。実行テスト中は画面上に表示が出ます。
         また、プログラム実行時間は結構長いので気長に待ちましょう。(速くても2分強)
*/

/* Settings */
/*
1.Oh-Meijiにログインします。
2.下のコードをアドレスバー貼り付けます。(Enterはまだ押さないこと。)

var p={};$("form#calendarForm").serializeArray().forEach(function(v){p[v.name]=v.value;});JSON.stringify(p);

3.アドレスバーの先頭に javascript: と入力してEnterを押します。
4.画面に表示された文字をコピーして下に貼り付けます。*/

var settings = /*ココに貼り付けます。*/

;//----------------------------------------------------//;
;//----------------------------------------------------//;
;//----------------ここより下は変えない----------------//;
;//----------------------------------------------------//;
;//----------------------------------------------------//;

function main(){
  var gcal = CalendarApp.getOwnedCalendarsByName('Meiji');
  if (gcal.length != 1){
    return -1;
  }

  var response = sendHttpPost();
  var iCal_raw = response.getContentText().split("\n");
  
  var iCal = new Array();
  var flag = 0;
  var calData = {};
  for(var i=0;i<iCal_raw.length;i++){
    var cal = iCal_raw[i];
    if(cal.match(/BEGIN:VEVENT/)){flag=1;continue;}
    if(cal.match(/END:VEVENT/)){
      calData['description']=calData['description'].replace(/\\n/g,"\n");
      iCal.push(calData);
      calData={};flag=0;continue;
    }
    if(flag==0){continue;}
    if(cal.match(/^DTSTART;VALUE=DATE:/))calData['start']=cal.match(/^DTSTART;VALUE=DATE:(.*)/)[1];
    if(cal.match(/^DTEND;VALUE=DATE:/))calData['end']=cal.match(/^DTEND;VALUE=DATE:(.*)/)[1];
    if(cal.match(/^DTSTART:/))calData['start']=cal.match(/^DTSTART:(.*)/)[1];
    if(cal.match(/^DTEND:/))calData['end']=cal.match(/^DTEND:(.*)/)[1];
    if(cal.match(/^SUMMARY:/))calData['title']=cal.match(/^SUMMARY:(.*)/)[1];
    if(cal.match(/^DESCRIPTION:/))calData['description']=cal.match(/^DESCRIPTION:(.*)/)[1];
    if(!cal.match(/^[A-Z-]+:/))calData['description']+=cal;
  }
  
  var events = gcal[0].getEvents(new Date(0), new Date("2030/01/01"));
  events.forEach(function(event){
    event.deleteEvent();
    Utilities.sleep(10);
  });
  iCal.forEach(function(data){
    if(data.start==null || data.end==null)return;
    gcal[0].createEvent(data.title,makeDate(data.start),makeDate(data.end),{description: data.description});
    Utilities.sleep(10);
  });
}

function makeStringDate(date) {
  var str = "";
  str += date.getFullYear();
  str += (date.getMonth()+1<10?"0":"")+(date.getMonth()+1);
  str += date.getDate();
  return str;
}

function makeDate(date) {
  if (date.match(/^\d+$/)) {
    date = date.match(/(\d{4})(\d{2})(\d{2})/);
    date = date.slice(1,4).join("/")+" 00:00:00 +09:00";
  } else {
    date = date.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/);
    date = date.slice(1,4).join("/")+" "+date.slice(4,7).join(":")+" GMT";
  }
  date = new Date(date);
  return date;
}

function sendHttpPost() {
   
   var date = new Date();
   var payload = settings;
   payload["condition.nowDate"]=makeStringDate(date);
   payload["condition.selDate"]=makeStringDate(date);
   payload["condition.nowYear"]=""+date.getFullYear();
   payload["condition.nowMonth"]=(date.getMonth()+1<10?"0":"")+(date.getMonth()+1);
   payload["condition.nowDay"]=""+date.getDate();
   payload["downloadDate"]=makeStringDate(date);
  
   var options =
   {
     "method" : "post",
     "payload" : payload,
     "muteHttpExceptions" : true
   };

   var response = UrlFetchApp.fetch("https://oh-o2.meiji.ac.jp/Webservice/calendarIcsMake", options);

   return UrlFetchApp.fetch("https://oh-o2.meiji.ac.jp/Webservice/calendarIcsDownload?downloadDate="+makeStringDate(date)+"&loginUserId="+settings["personalData.personalId"]);
 };