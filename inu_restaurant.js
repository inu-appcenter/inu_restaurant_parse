/* copyright(c) 2016 All rights reserved by seon-il kim(supercartoon@naver.com) 201101720 정보통신공학과 김선일
* 수정하지 마세요!
*/
var mysql = require('mysql');
var cheerio = require('cheerio');
var request = require('request');
var schedule = require('node-schedule');

console.log("<<< INU 생협 식단 파싱 node.js / by Seon-Il Kim (supercartoon@naver.com) >>>");
console.log("이 작업은 매주 일요일, 월요일 0시 1분에 실행됩니다.");
var j = schedule.scheduleJob("1 0 * * 0,1" , function(){
  console.log(new Date());
  insertDB();
});

var url = 'https://www.uicoop.ac.kr:41052/shop/shop.php?w=3';

var pool = mysql.createPool(
  require('./config.js').db
);

function convertHTML(menu) {
    menu = menu.replace(/(^\s*)|(\s*$)/g, "");
    menu = menu.replace(/<\/td>/gi, '');
    menu = menu.replace(/<td class="menu-list" valign="top">/gi, '');
    menu = menu.replace(/<td class="menu-list-corn">/gi, '');
    menu = menu.replace(/&nbsp;/gi, '');
    menu = menu.replace(/<\/span>/gi, '');
    menu = menu.replace(/<span style="font-weight:bold;color:#0B555B;font-size:1.1em;">/gi, '');
    menu = menu.replace(/<span style="font-weight:bold;color:#0B555B;">/gi, '');
    menu = menu.replace(/\r/gi, ' ');
    menu = menu.replace(/\n/gi, ' ');
    menu = menu.replace(/ <br> /gi, ' ');
    menu = menu.replace(/<br> /gi, ' ');
    menu = menu.replace(/<br>/gi, ' ');
    menu = menu.replace(/  /gi, ' ');
    menu = menu.replace(/   /gi, ' ');
    menu = menu.replace(/    /gi, ' ');
    menu = menu.replace(/(^\s*)|(\s*$)/g, "");
    return menu;
}

function splitHTML(menu) {
    var menuarr = menu.split('<hr style="border:1px dotted #d4d4b8;">');
    for (var i = 0; i < menuarr.length; i++) {
        menuarr[i] = menuarr[i].replace(/(^\s*)|(\s*$)/g, "");
    }
    return menuarr;
}

////////////////////////////////////////////////////////////////////////////////


function information() {
    console.log("<<< INU restaurant parse node.js / by Seon-Il Kim (supercartoon@naver.com) >>>");
    console.log("이 작업은 매일 새벽 2시에 실행됩니다.");
}

function makeObject(callback) {
    var object = new Object();
    //복지회관
    object.menu11 = new Array(); //복지회관 1코너. 2개
    object.menu12 = new Array(); //복지회관 2코너. 2개
    object.menu13 = new Array(); //복지회관 3코너
    object.menu14 = new Array(); //복지회관 4코너
    object.menu15 = new Array(); //복지회관 5코너

    //카페테리아
    object.menu21 = new Array(); //카페테리아 A코너 중식
    object.menu22 = new Array(); //카페테리아 A코너 석식. 2개
    object.menu23 = new Array(); //카페테리아 B코너
    // object.menu24 = new Array();

    //사범대
    object.menu31 = new Array(); //사범대 중식. 3개
    object.menu32 = new Array(); //사범대 석식

    //기숙사
    object.menu41 = new Array(); //조식
    object.menu42 = new Array(); //중식
    object.menu43 = new Array(); //석식

    //교직원
    object.menu51 = new Array(); //중식. 2개
    object.menu52 = new Array(); //석식
    if (typeof callback === 'function') {
        callback(object);
    }
}

function getData(callback) {
    makeObject(function(object) {
        request(url, {
            rejectUnauthorized: false
        }, function(err, response, html) {
            //사범대 식당
            if (err) {
                console.error(err);
                throw err;
            }
            var $ = cheerio.load(html, {
                decodeEntities: false
            });

            var date = $("#main_background > div.layout > div.layout_A > div.sub_wrap > div.smid > div.detail_left > div > div > span");

            // #main_background > div.layout > div.layout_A > div.sub_wrap > div.smid > div.detail_left > div > table > tbody > tr:nth-child(3) > td:nth-child(3)
            var all_menu = $("#main_background > div.layout > div.layout_A > div.sub_wrap > div.smid > div.detail_left > div > table");
            // #main_background > div.layout > div.layout_A > div.sub_wrap > div.smid > div.detail_left > div > div > span
            var date_new = $("#main_background > div.layout > div.layout_A > div.sub_wrap > div.smid > div.detail_left > div > div > span").text();

            date_new = date_new.split('(');
            date_new = date_new[1].split('~');
            date_new = date_new[0].replace(/(^\s*)|(\s*$)/g, "");
            console.log("이번주 시작일 : "+date_new);
            // var date2 = $(all_menu).find("tr:nth-child(3) > td:nth-child(2)").text();
            // date2 = date2.replace("월", "").replace(/(^\s*)|(\s*$)/g, "").replace("월 ", "-").replace("일", "");
            // date2 = new Date().getFullYear()+"-"+date2;
            // console.log(date2);
            // var datearr = date2.split(' ');
            // datearr[0] = +datearr[0];
            // datearr[1] = +datearr[1];
            // console.log(datearr[0]);
            // console.log(datearr[1]);
            object.start_date = new Date(date_new);
            // object.start_date = new Date(new Date().getFullYear(), datearr[0]-1, datearr[1]+1);
            // object.start_date = new Date(2017, 1, 9);

            for (var i = 0; i < 7; i++) {
                //0 : 월요일 ~ 7 : 일요일
                object.menu11[i] = convertHTML($(all_menu).find("tr:nth-child(5) > td:nth-child(" + (i + 3) + ")") + "");
                // object.menu11[i] = splitHTML(object.menu11[i]);
                // console.log(object.menu11[i]);
                //menu11[i][j] : 복지회관 1코너 i번째 요일(j+1)번째 메뉴
                object.menu12[i] = convertHTML($(all_menu).find("tr:nth-child(6) > td:nth-child(" + (i + 2) + ")") + "");
                // object.menu12[i] = splitHTML(object.menu12[i]);
                //menu12[i][j] : 복지회관 2코너 i번째 요일(j+1)번째 메뉴
                object.menu13[i] = convertHTML($(all_menu).find("tr:nth-child(7) > td:nth-child(" + (i + 2) + ")") + "");
                //menu13[i] : 복지회관 3코너 i번째 요일 메뉴
                object.menu14[i] = convertHTML($(all_menu).find("tr:nth-child(8) > td:nth-child(" + (i + 3) + ")") + "");
                //menu14[i] : 복지회관 3코너 i번째 요일 메뉴
                object.menu15[i] = convertHTML($(all_menu).find("tr:nth-child(9) > td:nth-child(" + (i + 2) + ")") + "");
                //menu15[i] : 복지회관 3코너 i번째 요일 메뉴

                // #main_background > div.layout > div.layout_A > div.sub_wrap > div.smid > div.detail_left > div > table > tbody > tr:nth-child(9) > td:nth-child(3)
                object.menu21[i] = convertHTML($(all_menu).find("tr:nth-child(11) > td:nth-child(" + (i + 3) + ")") + "");
                //menu21[i] : 카페테리아 A코너 중식 i번째 요일 메뉴
                // console.log(menu21[i]);
                object.menu22[i] = convertHTML($(all_menu).find("tr:nth-child(12) > td:nth-child(" + (i + 2) + ")") + "");
                // object.menu22[i] = splitHTML(object.menu22[i]);
                //menu22[i][j] : 카페테리아 A코너 석식 i번째 요일 (j+1)번째 메뉴
                // for(var j=0;j<menu22[i].length;j++){
                //   console.log(menu22[i][j]);
                // }
                object.menu23[i] = convertHTML($(all_menu).find("tr:nth-child(13) > td:nth-child(" + (i + 2) + ")") + "");
                //menu23[i] : 카페테리아 B코너 i번째 요일 메뉴
                // console.log(i+" "+object.menu23[i]);


                object.menu31[i] = convertHTML($(all_menu).find("tr:nth-child(15) > td:nth-child(" + (i + 2) + ")") + "");
                // object.menu31[i] = splitHTML(object.menu31[i]);
                //menu31[i][j] : 사범대 중식 i번째 요일 (j+1)번째 메뉴
                // for(var j=0;j<menu31[i].length;j++){
                //   console.log(menu31[i][j]);
                // }
                object.menu32[i] = convertHTML($(all_menu).find("tr:nth-child(16) > td:nth-child(" + (i + 2) + ")") + "");
                //menu32[i] : 사범대 석식 i번째 요일 메뉴
                // console.log(menu32[i]);

                object.menu41[i] = convertHTML($(all_menu).find("tr:nth-child(18) > td:nth-child(" + (i + 2) + ")") + "");
                // console.log(menu41[i]);
                object.menu42[i] = convertHTML($(all_menu).find("tr:nth-child(19) > td:nth-child(" + (i + 2) + ")") + "");
                // console.log(menu42[i]);
                object.menu43[i] = convertHTML($(all_menu).find("tr:nth-child(20) > td:nth-child(" + (i + 2) + ")") + "");
                // console.log(menu43[i]);
                //menu4x[i] : 기숙사 i번째 요일 메뉴

                object.menu51[i] = convertHTML($(all_menu).find("tr:nth-child(22) > td:nth-child(" + (i + 2) + ")") + "");
                // object.menu51[i] = splitHTML(object.menu51[i]);
                //menu51[i][j] : 교직원 중식 i번째 요일 (j+1)번째 메뉴
                // for(var j=0;j<menu51[i].length;j++){
                //   console.log(menu51[i][j]);
                // }
                object.menu52[i] = convertHTML($(all_menu).find("tr:nth-child(23) > td:nth-child(" + (i + 2) + ")") + "");
                //menu52[i] : 교직원 석식 i번째 요일 메뉴
                // console.log(menu52[i]);
            }
            if (typeof callback === 'function') {
                callback(object);
            }
        });
    });
}

function insertDB(callback) {
    getData(function(object) {
      // var date = object.start_date;
      // for(var i=0;i<7;i++){
      //   // var cd = date.getDate();
      //   // if(i!=0) date.setDate(cd+1);
      //   for(var j=0;j<2;j++){
      //     insertQuery(i, j, object);
      //   }
      // }
      // insertSQL(0, object.start_date, object.menu11, function() {
      //   // callback(null, web_data.length);
      //   console.log('complete');
      // });

      // console.log(object.menu11);

      var date1 = new Date(object.start_date);
      insertSQL(0, date1, '복지회관', '1코너', 0, object.menu11, 1, function() {
        // callback(null, web_data.length);
        console.log('complete menu11-0');
      });

      var date2 = new Date(object.start_date);//date 복사
      insertSQL(0, date2, '복지회관', '1코너', 1, object.menu11, 2, function() {
        // callback(null, web_data.length);
        console.log('complete menu11-1');
      });

      var date02 = new Date(object.start_date);//date 복사
      insertSQL(0, date02, '복지회관', '1코너', 2, object.menu11, 3, function() {
        // callback(null, web_data.length);
        console.log('complete menu11-2');
      });

      insertSQL(0, new Date(object.start_date), '복지회관', '1코너', 3, object.menu11, 4, function() {
        // callback(null, web_data.length);
        console.log('complete menu11-3');
      });

      var date3 = new Date(object.start_date);//date 복사
      insertSQL(0, date3, '복지회관', '2코너', 0, object.menu12, 4, function() {
        // callback(null, web_data.length);
        console.log('complete menu12-0');
      });

      var date4 = new Date(object.start_date);//date 복사
      insertSQL(0, date4, '복지회관', '2코너', 1, object.menu12, 5, function() {
        // callback(null, web_data.length);
        console.log('complete menu12-1');
      });

      var date5 = new Date(object.start_date);//date 복사
      insertSQL(0, date5, '복지회관', '3코너', 0, object.menu13, 6, function() {
        // callback(null, web_data.length);
        console.log('complete menu13-0');
      });

      var date6 = new Date(object.start_date);//date 복사
      insertSQL(0, date6, '복지회관', '4코너', 0, object.menu14, 7, function() {
        // callback(null, web_data.length);
        console.log('complete menu14-0');
      });

      var date7 = new Date(object.start_date);//date 복사
      insertSQL(0, date7, '복지회관', '5코너', 0, object.menu15, 8, function() {
        // callback(null, web_data.length);
        console.log('complete menu15-0');
      });

      var date8 = new Date(object.start_date);//date 복사
      insertSQL(0, date8, '카페테리아', 'A코너_중식', 0, object.menu21, 1, function() {
        // callback(null, web_data.length);
        console.log('complete menu21-0');
      });

      var date9 = new Date(object.start_date);//date 복사
      insertSQL(0, date9, '카페테리아', 'A코너_석식', 0, object.menu22, 2, function() {
        // callback(null, web_data.length);
        console.log('complete menu22-0');
      });

      var date10 = new Date(object.start_date);//date 복사
      insertSQL(0, date10, '카페테리아', 'A코너_석식', 1, object.menu22, 3, function() {
        // callback(null, web_data.length);
        console.log('complete menu22-1');
      });

      var date11 = new Date(object.start_date);//date 복사
      insertSQL(0, date11, '카페테리아', 'B코너', 0, object.menu23, 4, function() {
        // callback(null, web_data.length);
        console.log('complete menu23-0');
      });

      insertSQL(0, new Date(object.start_date), '카페테리아', 'B코너', 1, object.menu23, 5, function() {
        // callback(null, web_data.length);
        console.log('complete menu23-1');
      });

      insertSQL(0, new Date(object.start_date), '사범대식당', '중식', 0, object.menu31, 1, function() {
        // callback(null, web_data.length);
        console.log('complete menu31-0');
      });
      insertSQL(0, new Date(object.start_date), '사범대식당', '중식', 1, object.menu31, 2, function() {
        // callback(null, web_data.length);
        console.log('complete menu31-1');
      });
      insertSQL(0, new Date(object.start_date), '사범대식당', '중식', 2, object.menu31, 3, function() {
        // callback(null, web_data.length);
        console.log('complete menu31-2');
      });
      insertSQL(0, new Date(object.start_date), '사범대식당', '석식', 0, object.menu32, 4, function() {
        // callback(null, web_data.length);
        console.log('complete menu32-0');
      });

      insertSQL(0, new Date(object.start_date), '생활관', '조식', 0, object.menu41, 1, function() {
        // callback(null, web_data.length);
        console.log('complete menu41-0');
      });
      insertSQL(0, new Date(object.start_date), '생활관', '중식', 0, object.menu42, 2, function() {
        // callback(null, web_data.length);
        console.log('complete menu42-0');
      });
      insertSQL(0, new Date(object.start_date), '생활관', '석식', 0, object.menu43, 3, function() {
        // callback(null, web_data.length);
        console.log('complete menu43-0');
      });

      insertSQL(0, new Date(object.start_date), '교직원', '중식', 0, object.menu51, 1, function() {
        // callback(null, web_data.length);
        console.log('complete menu51-0');
      });

      insertSQL(0, new Date(object.start_date), '교직원', '중식', 1, object.menu51, 2, function() {
        // callback(null, web_data.length);
        console.log('complete menu51-1');
      });

      insertSQL(0, new Date(object.start_date), '교직원', '중식', 2, object.menu51, 3, function() {
        // callback(null, web_data.length);
        console.log('complete menu51-2');
      });

      insertSQL(0, new Date(object.start_date), '교직원', '석식', 0, object.menu52, 4, function() {
        // callback(null, web_data.length);
        console.log('complete menu52-0');
      });
    })
}

insertSQL = function(i, sdate, name, corner, menu_num, menu, order, callback){
  setTimeout(function() {
    if(i==7){
      callback();
    } else {
      pool.getConnection(function(err, connection){
        if(err){
          console.error(err);
          throw err;
        } else {
          var date = sdate;
          var cd = sdate.getDate();
          if(i!=0) date.setDate(cd+1);
          // console.log(date);
          // console.log(menu[i][menu_num]);

          var insert_menu = menu[i];

          if(insert_menu.indexOf('<hr style="border:1px dotted #d4d4b8;">')!=-1){
            //포함하고 있으면
            var arr = insert_menu.split('<hr style="border:1px dotted #d4d4b8;">');
            // if(menu_num==0){
            //   insert_menu=arr[0];
            // }
            // else if(menu_num==1){
            //   insert_menu=arr[1];
            // }
            // else if(menu_num==2){
            //   insert_menu=arr[2];
            // }
            insert_menu = arr[menu_num];

          } else {
            if(menu_num==1 || menu_num==2){
              insert_menu="";
            }
          }

          // console.log(insert_menu);

          connection.query('insert into restaurant values(?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE menu=?', [date, name, corner, order, menu_num, insert_menu, insert_menu], function(err, rows){
            if(err){
              console.error(err);
              // console.log('insert failed');
            } else {
              // console.log(web_data[i].name+"is inserted");
              // console.log('insert success');
            }
          });
        }
        connection.release();
      });
      insertSQL(i+1, sdate, name, corner, menu_num, menu, order, callback);
    }
  }, 10);
}
