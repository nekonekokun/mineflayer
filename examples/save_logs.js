/*
 * This is one of the simplest examples.
 *
 * We created a simple bot that echoes back everything that is said on chat.
 *
 * It's not very useful yet, but you can use this as a starting point
 * to create your own bot.
 */
var mineflayer = require('mineflayer');
var json_messages = {"data": []};
var date = new Date();
var format = 'YYYYMMDDhhmmss';
format = format.replace(/YYYY/g, date.getFullYear());
format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));

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

bot.on('connect', function() {
  console.log("connected");
});

bot.on('message', function(jmes) {
  //console.log(jmes);
  try{
    jmes.extra.forEach(function(v, i, a){
     console.log(v.text); 
    }); 
    json_messages.data.push(jmes);
  }
  catch(e){}
  //console.log("\n");
});

bot.on('chat', function(username, message, translate, jsonMsg, matches) {
  //if(username === bot.username) return;
  //bot.chat(message);
  console.log(message);
});

setTimeout(writeJson, 30, json_messages);

function writeJson(jdata){
  var fs = require("fs");
  console.log("write to " + './logs/' + format + ".json")
  fs.writeFile('./logs/' + format + ".json", JSON.stringify(jdata, undefined, 1));
  setTimeout(writeJson, 1000 * 60 * 60, json_messages);

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
  }
}
