# Luckybeast Bot Telemetry

## 自分のプロジェクトにモジュールとして組み込む

自分のプロジェクト フォルダの中に Luckybeast Bot Telemetry を配置し、test.js を参考に自分のプロジェクトに次の 2 つのコードを追加する。

`var luckybeast = require(path)(mineflayer);`

* path: Luckybeast Bot Telemetry を配置したフォルダのパス。  
* mineflayer: Mineflayer モジュール オブジェクト。

`luckybeast(bot);`

* bot: mineflayer.createBot() が返す Bot オブジェクト。


## とりあえず動かす

コマンド node test HOST[:PORT] MAILADDRESS [PASSWORD]
