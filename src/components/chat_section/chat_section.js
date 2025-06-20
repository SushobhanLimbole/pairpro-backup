import { useEffect, useState } from 'react';
import styles from './chat_section.module.css';
import { FaTimes } from 'react-icons/fa';
import { socket } from '../../socket';

export default function ChatSection({ handleChat, roomId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    setMyId(socket.id); // Get user's own socket ID

    // 1. Load chat history
    socket.on('chat-history', (history) => {
      const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
      setMessages(sorted);
    });

    // 2. Live message receive
    socket.on('receive-message', (message) => {
      setMessages((prev) => {
        const newMessages = [...prev, message];
        return newMessages.sort((a, b) => a.timestamp - b.timestamp);
      });
    });

    return () => {
      socket.off('chat-history');
      socket.off('receive-message');
    };
  }, []);

  const sendMessage = () => {
    if (input.trim() === '') return;

    const message = {
      text: input,
      senderId: socket.id,
      timestamp: Date.now()
    };

    // Show message immediately in UI
    setMessages((prev) => {
      const newMessages = [...prev, message];
      return newMessages.sort((a, b) => a.timestamp - b.timestamp);
    });

    // Send to server
    socket.emit('send-message', { roomId, message });

    setInput('');
  };

  return (
    <div className={styles.chatSection}>
      <div className={styles.chatHeader}>
        <span>Chat</span>
        <FaTimes
          className={styles.closeIcon}
          onClick={handleChat}
          title="Close chat"
        />
      </div>

      <div className={styles.messageList}>
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === myId;
          return (
            <div
              key={idx}
              className={`${styles.message} ${isMe ? styles.sent : styles.received}`}
              title={new Date(msg.timestamp).toLocaleTimeString()}
            >
              {msg.text}
            </div>
          );
        })}
      </div>

      <div className={styles.inputContainer}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className={styles.input}
        />
        <button onClick={sendMessage} className={styles.sendButton}>Send</button>
      </div>
    </div>
  );
}
