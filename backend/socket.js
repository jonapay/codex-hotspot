const { Server } = require('socket.io');
const Message = require('./models/Message');

function registerSocketServer(httpServer, options = {}) {
  const io = new Server(httpServer, {
    cors: { origin: options.corsOrigin || '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    socket.on('joinRoom', async ({ room, userId }) => {
      if (!room) return;

      socket.join(room);
      socket.to(room).emit('system', { type: 'join', userId });

      if (options.loadHistory !== false) {
        const history = await Message.find({ room })
          .sort('-createdAt')
          .limit(options.historyLimit || 50)
          .sort('createdAt')
          .populate('sender', 'username avatarUrl');
        socket.emit('history', history);
      }
    });

    socket.on('leaveRoom', ({ room, userId }) => {
      if (!room) return;
      socket.leave(room);
      socket.to(room).emit('system', { type: 'leave', userId });
    });

    socket.on('message', async ({ room, senderId, content, type = 'text', mediaUrl }) => {
      if (!room || !senderId || (!content && !mediaUrl)) {
        return;
      }

      const message = await Message.create({
        room,
        sender: senderId,
        content,
        type,
        mediaUrl,
      });

      const populated = await message.populate('sender', 'username avatarUrl');
      io.to(room).emit('message', populated);
    });

    socket.on('disconnecting', () => {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id);
      rooms.forEach((room) => {
        socket.to(room).emit('system', { type: 'disconnect', userId: socket.id });
      });
    });
  });

  return io;
}

module.exports = registerSocketServer;
