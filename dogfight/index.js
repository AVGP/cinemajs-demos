/* jshint asi: true */
/* jshint esversion: 6 */

var server = require('http').createServer(),
    url = require('url'),
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ server: server }),
    express = require('express'),
    app = express()

app.use(express.static('public'))

var scores = {};
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received:', message, 'player', ws.playerName);
  })

})

server.on('request', app)
server.listen(process.env.PORT || 3000, function () { console.log('Listening on ' + server.address().port) })
