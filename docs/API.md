# API Documentation

## Overview

This document describes the REST API endpoints for the Grova messaging application.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All endpoints (except where noted) require authentication via the `authenticate` middleware. Authentication is handled via session cookies or JWT tokens.

## Endpoints

### Messages

#### Get Messages

```http
GET /api/messages
```

**Query Parameters:**
- `limit` (optional, default: 50, max: 100) - Number of messages to return
- `offset` (optional, default: 0) - Number of messages to skip
- `cursor` (optional) - Timestamp for cursor-based pagination

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "senderId": "user-id",
      "text": "message text",
      "type": "text|audio|heart|sticker|gif|image",
      "audioData": "base64-encoded-audio",
      "gifUrl": "https://example.com/gif.gif",
      "imageData": "base64-encoded-image",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "liked": false,
      "deleted": false,
      "deletedAt": null,
      "variant": "default|cute",
      "companionSticker": "🎉"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true,
    "nextCursor": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Create Message

```http
POST /api/messages
```

**Request Body:**
```json
{
  "senderId": "user-id",
  "type": "text",
  "text": "Hello!",
  "audioData": "base64-encoded-audio",
  "gifUrl": "https://example.com/gif.gif",
  "imageData": "base64-encoded-image",
  "variant": "default",
  "companionSticker": "🎉"
}
```

**Validation:**
- `text`: max 10,000 characters
- `audioData`: max 10MB
- `imageData`: max 10MB

**Response:**
```json
{
  "id": "uuid",
  "senderId": "user-id",
  "text": "Hello!",
  "type": "text",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "liked": false,
  "variant": "default",
  "companionSticker": "🎉"
}
```

#### Like Message

```http
PATCH /api/messages/:id/like
```

**Response:**
```json
{
  "id": "uuid",
  "liked": true
}
```

#### Delete Message

```http
DELETE /api/messages/:id
```

**Response:**
```json
{
  "id": "uuid",
  "deleted": true,
  "deletedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Clear All Messages

```http
DELETE /api/messages
```

**Response:**
```json
{
  "success": true
}
```

### Users

#### Get Users

```http
GET /api/users
```

**Response:**
```json
[
  {
    "id": "user-id",
    "name": "User Name",
    "avatar": "https://example.com/avatar.jpg"
  }
]
```

### Presence

#### Get Presence

```http
GET /api/presence
```

**Response:**
```json
{
  "user-id": 1704067200000
}
```

#### Send Heartbeat

```http
POST /api/heartbeat
```

**Request Body:**
```json
{
  "userId": "user-id"
}
```

### Real-time Events

#### Server-Sent Events (SSE)

```http
GET /api/events?userId=user-id
```

**Event Types:**
- `new-message` - New message received
- `message-liked` - Message liked
- `message-deleted` - Message deleted
- `presence` - User presence updated
- `messages-cleared` - All messages cleared
- `call-offer` - Incoming call offer
- `call-answer` - Call answered
- `call-ice` - WebRTC ICE candidate
- `call-end` - Call ended
- `call-reject` - Call rejected
- `profile-updated` - User profile updated
- `typing-indicator` - Typing status
- `message-read` - Message read receipt
- `dua-added` - New dua added
- `dua-deleted` - Dua deleted

### Encryption

#### Get Public Key

```http
GET /api/keys/public/:userId
```

**Response:**
```json
{
  "publicKey": "base64-encoded-public-key"
}
```

#### Set Public Key

```http
POST /api/keys/public
```

**Request Body:**
```json
{
  "userId": "user-id",
  "publicKey": "base64-encoded-public-key"
}
```

### Typing Indicators

#### Send Typing Status

```http
POST /api/typing
```

**Request Body:**
```json
{
  "userId": "user-id",
  "partnerId": "partner-id",
  "typing": true
}
```

### Read Receipts

#### Send Read Receipt

```http
POST /api/read-receipts
```

**Request Body:**
```json
{
  "messageId": "message-id",
  "userId": "user-id"
}
```

### Call Signaling

#### Send Call Signal

```http
POST /api/call-signal
```

**Request Body:**
```json
{
  "type": "offer|answer|ice|reject|end",
  "senderId": "user-id",
  "sdp": "webrtc-session-description",
  "candidate": "webrtc-ice-candidate"
}
```

### Data Export

#### Export User Data

```http
GET /api/export/:userId
```

**Response:**
```json
{
  "messages": [...],
  "users": [...],
  "exportedAt": "2024-01-01T00:00:00.000Z"
}
```

## Rate Limiting

All message endpoints are rate-limited to prevent abuse. Default limits:
- Messages: 100 requests per 15 minutes per IP

## Error Responses

All endpoints may return error responses:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Security

- All message text is encrypted at rest using AES-256
- End-to-end encryption is supported for sensitive messages
- Rate limiting is applied to prevent abuse
- CORS is configured for allowed origins
- Helmet middleware is used for security headers
