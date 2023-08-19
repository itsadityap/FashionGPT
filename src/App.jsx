import { useEffect, useState } from 'react'
import './App.css'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator } from '@chatscope/chat-ui-kit-react';

const API_KEY = import.meta.env.VITE_OPENAI_KEY;

const systemMessage = {
  "role": "system", "content": "Assume that you are a fashion Expert and updated with the latest trends. You are a fashion stylist and you are helping a client to choose for various occasions. You are chatting with the client to understand her requirements and to suggest a dress for him/her. You must also ask him/her for their fashion preferences before suggesting them their looks. Also give answers only in list of points. Don't just give direct answers ask for more clarity about person's likes or dislike and also ask them their gender and budget if they do not give any information about it also ask them about their age and occasion for which they want to dress up. If location is provided then also include it in your decision making. Make sure you don't response with more than 2 paragraphs. Suggest outfits "
}

function App() {
  const [messages, setMessages] = useState([
    {
      message: "Hello, I'm FashionGPT! Ask me anything!",
      sentTime: "just now",
      sender: "FashionGPT"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendFirstMessage = async (location) => {
    const newMessage = {
      message: `I am from ${location}. I will ask you some question for my fashion choices. Can you help me based on my location?`,
      direction: 'outgoing',
      sender: "user"
    };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setIsTyping(true);
    await processMessageToFashionGPT(newMessages);
  }

  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          let latitude, longitude;
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;

          let myLocation = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GMAPS_API_KEY}`);
          myLocation = await myLocation.json();
          sendFirstMessage(myLocation.results[myLocation.results.length - 2].formatted_address);
        });
      }
    }
    getLocation();
  }, []);

  const handleSend = async (message) => {
    const newMessage = {
      message,
      direction: 'outgoing',
      sender: "user"
    };

    const newMessages = [...messages, newMessage];
    
    setMessages(newMessages);
    setIsTyping(true);
    await processMessageToFashionGPT(newMessages);
  };

  async function processMessageToFashionGPT(chatMessages) {
    let apiMessages = chatMessages.map((messageObject) => {
      let role = "";
      if (messageObject.sender === "FashionGPT") {
        role = "assistant";
      } else {
        role = "user";
      }
      return { role: role, content: messageObject.message}
    });

    const apiRequestBody = {
      "model": "gpt-3.5-turbo",
      "messages": [
        systemMessage,
        ...apiMessages
      ]
    }

    await fetch("https://api.openai.com/v1/chat/completions", 
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiRequestBody)
    }).then((data) => {
      return data.json();
    }).then((data) => {
      console.log(data, 'data');
      setMessages([...chatMessages, {
        message: data.choices[0].message.content,
        sender: "FashionGPT"
      }]);
      setIsTyping(false);
    });
  }

  return (
    <div className="App">
      <div style={{ position:"relative", height: "750px", width: "650px"  }}>
        <MainContainer>
          <ChatContainer
          >       
            <MessageList 
              scrollBehavior="smooth" 
              typingIndicator={isTyping ? <TypingIndicator content="FashionGPT is typing" /> : null}
            >
              {messages.map((message, i) => {
                return <Message key={i} model={message} />
              })}
            </MessageList>
            <MessageInput placeholder="Type message here" onSend={handleSend} />        
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  )
}

export default App
