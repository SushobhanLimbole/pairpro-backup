class WebRTCManager {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peer = null;
    this.socket = null;
    this.roomId = null;
    this.pendingCandidates = [];
    this.onRemoteStream = null;
  }

  setSocket(socket) {
    this.socket = socket;
  }

  setRoom(roomId) {
    this.roomId = roomId;
  }

  async initLocalStream(videoRef) {
    if (!this.localStream) {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    }
    if (videoRef.current) {
      videoRef.current.srcObject = this.localStream;
    }
  }

  async createPeer(targetSocketId, isInitiator) {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    this.peer = peer;

    this.localStream.getTracks().forEach(track => {
      peer.addTrack(track, this.localStream);
    });

    peer.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.socket.emit('send-ice-candidate', { candidate, to: targetSocketId });
      }
    };

    peer.ontrack = (event) => {
      if (this.onRemoteStream) {
        this.onRemoteStream(event.streams[0]);
      }
    };

    if (isInitiator) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      this.socket.emit('send-offer', { offer: peer.localDescription, to: targetSocketId });
    }
  }

  async handleOffer({ offer, from }) {
    await this.createPeer(from, false);
    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    this.socket.emit('send-answer', { answer: this.peer.localDescription, to: from });

    for (const candidate of this.pendingCandidates) {
      await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
    }
    this.pendingCandidates = [];
  }

  async handleAnswer({ answer }) {
    await this.peer.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIceCandidate({ candidate }) {
    if (this.peer && this.peer.remoteDescription) {
      await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      this.pendingCandidates.push(candidate);
    }
  }

  cleanup() {
    this.peer?.close();
    this.peer = null;
  }
}

export const webRTCManager = new WebRTCManager();
