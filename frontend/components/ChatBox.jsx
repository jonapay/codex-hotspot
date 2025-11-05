import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

export default function ChatBox({ serverUrl, room, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!room) return;
    const socket = io(serverUrl, { autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('joinRoom', { room, userId: user.id });
    });

    socket.on('history', (history) => {
      setMessages(history);
    });

    socket.on('message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('system', (evt) => {
      setMessages((prev) => [
        ...prev,
        {
          _id: `${Date.now()}-${evt.type}`,
          type: 'system',
          content: `${evt.userId} ${evt.type}s the room`,
          createdAt: new Date().toISOString(),
        },
      ]);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.emit('leaveRoom', { room, userId: user.id });
      socket.disconnect();
    };
  }, [room, serverUrl, user]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socketRef.current.emit('message', {
      room,
      senderId: user.id,
      content: input,
      type: 'text',
    });
    setInput('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <div className="chat-box">
      <header>
        <h3>Live Chat</h3>
        <span className={connected ? 'status online' : 'status offline'}>
          {connected ? 'Online' : 'Offline'}
        </span>
      </header>
      <div className="messages" ref={listRef}>
        {messages.map((message) => (
          <div key={message._id || message.createdAt} className={`message message-${message.type || 'text'}`}>
            {message.type !== 'system' && (
              <strong>{message.sender?.username || user.username}</strong>
            )}
            <span>{message.content}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="chat-input">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type a message"
          disabled={!connected}
        />
        <button type="submit" disabled={!connected || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
