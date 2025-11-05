const { Server } = require('socket.io');

function createWebRTCServer(httpServer, options = {}) {
  const io = new Server(httpServer, {
    cors: { origin: options.corsOrigin || '*', methods: ['GET', 'POST'] },
  });

  const activeUsers = new Map();

  function findMatch(request) {
    const candidates = [...activeUsers.values()].filter((user) => {
      if (request.userId === user.userId) return false;
      if (request.preferences.languages?.length) {
        const intersection = user.languages.filter((lang) => request.preferences.languages.includes(lang));
        if (!intersection.length) return false;
      }
      if (request.preferences.interests?.length) {
        const match = user.interests.some((interest) => request.preferences.interests.includes(interest));
        if (!match) return false;
      }
      if (request.preferences.minAge && user.age && user.age < request.preferences.minAge) return false;
      if (request.preferences.maxAge && user.age && user.age > request.preferences.maxAge) return false;
      return true;
    });

    if (!candidates.length) {
      return null;
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  io.on('connection', (socket) => {
    socket.on('register', (payload) => {
      const { userId, age, languages = [], interests = [] } = payload;
      activeUsers.set(socket.id, {
        socketId: socket.id,
        userId,
        age,
        languages,
        interests,
      });
    });

    socket.on('match', (preferences) => {
      const request = {
        socketId: socket.id,
        userId: preferences.userId,
        preferences,
      };
      const candidate = findMatch(request);
      if (!candidate) {
        socket.emit('match:waiting');
        return;
      }

      socket.emit('match:found', { partnerId: candidate.socketId, userId: candidate.userId });
      io.to(candidate.socketId).emit('match:found', { partnerId: socket.id, userId: request.userId });
    });

    socket.on('signal', ({ partnerId, data }) => {
      if (!partnerId) return;
      io.to(partnerId).emit('signal', { partnerId: socket.id, data });
    });

    socket.on('disconnect', () => {
      activeUsers.delete(socket.id);
    });
  });

  return io;
}

module.exports = createWebRTCServer;
