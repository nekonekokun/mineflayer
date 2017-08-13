var fs = require("fs");
var Vec3 = require('vec3').Vec3;

exports.recognizePatterns = recognizePatterns;

function recognizePatterns(bot, txt, uname, type){
  rtn = {
    txt: "",
    delay: -1,
    last_login_user: '',
    chasing_user: ''
  };
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
    last_login_user = '',
    chasing_user = ''
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
      rtn.last_login_user = "-----";
    }
  }

  else if(m = txt.match(/^きよし$/)){
    if (type != "whisper") {
      //setTimeout(function(){safechat('$B%U%)%s(B');}, 1000, []);
      rtn.txt = 'フォン';
      rtn.delay = 1000;
      //safechat('hi');
    }
  }
  else if(m = txt.match(/(^毛根)|(^もうこん)/)){
    if (type != "whisper") {
      //setTimeout(function(){safechat('$B$^$?H1$NOC$7$F$k(B');}, 1000, []);
      rtn.txt = 'また髪の話してる';
      rtn.delay = 1000;
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
    if(m = txt.match(/^((nezunezukun00)|(!)) (.*)/)){
    console.log("command detected");
    var command = m[4].replace(/^\s*(.*?)\s*$/, "$1")
      .replace(/^\s+|\s+$/g,'').replace(/ +/g,' ');
    tokens = command.split(" ");
    if(bot.command_timer){
      clearTimeout(bot.command_timer);
    }
    bot.command_timer = setTimeout(function(){
       bot.clearControlStates();
    }, 2000);
    console.log("command " + tokens[0]);
    console.log(command);
    var output = "";
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
      case "block_bottom":
        var mypos = new Vec3(bot.entity.position.x,
          bot.entity.position.y,
          bot.entity.position.z
        );
        var look_point = mypos.add(
          new Vec3(0, -0.5, 0)
        );
        console.log("bottom = " + look_point);
        var block = bot.blockAt(look_point);
        console.log(block);
        break;
      case "chase":
        //var t1 = Number(tokens[1]);
        rtn.chasing_user = chasing_user = tokens[1];
        //setTimeout(once_three_seconds, 200, []);
        break;
      case "inventory":
        var items = bot.inventory.items();
        output = items.map(itemToString).join(', ');
        console.log(output);
        break;
      case "equip":
        var items = bot.inventory.items();
        output = items.map(itemToString).join(', ');
        var count = 1;
        items.forEach(function(v, i, a){
          try{
            //console.log(v);
            if(m = v.name.match(/helmet$/)){
              setTimeout(() => {bot.equip(v, "head");}, count * 500);
              count += 1;
            }
            else if(m = v.name.match(/chestplate$/)){
              setTimeout(() => {bot.equip(v, "torso");}, count * 500);
              count += 1;
            }
            else if(m = v.name.match(/boots$/)){
              setTimeout(() => {bot.equip(v, "feet");}, count * 500);
              count += 1;
            }
            else if(m = v.name.match(/sword$/)){
              setTimeout(() => {bot.equip(v, "hand");}, count * 500);
              count += 1;
            }
          }
          catch(e){}

        });
        console.log(output);
        break;
      case "unequip":
        try{
          setTimeout(() => {unequip(bot, 'head');}, 500);
          setTimeout(() => {unequip(bot, 'torso');}, 1000);
          setTimeout(() => {unequip(bot, 'feet');}, 1500);
          setTimeout(() => {unequip(bot, 'hand');}, 2000);
        }
        catch(e){}
        break;
      case "glass_pane":
        bot.physics.glass_pane_is_block = ! bot.physics.glass_pane_is_block;
        console.log("glass_pane_is_block = " + bot.physics.glass_pane_is_block);
        break;
      case "me":
        console.log(bot.entity);
        break;
      default:
        console.log("unknown command " + tokens[0]);
        break;
    }
  }
  }
  return rtn;
}

function unequip(bot, dst){
    bot.unequip(dst, (err) =>{
      if (err) {
          console.log(`cannot unequip: ${err.message}`);
        setTimeout(() => {unequip(bot, dst);}, 300);
      } else {
          console.log(dst + ' unequipped')
      }
    });
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

function itemToString (item) {
  if (item) {
    return `${item.name} x ${item.count}`
  } else {
    return '(nothing)'
  }
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
