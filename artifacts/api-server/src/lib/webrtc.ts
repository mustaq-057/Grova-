// WebRTC STUN/TURN server configuration
// This provides the structure for TURN server configuration
// Requires TURN server credentials to be configured via environment variables

// Define types since RTCIceServer is a browser API not available in Node.js
export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password';
}

export interface RTCConfiguration {
  iceServers: RTCIceServer[];
}

export interface TurnServerConfig {
  urls: string[];
  username: string;
  credential: string;
  credentialType?: 'password';
}

export function getWebRTCConfiguration(): RTCConfiguration {
  const turnServers = getTurnServers();
  const stunServers = getStunServers();

  return {
    iceServers: [
      ...stunServers,
      ...turnServers,
    ],
  };
}

export function getStunServers(): RTCIceServer[] {
  // Default STUN servers (public, free)
  const defaultStunServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  // Custom STUN servers from environment
  const customStunUrls = process.env.STUN_SERVERS?.split(',').filter(Boolean) || [];
  
  if (customStunUrls.length > 0) {
    return customStunUrls.map(url => ({ urls: url.trim() }));
  }

  return defaultStunServers;
}

export function getTurnServers(): RTCIceServer[] {
  const turnUrls = process.env.TURN_SERVERS?.split(',').filter(Boolean) || [];
  const turnUsername = process.env.TURN_USERNAME;
  const turnCredential = process.env.TURN_CREDENTIAL;

  if (turnUrls.length === 0 || !turnUsername || !turnCredential) {
    console.warn('TURN server not configured. WebRTC may not work in restrictive network environments.');
    console.warn('Set TURN_SERVERS, TURN_USERNAME, and TURN_CREDENTIAL environment variables.');
    return [];
  }

  return turnUrls.map(url => ({
    urls: url.trim(),
    username: turnUsername,
    credential: turnCredential,
    credentialType: 'password' as const,
  }));
}

export function validateTurnConfig(): boolean {
  const turnUrls = process.env.TURN_SERVERS?.split(',').filter(Boolean) || [];
  const turnUsername = process.env.TURN_USERNAME;
  const turnCredential = process.env.TURN_CREDENTIAL;

  if (turnUrls.length === 0) {
    console.warn('TURN_SERVERS not configured');
    return false;
  }

  if (!turnUsername) {
    console.warn('TURN_USERNAME not configured');
    return false;
  }

  if (!turnCredential) {
    console.warn('TURN_CREDENTIAL not configured');
    return false;
  }

  console.log('TURN server configuration validated successfully');
  return true;
}

// Generate TURN credentials using the TURN REST API (time-limited)
export function generateTurnCredentials(username: string, secret: string, ttl: number = 86400): { username: string; credential: string } {
  const timestamp = Math.floor(Date.now() / 1000) + ttl;
  const turnUsername = `${timestamp}:${username}`;
  
  // HMAC-SHA1 signature
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(turnUsername);
  const credential = hmac.digest('base64');

  return { username: turnUsername, credential };
}
