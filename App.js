import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('General');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const messageEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('message', (data) => {
        setMessages(prev => [...prev, data]);
      });

      socket.on('roomUsers', (data) => {
        setUsers(data.users);
      });

      socket.on('typing', (data) => {
        if (data.isTyping) {
          setTypingUsers(prev => [...new Set([...prev, data.username])]);
        } else {
          setTypingUsers(prev => prev.filter(user => user !== data.username));
        }
      });
    }
  }, [socket]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const joinRoom = () => {
    if (username && room) {
      socket.emit('join', { username, room });
      setIsLoggedIn(true);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message && socket) {
      socket.emit('sendMessage', {
        username,
        text: message,
        room
      });
      setMessage('');
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    
    if (socket) {
      if (e.target.value.length > 0) {
        socket.emit('typing', { username, room, isTyping: true });
      } else {
        socket.emit('typing', { username, room, isTyping: false });
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h2>Join Chat</h2>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <select value={room} onChange={(e) => setRoom(e.target.value)}>
            <option value="General">General</option>
            <option value="Technology">Technology</option>
            <option value="Gaming">Gaming</option>
          </select>
          <button onClick={joinRoom}>Join</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <h3>{room} Room</h3>
        <h4>Users</h4>
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </div>
      
      <div className="chat-main">
        <div className="chat-header">
          <h2>{room} Chat</h2>
        </div>
        
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className="message">
              <span className="message-time">{msg.time}</span>
              <span className="message-username">{msg.username}:</span>
              <span className="message-text">{msg.text}</span>
            </div>
          ))}
          
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
          
          <div ref={messageEndRef} />
        </div>
        
        <form className="chat-form" onSubmit={sendMessage}>
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={handleTyping}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default App;
