module.exports = inject;
//module.exports.onMessageReceived = onMessageReceived;

function inject(bot)
{
    var line = {
        bot: bot,

        lines: [],
        lastModifiedTime: null,

        getNewLines: function(lastModifiedTime)
        {
            //console.log("this.lines");
            //console.log(this.lines);
            if(lastModifiedTime != null)
            {
                var returns = new Array(0);

                for(i = 0; i < this.lines.length;i++)
                {
                    var line = this.lines[i];
                    if(line.receivedTime.getTime() > lastModifiedTime.getTime())
                    {
                        returns.push(line);
                    }
                }

                // console.log(line.text + ": " + line.receivedTime + " > " + lastModifiedTime);

                return returns;
            }
            else
            {
                return this.lines;
            }
        },

        create: function(message)
        {
            this.bot.chat(message);
        },

        onMessageReceived: function(msg)
        {
            //console.log("onMessageReceived: " + msg);

            if(typeof(msg) == "string") {
              msg = {text: msg};
            }

            var line = this.makeLineViewModel(msg, new Date());
            if(line.text != undefined) this.lines.push(line);
        },

        makeLineViewModel: function(msg, receivedTime)
        {
            var vm = new Object();
            vm.receivedTime = receivedTime;
            vm.text = msg.text;
            vm.inlines = new Array(0);

            var inlines = [];

             if("extra" in msg) {
              inlines = msg.extra;

              for(var i = 0; i < inlines.length; i++)
              {
                  vm.inlines.push(this.makeLineViewModel(inlines[i]));
                  vm.text += inlines[i].text;
              }
            }
            //console.log(vm)
            return vm;;
        }
    };

    // イベント ハンドリング
    line.bot.on("message", (function(msg){ line.onMessageReceived(msg); }).bind(line));

    return line;
}
