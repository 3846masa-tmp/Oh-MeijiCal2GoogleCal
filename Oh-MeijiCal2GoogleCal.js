/**
  Oh-MeijiCal2GoogleCal by 3846masa
  
  Oh-Meiji�̃J�����_�[�i�ۑ�E�x�u���j��GoogleCalender�ɒǉ����܂��B
  �y�g�����z
  1.Google�J�����_�[�ɁuMeiji�v�Ƃ������O�̃J�����_�[�����܂��B
  !����! ���̃v���O������Meiji�̒��g���w�S�č폜���܂��x�B
  
  1.Settings�̎w���ɏ]���āA�ݒ�����܂��B
  3.�ۑ����܂��B
  
  4.���j���[�́u���\�[�X�v->�u���݂̃v���W�F�N�g�̃g���K�[�v
  5.�u�V�����g���K�[��ǉ��v
  6.�֐�->�wmain�x �C�x���g->�w���Ԏ哱�^�x�w���^�C�}�[�x�w���̃v���O���������s���鎞�ԑсx
  !����! Oh-Meiji�́A���T�ؗj���u8:00�`8:30�v�ɃV�X�e����~�Ȃ̂ŁA����ȊO�̎��ԑт�I�����邱�ƁB
  
  7.���j���[�́u���s�v->�umain�v�œ������Ă݂āA�J�����_�[���X�V����邩�m�F����B
  !����! ���s�e�X�g���̓u���E�U����Ȃ����ƁB���s�e�X�g���͉�ʏ�ɕ\�����o�܂��B
         �܂��A�v���O�������s���Ԃ͌��\�����̂ŋC���ɑ҂��܂��傤�B(�����Ă�2����)
*/

/* Settings */
/*
1.Oh-Meiji�Ƀ��O�C�����܂��B
2.���̃R�[�h���A�h���X�o�[�\��t���܂��B(Enter�͂܂������Ȃ����ƁB)

var p={};$("form#calendarForm").serializeArray().forEach(function(v){p[v.name]=v.value;});JSON.stringify(p);

3.�A�h���X�o�[�̐擪�� javascript: �Ɠ��͂���Enter�������܂��B
4.��ʂɕ\�����ꂽ�������R�s�[���ĉ��ɓ\��t���܂��B*/

var settings = /*�R�R�ɓ\��t���܂��B*/

;//----------------------------------------------------//;
;//----------------------------------------------------//;
;//----------------������艺�͕ς��Ȃ�----------------//;
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