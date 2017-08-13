// Luckybeast Bot Telemetry

module.exports = initialize;

function initialize(mineflayer)
{
    return inject;
}

function inject(bot, options)
{
	console.log("LuckyBeast Bot テレメトリ起動開始...");
    options = options || {};
    var http = require("http");
    var url = require("url");
    var qs = require("querystring");
    var line = require("./line.js")(bot);
    //module.exports.line = line;
    var entity = require("./entity.js")(bot);
    var serverName = options.server || "localhost";
    var port = options.port || "8080";

    // インターフェース
    var server = http.createServer(function(request, response)
    {
        var parsedUrl = url.parse(request.url, true);

        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST");
        response.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
        response.setHeader("Access-Control-Allow-Credentials", true);

        try
        {
            if(matches = parsedUrl.path.match(/\/lines\/(\w+)\//))
            {
                var command = matches[1];

                if(request.method == "GET" && command == "new")
                {
                    response.writeHead(200, {"Content-Type": "application/json; charset=UTF-8"});
                    var lastModifiedTime = ("lastModifiedTime" in parsedUrl.query) ? new Date(parseInt(parsedUrl.query.lastModifiedTime)) : null;
                    response.end(JSON.stringify(line.getNewLines(lastModifiedTime)));
                }
                else if(request.method == "POST" && command == "create")
                {
                    var body = "";

                    // POST リクエストの内容を受信
                    request.addListener("data", (function(chunk)
                    {
                        body += chunk;
                    }).bind(this));

                    // 受信完了
                    request.addListener("end", (function()
                    {
                        var post = qs.parse(body);
                        line.create(post.message);
                    }).bind(this));

                    response.writeHead(200, {"Content-Type": "application/json; charset=UTF-8"});
                    response.end();
                }
                else
                {
                    // throw new Error("Invalid Command: " + command);
                }
            }
            else if(matches = parsedUrl.path.match(/\/terrains\/(\w+)\//))
            {
                var command = matches[1];

                response.writeHead(404, {"Content-Type": "application/json; charset=UTF-8"});
                response.end();
            }
            else if(matches = parsedUrl.path.match(/\/entities\/(\w+)\//))
            {
                var command = matches[1];

                if(request.method == "GET" && command == "all")
                {
                    response.writeHead(200, {"Content-Type": "application/json; charset=UTF-8"});
                    response.end(JSON.stringify(entity.get()));
                }
            }
            else
            {
                response.writeHead(404);
                response.end();
            }
        }
        catch(ex)
        {
            console.log(ex);
            response.writeHead(500);
            response.end();
        }
    });
    server.listen(port);

    bot.lbline = line;

    console.log("LuckyBeast Bot テレメトリ起動完了: " + serverName + ":" + port);
}
