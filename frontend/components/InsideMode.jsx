import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

export default function InsideMode({ signalingUrl, user }) {
  const [status, setStatus] = useState('idle');
  const [partner, setPartner] = useState(null);
  const [error, setError] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const connectionRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(signalingUrl, { autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('register', {
        userId: user.id,
        age: user.age,
        languages: user.languages,
        interests: user.interests,
      });
      setStatus('connected');
    });

    socket.on('match:waiting', () => setStatus('waiting'));
    socket.on('match:found', ({ partnerId, userId }) => {
      setStatus('matched');
      setPartner({ socketId: partnerId, userId });
      createPeerConnection(partnerId, true);
    });

    socket.on('signal', async ({ partnerId, data }) => {
      if (!connectionRef.current) {
        createPeerConnection(partnerId, false);
      }
      const pc = connectionRef.current;
      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', { partnerId, data: { sdp: pc.localDescription } });
        }
      } else if (data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (iceError) {
          setError(iceError.message);
        }
      }
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
      cleanup();
    });

    return () => {
      cleanup();
      socket.disconnect();
    };
  }, [signalingUrl, user]);

  const cleanup = () => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    if (localVideoRef.current?.srcObject) {
      const tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current?.srcObject) {
      const tracks = remoteVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
    setPartner(null);
  };

  const requestMatch = () => {
    setStatus('searching');
    socketRef.current.emit('match', {
      userId: user.id,
      minAge: user.preferences?.minAge,
      maxAge: user.preferences?.maxAge,
      languages: user.preferences?.languages,
      interests: user.preferences?.interests,
    });
  };

  const createPeerConnection = async (partnerId, isInitiator) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    connectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('signal', { partnerId, data: { candidate: event.candidate } });
      }
    };

    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      localVideoRef.current.srcObject = stream;
    } catch (mediaError) {
      setError(mediaError.message);
      return;
    }

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('signal', { partnerId, data: { sdp: offer } });
    }
  };

  return (
    <div className="inside-mode">
      <h2>Inside Mode</h2>
      <p>Status: {status}</p>
      {error && <p className="error">{error}</p>}
      <button onClick={requestMatch} disabled={status === 'searching' || status === 'waiting'}>
        Find Connection
      </button>
      <div className="videos">
        <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
        <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
      </div>
      {partner && <p>Connected with {partner.userId}</p>}
    </div>
  );
}
