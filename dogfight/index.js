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
    var msg = JSON.parse(message)
    switch(msg.type) {
      case 'JOIN':
        if(scores[msg.name]) {
          ws.playerName = msg.name + Math.round(Math.random() * 100)
        } else {
          ws.playerName = msg.name
        }
        scores[ws.playerName] = 0
      break
      case 'POSITION':
        wss.clients.forEach(function(sock) {
          if(sock.playerName === ws.playerName) return
          sock.send(msg)
        })
      break
      case 'SCORE':
        scores[ws.playerName]++;
        wss.clients.forEach(function(sock) {
          sock.send(msg)
          sock.send(JSON.stringify({
            type: 'GOALPOSITION',
            position: [ Math.random() * 1000 - 500, Math.random() * 100 + 50, Math.random() * 1000 - 500 ]
          }))
        })
      break
      case 'ADMIN.END':
        wss.clients.forEach(function(sock) {
          sock.send(msg)
        })
      break
    }
  })

})

server.on('request', app)
server.listen(process.env.PORT || 3000, function () { console.log('Listening on ' + server.address().port) })
