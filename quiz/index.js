/* jshint asi: true */
/* jshint esversion: 6 */

var server = require('http').createServer(),
    url = require('url'),
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ server: server }),
    express = require('express'),
    app = express(),
    QUESTIONS = require('./questions.json')

app.use(express.static('public'))

var currentAnswers = [], currentQuestion = QUESTIONS[0], currentQuestionNumber = 0
var scores = {};
wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received:', message, 'player', ws.playerName);
    var msg = JSON.parse(message)

    if(msg.type === 'JOIN') {
      if(scores[msg.name]) {
        ws.playerName = msg.name + Math.round(Math.random() * 100)
      } else {
        ws.playerName = msg.name
      }
      scores[ws.playerName] = 0

    } else if(msg.type === 'ANSWER') {
      if(msg.answer === currentQuestion.correct) {
        scores[ws.playerName]++
        ws.send(JSON.stringify({
          type: 'SCORE',
          score: scores[ws.playerName]
        }))
      }

    } else if(msg.type === 'ADMIN.NEXT') {
      if(currentQuestionNumber < 4) {
        currentQuestion = QUESTIONS[++currentQuestionNumber]

        wss.clients.forEach(function(client) {
          client.send(JSON.stringify({
            type: 'QUESTION',
            'question': currentQuestion.question,
            'answers': currentQuestion.answers
          }))
        })
      }

    } else if(msg.type === 'ADMIN.END') {
      var maxScore = 0, bestPlayerName = '', ranking = []
      for(var playerName of Object.keys(scores)) {
        ranking.push({
          name: playerName,
          score: scores[playerName]
        })
      }
      ranking.sort(function(a, b) { return a.score > b.score })
      ws.send(JSON.stringify({
        type: 'RANKING',
        ranking: ranking.slice(0, 10)
      }))
    } else if(msg.type === 'ADMIN.RESET') {
      scores = {}
      currentQuestionNumber = 0
      currentQuestion = QUESTIONS[0]
    }
  })

  ws.send(JSON.stringify({
    'type': 'QUESTION',
    'question': currentQuestion.question,
    'answers': currentQuestion.answers
  }))
})

server.on('request', app)
server.listen(process.env.PORT || 3000, function () { console.log('Listening on ' + server.address().port) })
