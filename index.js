// ./ngrok http 80
require('dotenv').config()

const app = require('express')()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const request = require('request')

const bodyParser = require('body-parser')

io.on('connection', function(socket){
  console.log('a user connected')

  socket.on('disconnect', function() {
    console.log('user disconnected')
  })

  socket.on('send_reply', function(reply) {
  	request({
	    uri: "https://graph.facebook.com/v2.6/me/messages",
	    qs: { "access_token": process.env.FB_PAGE_ACCESS_TOKN },
	    method: "POST",
	    json: reply
	  }, (err, res, body) => {
	    if (!err) {
	      console.log('message sent!')
	    } else {
	      console.error("Unable to send message:" + err);
	    }
	  })
  })
})

app.io = io

app.use(bodyParser.json())

app.get('/hook', (req, res) => {
	let VERIFY_TOKEN = process.env.FB_PAGE_ACCESS_TOKN
    
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED')
      res.status(200).send(challenge)
    } else {
      res.sendStatus(403)
    }
  }
})

app.post('/hook', (req, res) => {
  let body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(function(entry) {
      let event = entry.messaging[0]

      // If text message
      if(event.message !== undefined && !event.message.is_echo) 
      	req.app.io.emit('message', {sender_id: event.sender.id, chat_id: entry.id, payload: event.message})
    })

    res.status(200).send('EVENT_RECEIVED')

  } else {
    res.sendStatus(404);
  }

})

server.listen(process.env.APP_PORT, () => console.log('APP on PORT: ' + process.env.APP_PORT))