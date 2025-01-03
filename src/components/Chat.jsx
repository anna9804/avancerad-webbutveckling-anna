import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import './Chat.css';

const Chat = () => {
  const loggedInUser = JSON.parse(localStorage.getItem('user')) || {};
  console.log("Logged In User:", loggedInUser);

  const [messages, setMessages] = useState([
    { id: 1, text: "Tja tja, hur mår du?", username: "Erik", userId: 1 },
    // { id: 2, text: "Hallå!! Svara då!!", username: "Anna", userId: 2 },
    { id: 3, text: "Sover du eller?!", username: "Erik", userId: 1 },
    // { id: 4, text: "Hej, allt bra med dig?", username: "Anna", userId: 2 },
    // { id: 5, text: "Ja, det är bara bra! Hur är det själv?", username: "Anna", userId: 2 },
    { id: 6, text: "Vad har du för planer för helgen?", username: "Erik", userId: 1 },
    { id: 7, text: "Jag tänkte kanske gå på bio.", username: "Erik", userId: 1 },
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("https://chatify-api.up.railway.app/messages?", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${loggedInUser.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setMessages(messages.concat(data));
            console.log("Fetched messages:", messages);
          }
        } else {
          setError("Failed to fetch messages.");
        }
      } catch (err) {
        setError("An error occurred while fetching messages.");
      }
    };

    if (loggedInUser.token) {
      fetchMessages();
    }
  }, [loggedInUser.token]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const sanitizedMessage = DOMPurify.sanitize(newMessage);
    const conversationId = "550e8400-e29b-41d4-a716-446655440000";

    const messagePayload = {
      text: sanitizedMessage,
      conversationId: conversationId,
    };

    try {
      const response = await fetch("https://chatify-api.up.railway.app/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${loggedInUser.token}`,
        },
        body: JSON.stringify(messagePayload),
      });

      if (response.ok) {
        const newMessageData = await response.json();
        const newMessage = {
          id: newMessageData.latestMessage.id,
          content: newMessageData.latestMessage.text,
          userId: loggedInUser.id,
          username: loggedInUser.username,
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setNewMessage('');
      } else {
        const errorDetails = await response.text();
        console.error("Send Message Error:", errorDetails);
        setError("Failed to send message. " + errorDetails);
      }
    } catch (err) {
      console.error("Error while sending message:", err);
      setError("An error occurred while sending the message.");
    }
  };

  const handleDeleteMessage = async (msgId) => {
    const messageToDelete = messages.find(msg => msg.id === msgId);

    if (!messageToDelete) {
      console.error("Message not found in local state:", msgId);
      setError("Message not found.");
      return;
    }

    if (messageToDelete.userId !== loggedInUser.id) {
      console.error("User ID mismatch. Cannot delete this message.");
      setError("You do not have permission to delete this message.");
      return;
    }

    try {
      const response = await fetch(`https://chatify-api.up.railway.app/messages/${msgId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${loggedInUser.token}`,
        },
      });

      if (response.ok) {
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== msgId));
      } else {
        const errorDetails = await response.text();
        console.error("Delete Message Error:", errorDetails);
        setError("Failed to delete message.");
      }
    } catch (err) {
      console.error("Error while deleting message:", err);
      setError("An error occurred while deleting the message.");
    }
  };

  return (
    <div className="chat-container">
      <div className="user-info">
        <img
          src={loggedInUser.avatar || 'https://api.multiavatar.com/seed3.svg'}
          alt="User Avatar"
          className="user-avatar"
        />
        <h3>{loggedInUser.username || 'Guest'}</h3>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.userId === loggedInUser.id ? 'message-right' : 'message-left'}`}
          >
            <div className="message-info">
              <span className="username">{message.username}</span>
            </div>
            <p className="message-content">{message.text}</p>
            {message.userId === loggedInUser.id && (
              <button className="delete-btn" onClick={() => handleDeleteMessage(message.id)}>
                Delete
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="new-message-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Chat;
