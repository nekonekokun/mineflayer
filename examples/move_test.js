/*
 * RC player by nekonekokun 2017/07/07
 *
  */
//globals
var mineflayer = require('../../mineflayer');
var fs = require("fs");
var request = require('request');
var json_messages = {"data": []};
var date = new Date();
var format = 'YYYYMMDDhhmmss';
format = format.replace(/YYYY/g, date.getFullYear());
format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
var safe_chat_counter = 0;
var last_login_user = "noone"
var omikuji_done_today = date.getDate();
var command_timer = 0;

if(process.argv.length < 4 || process.argv.length > 6) {
  console.log("Usage : node echo.js <host> <port> [<name>] [<password>]");
  process.exit(1);
}

console.log("host: " +  process.argv[2])
console.log("username: " +  process.argv[4])

try{
  var bot = mineflayer.createBot({
    host: process.argv[2],
    port: parseInt(process.argv[3]),
    username: process.argv[4] ? process.argv[4] : "echo",
    password: process.argv[5],
    version: "1.11.2",
    verbose: true,
  });
}
catch(e){
  console.log(e)
}

// register event handlers -----------------------------------------------------
bot.on('connect', function() {
  console.log("connected");
});

bot.on('death', function() {
  console.log("dead");
  bot.clearControlStates();
});

bot.on('health', function() {
  console.log("health = " + bot.health.toString() +
    ", food = " + bot.food.toString());
});

bot.on('message', function(jmes) {
  //console.log(jmes);
  newdate = new Date();
  ndf = format_date(newdate);
  try{
    jmes.extra.forEach(function(v, i, a){
     console.log(v.text);
     recognizePatterns(v.text, "");
    });
    jmes.date = ndf;
    json_messages.data.push(jmes);
  }
  catch(e){}
  //console.log("\n");
});

bot.on('chat', function(username, message, translate, jsonMsg, matches) {
  //if(username === bot.username) return;
  //bot.chat(message);
  console.log(message);
  recognizePatterns(message, username);
});
bot.on('whisper', function(username, message, translate, jsonMsg, matches) {
  //if(username === bot.username) return;
  //bot.chat(message);
  console.log(message);
  recognizePatterns(message, username);
});

setTimeout(writeJson, 30, json_messages);
setTimeout(once_one_minute, 1000 * 10, []);

//bot.setControlState("sneak", true)

//--------- function definition ---------------------------------------------------
function once_one_minute(){
  var newdate = new Date();
  if(omikuji_done_today != newdate.getDate())
  {
    safechat("/omikuji");
    omikuji_done_today = newdate.getDate();
  }

  //bot.setControlState("forward", true);
  //bot.setControlState("jump", true);
  setTimeout(once_one_minute, 1000 * 90, []);
}

function writeJson(jdata){
  console.log("write to " + './logs/' + format + ".json")
  fs.writeFile('./logs/' + format + ".json", JSON.stringify(jdata, undefined, 1));
  setTimeout(writeJson, 1000 * 60 * 20, json_messages);

  var newdate = new Date();
  if(newdate.getDate() != date.getDate()){
    date = newdate;
    format = 'YYYYMMDDhhmmss';
    format = format.replace(/YYYY/g, date.getFullYear());
    format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
    format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
    format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
    format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
    format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
    json_messages = {"data": []};

    safe_chat_counter = 0; //allow chat again
  }
}

function recognizePatterns(txt, uname){
  if (uname === ""){
    if(m = txt.match(/.*?<(.*?)> (.*)/)){
      uname = m[1];
      txt = m[2]
    }
  }

  if(m = txt.match(/(.*?) whispers: (.*)/)){
    uname = m[1];
    txt = m[2];
  }

  console.log("pr: " + txt + " by " + uname);
  //update last login user
  if(m = txt.match(/(.*?) joined the game/)){
    last_login_user = m[1];
    console.log("last_login_user = " + last_login_user);
  }
  //detects hi
  else if (m = txt.match(/^(hi)|(he)|(hey)|(ひ)$/i)){
    if(uname === last_login_user){
      setTimeout(function(){safechat('hi');}, 3000, []);
      //safechat('hi');
      last_login_user = "-----";
    }
  }

  else if (m = txt.match(/^きよし$/)){
    setTimeout(function(){safechat('フォン');}, 1000, []);
    //safechat('hi');
  }

  //imgur
  else if (m = txt.match(/http:\/\/i\.imgur\.com\/(.*)\.((png)|(jpg))/)){
    var url = m[0]
    var img_name = m[1] + "." + m[2]
    console.log("download " + url);
    request(
      {method: 'GET', uri: url, encoding: null},
      function (error, response, body){
        if(!error && response.statusCode === 200){
            fs.writeFileSync("./imgs/" + img_name, body, 'binary');
            console.log("download succeeded");
        }
        else {
          console.log("download failed: " + error);
        }
      }
    );
  }
  else if (m = txt.match(/http:\/\/imgur\.com\/(.*)/)){
    var url = m[0];
    var set_tokens = m[1].split("/");
    var set_name = set_tokens[set_tokens.length - 1];
    console.log("download " + url);
    request(
      {method: 'GET', uri: url, encoding: null},
      function (error, response, body){
        if(!error && response.statusCode === 200){
            imgs = imgsFromImgur(body.toString());
            imgs.forEach(function(v, i, a){
              var url = "http://" + v;
              var tokens = url.split("/");
              console.log("tokens: " + tokens.toString());
              var img_name = tokens[tokens.length - 1];
              console.log("download " + url);

              request(
                {method: 'GET', uri: url, encoding: null},
                function (error, response, body){
                  if(!error && response.statusCode === 200){
                    fs.writeFileSync("./imgs/" + set_name + "_" + img_name, body, 'binary');
                    console.log("download succeeded");
                  }
                  else {
                    console.log("download failed: " + error);
                  }
                }
              );
            });
            console.log("download succeeded");
        }
        else {
          console.log("download failed: " + error);
        }
      }
    );

  }
  //commands
  else if(m = txt.match(/^nezunezukun00 (.*)/)){
    console.log("command detected");
    var command = m[1];
    tokens = command.split(" ");
    if(command_timer){
      clearTimeout(command_timer);
    }
    command_timer = setTimeout(function(){
       bot.clearControlStates();
    }, 2000);
    switch(tokens[0]){
      case "stop":
      case "s":
        bot.clearControlStates();
        break;
      case "forward":
      case "f":
        bot.setControlState("forward", true);
        bot.setControlState("back", false);
        break;
      case "back":
      case "b":
        bot.setControlState("back", true);
        bot.setControlState("forward", false);
        break;
      case "jump":
      case "j":
        bot.setControlState("jump", true);
        break;
      case "sneak":
      case "sn":
        bot.setControlState("sneak", true);
        break;
      case "turn":
      case "t":
        var t1 = Number(tokens[1]);
        var yaw = isNaN(t1) ? 0 : t1;
        var t2 = Number(tokens[2]);
        var pitch = isNaN(t2) ? 0 : t2;
        console.log("turn " + yaw + ", " + pitch);
        bot.look(yaw * 3.14 / 180, pitch * 3.14 / 180, false, false);
        break;
    }
  }
}

//chat with limits
function safechat(txt){
  if(safe_chat_counter < 10){
    console.log("safechat: " + txt);
    safe_chat_counter += 1;
    bot.chat(txt)
  }
}

function format_date(date){
  var format = 'YYYYMMDDhhmmss';
  format = format.replace(/YYYY/g, date.getFullYear());
  format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
  format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
  format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
  format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
  format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
  return format;
}

function imgsFromImgur(html){
  var imgs = [];
  //console.log(html);
  var lines = html.split("\n");
  lines.forEach(
    function(v, i, s){
      //console.log(v);
      if(m = v.match(/<img.*src="\/\/(i\.imgur\.com\/.*?)"/)){
        console.log(m[0]);
        imgs.push(m[1]);
      }
    }
  );
  console.log("imgs: " + imgs.toString());
  return imgs;
}
