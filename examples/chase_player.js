/*
 * chase player by nekonekokun 2017/07/07
 *
  */
//globals
var mineflayer = require('../../mineflayer');
var fs = require("fs");
var request = require('request');
var Vec3 = require('vec3').Vec3;
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
var last_chat_time = 0;
var last_login_user = "noone";
var player_of_interest = "noone";
var dst_player_of_interest = 9999;
var omikuji_done_today = date.getDate();
var command_timer = 0;
var interact_timer = 0;
var last_interact_time = new Date();
var chasing_user = "noone";
var users = {};

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
    version: "1.12",
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

bot.on('kicked', function(reason, loogedin) {
  console.log("kicked: " + reason);
});

bot.on('message', function(jmes) {
  //console.log(jmes);
  newdate = new Date();
  ndf = format_date(newdate);
  try{
    jmes.extra.forEach(function(v, i, a){
     console.log(v.text);
     recognizePatterns(v.text, "", "message");
    });
    jmes.date = ndf;
    json_messages.data.push(jmes);
  }
  catch(e){}
  //console.log("\n");
});

bot.on('entitySwingArm', function(entity) {
  if(entity.type === "player"){
    //console.log("entity swinged arm");
    //console.log(entity);
    dst = (bot.entity.position.distanceTo(entity.position));
    //if(0){
    if(dst < 4){
      //calcurate the attack hit or not
      var mypos = new Vec3(bot.entity.position.x,
        bot.entity.position.y,
        bot.entity.position.z
      );
      var yourpos = new Vec3(entity.position.x,
        entity.position.y,
        entity.position.z
      );
      var lookat = pyr2vec(entity.pitch, entity.yaw, dst);
      var d = mypos.distanceTo(lookat.add(yourpos));
      if (d < 0.25){
        console.log("hit");
        if(chasing_user === entity.username){
          chasing_user = "noone";
          bot.clearControlStates();
        }
        else{
          chasing_user = entity.username;
          setTimeout(once_three_seconds, 200, []);
          bot.clearControlStates();
        }
      }
    }
  }
});

//look at neaby player
bot.on('entityMoved', function(entity) {
  if(entity.type === "player"){
    users[entity.username] = entity;
    //console.log("entity moved");
    //console.log(entity);
    dst = (bot.entity.position.distanceTo(entity.position));
    //console.log("d = " + dst);
    if(player_of_interest === entity.username && dst > 2){
      player_of_interst = "noone";
      dst_player_of_interest = 999;
    }

    if(dst < 2){
      var do_interact = false;
      if(player_of_interest === entity.username){
        dst_player_of_interest = dst;
        do_interact = true;
      }
      else if(dst < dst_player_of_interest){
        player_of_interest = entity.username;
        dst_player_of_interest = dst;
        do_interact = true;
      }

      //if(false){
      if(chasing_user ==="noone" && do_interact == true){
        //avoid too frequent motion
        var now = new Date();
	var dt = now - last_interact_time;
        //console.log("dt = " + dt);
        if(dt > 200){
          var mypos = new Vec3(bot.entity.position.x,
            bot.entity.position.y,
            bot.entity.position.z
          );
          dp = (mypos.subtract(entity.position));
          pyr = vec2pitch_yaw_radus(dp);
          if (Math.abs(pyr.yaw - bot.entity.yaw) > 0.05 ||
            Math.abs(pyr.pitch - bot.entity.pitch) > 0.05){
            //console.log("dyaw = " + Math.abs(pyr.yaw - bot.entity.yaw));
            bot.look(pyr.yaw, pyr.pitch, false, false);
            //bot.look(pyr.yaw, 0, false, false);
          }
          //bot.lookAt(entity.position, false, false);
          //mimic sneaking
          if (entity.metadata["0"] === 2){
            bot.setControlState("sneak", true);
            if(command_timer){
              clearTimeout(command_timer);
            }
            command_timer = setTimeout(function(){
               bot.clearControlStates();
            }, 500);
          }
          else{
            //bot.setControlState("sneak", false);
          }
          last_interact_time = now;
        }
      }
    }
  }
});

bot.on('chat', function(username, message, translate, jsonMsg, matches) {
  //if(username === bot.username) return;
  //bot.chat(message);
  console.log(message);
  recognizePatterns(message, username, "chat");
});
bot.on('whisper', function(username, message, translate, jsonMsg, matches) {
  //if(username === bot.username) return;
  //bot.chat(message);
  console.log(message);
  recognizePatterns(message, username, "whisper");
});

setTimeout(writeJson, 30, json_messages);
setTimeout(once_one_minute, 1000 * 2, []);
//setTimeout(once_three_seconds, 1000 * 2, []);

//bot.setControlState("sneak", true)

//--------- function definition ---------------------------------------------------
function once_three_seconds(){
  var entity = null;
  //console.log("chasing_user = " + chasing_user);
  //console.log(users);
  if( entity = users[chasing_user]){
    //console.log("chasing_user found");
    var mypos = new Vec3(bot.entity.position.x,
      bot.entity.position.y,
      bot.entity.position.z
    );
    var dp = (mypos.subtract(entity.position));
    var pyr = vec2pitch_yaw_radus(dp);
    if (Math.abs(pyr.yaw - bot.entity.yaw) > 0.05 ||
      Math.abs(pyr.pitch - bot.entity.pitch) > 0.05){
        //console.log("dyaw = " + Math.abs(pyr.yaw - bot.entity.yaw));
      //console.log("yaw = " + pyr.yaw);
      //console.log("pitch = " + pyr.pitch);
      //bot.look(pyr.yaw, pyr.pitch, false, false);
      bot.look(pyr.yaw, 0, false, false);
    }

    var dst = (bot.entity.position.distanceTo(entity.position));
    if(dst >= 2.0){
      bot.setControlState("swing", false);
      bot.setControlState("forward", true);
      bot.setControlState("back", false);

      //jump
      var mypos = new Vec3(bot.entity.position.x,
        bot.entity.position.y,
        bot.entity.position.z
      );
      var look_point = mypos.add(
        pyr2vec(bot.entity.pitch, bot.entity.yaw, 0.8)
      );
      //console.log("look = " + pyr2vec(bot.entity.pitch, bot.entity.yaw, 0.8));
      var block_front = bot.blockAt(look_point);
      var block_front_up = bot.blockAt(look_point.add(new Vec3 (0, 1, 0)));
      //console.log(block);
      if(block_front.boundingBox === "block" &&
        block_front_up.boundingBox === "empty"){
        bot.setControlState("jump", true);
      }
      else{
        bot.setControlState("jump", false);
      }
    }
    else{
      bot.clearControlStates();
      bot.setControlState("swing", true);
    }

    //bot.lookAt(entity.position, false, false);
    //mimic sneaking
    if (entity.metadata["0"] === 2){
      bot.setControlState("sneak", true);
      if(command_timer){
        clearTimeout(command_timer);
      }
      command_timer = setTimeout(function(){
         bot.clearControlStates();
      }, 500);
    }
    else{
      //bot.setControlState("sneak", false);
    }
  }
  if(chasing_user != "noone")
    setTimeout(once_three_seconds, 100, []);
}

function once_one_minute(){
  //reset player_of_interest
  player_of_interst = "noone";
  dst_player_of_interest = 999;
  //try omikuji
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

function recognizePatterns(txt, uname, type){
  if (uname === ""){
    if(m = txt.match(/.*?<(.*?)> (.*)/)){
      uname = m[1];
      txt = m[2]
    }
  }

  if(m = txt.match(/(.*?) whispers: (.*)/)){
    uname = m[1];
    txt = m[2];
    type = "whisper";
  }

  console.log("pr: " + txt + " by " + uname);
  //update last login user
  if(m = txt.match(/(.*?) joined the game/)){
    last_login_user = m[1];
    console.log("last_login_user = " + last_login_user);
  }
  //detects hi
  else if (m = txt.match(/(^hi$)|(^he$)|(^hey$)|(^ひ$)/i)){
    if(uname === last_login_user){
      setTimeout(function(){safechat('hi');}, 3000, []);
      //safechat('hi');
      last_login_user = "-----";
    }
  }

  else if(m = txt.match(/^きよし$/)){
    if (type != "whisper") {
      setTimeout(function(){safechat('フォン');}, 1000, []);
      //safechat('hi');
    }
  }

  //imgur
  //else if (m = txt.match(/http:\/\/i\.imgur\.com\/(.*)\.((png)|(jpg))/)){
  else if (m = txt.match(/http:\/\/(.*)\/(.*)\.((png)|(jpg)|(jpeg)|(gif))/)){
    var url = m[0]
    var img_name = m[2] + "." + m[3]
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
  else if(type === "whisper" ){
    if(m = txt.match(/^nezunezukun00 (.*)/)){
    console.log("command detected");
    var command = m[1].replace(/^\s*(.*?)\s*$/, "$1")
      .replace(/^\s+|\s+$/g,'').replace(/ +/g,' ');
    tokens = command.split(" ");
    if(command_timer){
      clearTimeout(command_timer);
    }
    command_timer = setTimeout(function(){
       bot.clearControlStates();
    }, 2000);
    console.log("command " + tokens[0]);
    console.log(command);
    switch(tokens[0]){
      case "stop":
      case "s":
        bot.clearControlStates();
        chasing_user = "noone";
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
      case "swing":
      case "sw":
        bot.setControlState("swing", true);
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
      case "block":
        var mypos = new Vec3(bot.entity.position.x,
          bot.entity.position.y,
          bot.entity.position.z
        );
        var look_point = mypos.add(
          pyr2vec(bot.entity.pitch, bot.entity.yaw, 0.8)
        );
        console.log("look = " + pyr2vec(bot.entity.pitch, bot.entity.yaw, 0.8));
        var block = bot.blockAt(look_point);
        console.log(block);
        break;
        case "chase":
          //var t1 = Number(tokens[1]);
          chasing_user = tokens[1];
          setTimeout(once_three_seconds, 200, []);
          break;
        default:
          console.log("unknown command " + okens[0]);
          break;
    }
  }
  }
}

//chat with limits
function safechat(txt){
  var now = new Date();
  var dt = now - last_chat_time;
  if(dt > 3000 && safe_chat_counter < 1000){
    last_chat_time = now;
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

function pyr2vec(p, y, r){
  return new Vec3(
    -r * Math.cos(p) * Math.sin(y),
    r * Math.sin(p),
    -r * Math.cos(p) * Math.cos(y)
  );
}

function vec2pitch_yaw_radus(v){
  if(v.x != 0.0){
    yaw = Math.atan2(v.x, v.z);
  }
  else{
    yaw = v.z >= 0 ? Math.PI / 2: -Math.PI / 2;
  }
  const groundDistance = Math.sqrt(v.x * v.x + v.z * v.z)
  pitch = Math.atan2(-v.y, groundDistance)
  radius = v.distanceTo(new Vec3(0, 0, 0))
  return {"pitch": pitch, "yaw": yaw, "radius": radius};
}

function interact(entity){

}
