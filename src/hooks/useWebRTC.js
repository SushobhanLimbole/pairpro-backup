// import { useEffect, useRef, useState } from 'react';
// import { webRTCManager } from './WebRTCManager';
// import { socket } from './socket';

// export default function useWebRTC(roomId) {
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);

//   const [isRemoteConnected, setIsRemoteConnected] = useState(false);

//   useEffect(() => {
//     webRTCManager.setSocket(socket);
//     webRTCManager.setRoom(roomId);
//     webRTCManager.onRemoteStream = (stream) => {
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = stream;
//         setIsRemoteConnected(true);
//       }
//     };

//     (async () => {
//       await webRTCManager.initLocalStream(localVideoRef);
//       socket.emit('join-room', { roomId });
//     })();

//     socket.on('user-joined', ({ socketId }) => {
//       webRTCManager.createPeer(socketId, true);
//     });

//     socket.on('receive-offer', async (data) => {
//       await webRTCManager.handleOffer(data);
//     });

//     socket.on('receive-answer', async (data) => {
//       await webRTCManager.handleAnswer(data);
//     });

//     socket.on('receive-ice-candidate', async (data) => {
//       await webRTCManager.handleIceCandidate(data);
//     });

//     socket.on('user-left', () => {
//       setIsRemoteConnected(false);
//       webRTCManager.cleanup();
//     });

//     return () => {
//       // Do not clean up stream on route change
//     };
//   }, [roomId]);

//   return {
//     localVideoRef,
//     remoteVideoRef,
//     isRemoteConnected
//   };
// }



import { useEffect, useRef, useState, useCallback } from 'react';
import { socket } from '../socket';
import { useVideoContext } from '../utils/video_context';

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

export default function useWebRTC(roomId) {
  // const localVideoRef = useRef(null);
  // const remoteVideoRef = useRef(null);
  // const screenVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pendingCandidates = useRef([]);

  const { localVideoRef, remoteVideoRef, screenVideoRef } = useVideoContext();


  const [muted, setMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);

  const cleanupPeer = useCallback(() => {
    console.log('[Cleanup] Closing peer connection');
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setIsRemoteConnected(false);
  }, []);

  const createPeerConnection = useCallback((targetSocketId) => {
    console.log('[PeerConnection] Creating peer for:', targetSocketId);
    const peer = new RTCPeerConnection(ICE_SERVERS);

    peer.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log('[ICE] Local candidate:', candidate);
        socket.emit('send-ice-candidate', { candidate, to: targetSocketId });
      }
    };

    peer.ontrack = (event) => {
      console.log('[Track] Remote track received');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsRemoteConnected(true);
      }
    };

    peer.oniceconnectionstatechange = () => {
      console.log('[ICE State] Changed to:', peer.iceConnectionState);
      if (['disconnected', 'failed', 'closed'].includes(peer.iceConnectionState)) {
        cleanupPeer();
      }
    };

    return peer;
  }, [cleanupPeer]);

  const toggleAudio = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMuted(!audioTrack.enabled);
    }
  }, []);

  const shareScreen = useCallback(async () => {
    if (!peerRef.current) return;

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerRef.current.getSenders().find(s => s.track.kind === 'video');

      if (sender) sender.replaceTrack(screenTrack);
      screenVideoRef.current.srcObject = screenStream;
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      screenTrack.onended = () => {
        const originalTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = peerRef.current.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(originalTrack);
        screenVideoRef.current.srcObject = null;
        setIsScreenSharing(false);
      };
    } catch (err) {
      console.error('[ScreenShare] Error:', err);
    }
  }, []);

  useEffect(() => {
    const start = async () => {
      try {
        if (!socket.connected) {
          console.log('[Socket] Reconnecting...');
          socket.connect();
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        console.log('[Media] Local stream set');

        socket.emit('join-room', { roomId });
        console.log('[Socket] Emitted join-room:', roomId);

        socket.on('user-joined', async ({ socketId }) => {
          console.log('[Signal] user-joined:', socketId);
          if (peerRef.current) return;

          peerRef.current = createPeerConnection(socketId);
          stream.getTracks().forEach(track => {
            peerRef.current.addTrack(track, stream);
          });

          const offer = await peerRef.current.createOffer();
          await peerRef.current.setLocalDescription(offer);
          console.log('[Offer] Sending offer to:', socketId);

          socket.emit('send-offer', {
            offer: peerRef.current.localDescription,
            to: socketId,
          });
        });

        socket.on('receive-offer', async ({ offer, from }) => {
          console.log('[Offer] Received offer from:', from);
          if (peerRef.current) return;

          peerRef.current = createPeerConnection(from);
          stream.getTracks().forEach(track => peerRef.current.addTrack(track, stream));

          await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerRef.current.createAnswer();
          await peerRef.current.setLocalDescription(answer);

          console.log('[Answer] Sending answer to:', from);
          socket.emit('send-answer', {
            answer: peerRef.current.localDescription,
            to: from,
          });

          for (const candidate of pendingCandidates.current) {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidates.current = [];
        });

        socket.on('receive-answer', async ({ answer }) => {
          console.log('[Answer] Received answer');
          if (peerRef.current) {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });

        socket.on('receive-ice-candidate', async ({ candidate }) => {
          if (peerRef.current && peerRef.current.remoteDescription) {
            try {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
              console.log('[ICE] Candidate added');
            } catch (err) {
              console.error('[ICE] Error adding candidate:', err);
            }
          } else {
            console.log('[ICE] Buffering ICE candidate');
            pendingCandidates.current.push(candidate);
          }
        });

        socket.on('user-left', ({ socketId }) => {
          console.log('[Signal] user-left:', socketId);
          cleanupPeer();
        });

      } catch (err) {
        console.error('[Init] WebRTC error:', err);
      }
    };

    start();

    return () => {
      console.log('[Cleanup] useWebRTC cleanup');
      socket.emit('leave-room', { roomId });
      cleanupPeer();
      // localStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());

      socket.off('user-joined');
      socket.off('receive-offer');
      socket.off('receive-answer');
      socket.off('receive-ice-candidate');
      socket.off('user-left');
    };
  }, [roomId, createPeerConnection, cleanupPeer]);

  return {
    localVideoRef,
    remoteVideoRef,
    screenVideoRef,
    toggleAudio,
    shareScreen,
    muted,
    isScreenSharing,
    isRemoteConnected,
  };
}
