/*
 * RC player by nekonekokun 2017/07/07
 *
  */
//globals
var mineflayer = require('../../mineflayer');
var fs = require("fs");
var request = require('request');
var Vec3 = require('vec3').Vec3;

var pr = require('./chat_patterns');
var eat = require('./eat');
var luckybeast = require('./LuckybeastBotTelemetry')(mineflayer);
var line = 0;

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
  bot.last_pos = 0;
  bot.pitch_last = 0;
  bot.command_timer = 0;
  bot.interact_timer = 0;
  bot.last_login_user = "noone";
  bot.player_of_interest = "noone";
  bot.dst_player_of_interest = 9999;
  bot.chasing_user = "noone";
  bot.fighting_enemy = false;
  bot.dst_fighting_enemy = 99999;
  luckybeast(bot);
  //line = require("./LuckybeastBotTelemetry/line.js")(bot);
}
catch(e){
  console.log(e)
}

// register event handlers -----------------------------------------------------
bot.on('connect', function() {
  console.log("connected");
  bot.last_pos = false;
});

bot.on('death', function() {
  console.log("dead");
  bot.clearControlStates();
});

bot.on('health', function() {
  console.log("health = " + bot.health.toString() +
    ", food = " + bot.food.toString());
  if(bot.health <=16 && bot.food < 19)
  {
    eat.start_eat(bot);
  }
  else {
    eat.end_eat(bot);
  }
});


bot.on('food', function() {
  iconsole.log("health = " + bot.health.toString() +
    ", food = " + bot.food.toString());
  if(bot.health <=16 && bot.food < 19)
  {
    eat.start_eat(bot);
  }
  else {
    eat.end_eat(bot);
  }
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
      //recognizePatterns(v.text, "", "message");
      recognizePatterns(v.text, "", "message");
    });
    jmes.date = ndf;
    json_messages.data.push(jmes);
    bot.lbline.onMessageReceived(jmes);
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

bot.on('entityGone', function(entity) {
  //console.log(entity);
  //console.log(entity.displayName + " is gone");
  if(entity === bot.fighting_enemy){
    console.log("fighting emeny " + entity.displayName + " is gone");
    bot.fighting_enemy = false;
    bot.setControlState("forward", false);
    bot.setControlState("back", false);
    bot.setControlState("swing", false);
  }
});

//look at neaby player
bot.on('entityMoved', function(entity) {
  if(entity.type === "mob")
  {
    //fight
    var dst = (bot.entity.position.distanceTo(entity.position));
    if (entity === bot.fighting_enemy){
      bot.dst_fighting_enemy = dst;
      if (dst >= 10){
        bot.fighting_enemy = false;
      }
    }
    if(dst < 10){
      console.log(entity);
    }
    if(entity.mobType == "Zombie")
    {
      bot.fighting_enemy = entity;
      //jump
      var mypos = new Vec3(bot.entity.position.x,
        bot.entity.position.y,
        bot.entity.position.z
      );
      var look_point = mypos.plus(
        pyr2vec(bot.entity.pitch, bot.entity.yaw, 0.8)
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
      //console.log("look = " + pyr2vec(bot.entity.pitch, bot.entity.yaw, 0.8));
      var block_in = bot.blockAt(mypos);
      var block_front = bot.blockAt(look_point);
      var block_front_up = bot.blockAt(look_point.add(new Vec3 (0, 1, 0)));
      if (dst < 3)
      {
        bot.setControlState("swing", false);
        if(bot.last_pos && checkRaechable(bot.last_pos, entity))
        {
          bot.attack(entity);
          bot.setControlState("swing", true);
        }
        bot.setControlState("forward", false);
        bot.setControlState("back", true);
      }
      else
      {
        bot.setControlState("swing", false);
        if (dst < 10){
          bot.setControlState("forward", true);
          bot.setControlState("back", false);
        }
        else{
          bot.setControlState("forward", false);
          bot.setControlState("back", false);
          bot.setControlState("swing", false);
        }
      }
    }
  }
  else if(entity.type === "player"){
    users[entity.username] = entity;
    //console.log("entity moved");
    //console.log(entity);
    dst = (bot.entity.position.distanceTo(entity.position));
    //console.log("d = " + dst);
    if(player_of_interest === entity.username && dst > 2){
      player_of_interst = "noone";
      dst_player_of_interest = 999;
    }

    //being pushed
    if(dst < 0.8){
      var mypos = new Vec3(bot.entity.position.x,
        0,
        bot.entity.position.z
      );
      var yourpos = new Vec3(entity.position.x,
        0,
        entity.position.z
      );
      mypos.subtract(yourpos);
      mypos = mypos.scaled(60);
      //console.log("pushed");
      //console.log(mypos);
      bot.entity.velocity.add(mypos);
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
  //console.log(bot.lbline);
  bot.lbline.onMessageReceived('<' + username + '> ' + message);

  //pr.recognizePatterns(bot, message, username, "chat");
});
bot.on('whisper', function(username, message, translate, jsonMsg, matches) {
  //if(username === bot.username) return;
  //bot.chat(message);
  console.log(message);
  //pr.recognizePatterns(bot, message, username, "whisper");
  recognizePatterns(message, username, "whisper");
  bot.lbline.onMessageReceived(username + 'whispered: ' + message);

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

  //chase player
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
      var look_point = mypos.plus(
        pyr2vec(bot.entity.pitch, bot.entity.yaw, 0.8)
      );
      //console.log("look = " + pyr2vec(bot.entity.pitch, bot.entity.yaw, 0.8));
      var block_in = bot.blockAt(mypos);
      var block_front = bot.blockAt(look_point);
      var block_front_up = bot.blockAt(look_point.add(new Vec3 (0, 1, 0)));
      //console.log(block);
      if((block_front && block_front.boundingBox === "block" ||
        block_front && block_front.boundingBox === "glass_pane" ||
        block_front && block_front.boundingBox === "cauldon" ) &&
        block_front_up && block_front_up.boundingBox === "empty"){ //climbing
        bot.setControlState("jump", true);
      }
      else if(block_in && block_in.boundingBox === "cauldon") // go out of cauldons
      {
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
    format = format_date(date);
    json_messages = {"data": []};

    safe_chat_counter = 0; //allow chat again
  }
}

function recognizePatterns(text, user, type){
  var data = pr.recognizePatterns(bot, text, user, type)
  if(data.txt.length >= 1 && data.delay >= 0){
    setTimeout(function(){safechat(data.txt);}, data.delay, []);
  }
  if(data.last_login_user.length > 0){
    last_login_user = data.last_login_user;
  }
  if(data.chasing_user.length > 0){
    chasing_user = data.chasing_user;
    setTimeout(once_three_seconds, 200, []);
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

function checkRaechable(me, you)
{
  var mypos = new Vec3(me.position.x,
    me.position.y,
    me.position.z
  );
  var yourpos = new Vec3(you.position.x,
    you.position.y,
    you.position.z
  );
  var dst = (mypos.distanceTo(yourpos));
  var lookat = pyr2vec(me.pitch, me.yaw, dst);
  var d = yourpos.distanceTo(lookat.plus(mypos));
  return d <= 0.3;
}

function interact(entity){

}
