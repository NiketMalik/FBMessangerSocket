import React, { Component } from 'react'
import io from 'socket.io-client'

const socket = io('http://localhost:3000')

const FB_PAGE_ACCESS_TOKN = 'EAADSapbAfGUBAD9XR5t4IPQUQlItwfoldN4hhUhI7WKowVjpTvxq2xUjzBafIkXZAfOiBDEeaZBqti2ifi1tws2avwD3ef7zhyEFCIR7iGuDalKw3JZAYgiJFYP87Mve7LtFaLNGm4A8sQmAIiIdVJnIhruZAvmViQVUD8FvegZDZD'
class App extends Component {
	constructor(props) {
		super(props)

		this.state = {
			chats: {
				1699099343535897: {
					user: [],
					sent: [],
					replies: [],
					log: []
				}
			},
			activeChat: 1699099343535897
		}
	}

	async getUser(sender_id) {
		let userdata = false
		await fetch(`https://graph.facebook.com/${sender_id}?fields=first_name,last_name,profile_pic&access_token=${FB_PAGE_ACCESS_TOKN}`)
		.then(res => res.json())
		.then(body => {
			userdata = body
		})

		return userdata
	}

	async handleUserMessage(data) {
		const {
				sender_id,
				payload
			} = data

			let chatData = this.state.chats

			chatData[sender_id] = {
				...chatData[sender_id],
				sent: [...chatData[sender_id].sent, payload],
				log: [...chatData[sender_id].log, {...payload, type: 'sent', timestamp: new Date().getTime()}]
			}

			if(chatData[sender_id].user.id === undefined)
				chatData[sender_id].user = await this.getUser(sender_id)

			this.setState({
				chats: chatData
			})
	}

	async sendReply() {
		let sender_id = this.state.activeChat
	  let payload = {
	  	text: this.refs.agent_reply.value
	  }

		let reply = {
	    recipient: {
	      id: sender_id
	    },
	    message: payload
	  }

		socket.emit('send_reply', reply)
		this.refs.agent_reply.value = ''

		let chatData = this.state.chats

		chatData[sender_id] = {
			...chatData[sender_id],
			replies: [...chatData[sender_id].replies, payload],
			log: [...chatData[sender_id].log, {...payload, type: 'replies', timestamp: new Date().getTime()}]
		}

		if(chatData[sender_id].user.id === undefined)
				chatData[sender_id].user = await this.getUser(sender_id)

		this.setState({
			chats: chatData
		})
	}

	componentDidMount() {
		socket.on('message', data => {
			this.handleUserMessage(data)
		})
	}

  render() {
  	const userChat = this.state.chats[this.state.activeChat]
    return (
      <div id="frame">
      	<div id="sidepanel">
        	<div id="profile">
        	</div>
        </div>

        <div className="content">
	        <div className="contact-profile">
	          <img src={userChat.user.profile_pic} alt={userChat.user.first_name} />
	          <p>{userChat.user.first_name} {userChat.user.last_name}</p>
	        </div>
	        <div className="messages">
	          <ul>
	          	{
	          		userChat.log.map((ele, k) => {
	          			return (
	          				<li className={ele.type} key={this.state.activeChat + ele.timestamp + k}>
				              <img src={ele.type === 'sent' ? userChat.user.profile_pic : "http://emilcarlsson.se/assets/mikeross.png"} alt="" />
				              <p>{ele.text}</p>
				            </li>
	          			)
	          		})
	          	}
	          </ul>
	        </div>
	        <div className="message-input">
	          <div className="wrap">
	          	<form onSubmit={(e) => {e.stopPropagation(); e.preventDefault(); this.sendReply()}}>
			          <input type="text" placeholder="Write your message..." ref="agent_reply" />
			          {/*<i className="fa fa-paperclip attachment" aria-hidden="true"></i>*/}
			          <button className="submit"><i className="fa fa-paper-plane" aria-hidden="true"></i></button>
			        </form>
	          </div>
	        </div>
	      </div>
      </div>
    )
  }
}

export default App