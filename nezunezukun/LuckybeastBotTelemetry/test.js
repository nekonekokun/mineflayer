var mineflayer = require("mineflayer");

// ラッキービーストを初期化
var luckybeast = require("./")(mineflayer);

// Minecraft Bot
var server = process.argv[2].split(":");
var serverName = server[0];
var port = server.length >= 2 ? server[1] : "25565";
var mailAddress = process.argv[3];
var password = process.argv[4] || null;
var bot = mineflayer.createBot({
    host: serverName,
    port: port,
    username: mailAddress,
    password: password,
    verbose: true
});

// ラッキービーストを起動
luckybeast(bot);