# 🚀 WhatsBridge - WhatsApp API Gateway

A powerful WhatsApp API backend built with TypeScript, Express.js, and Baileys library. Supports multi-session management, real-time WebSocket events, group management, and media handling. Powered by Bun for fast performance.

![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)
![Bun](https://img.shields.io/badge/Bun-1.1+-green.svg)
![Express.js](https://img.shields.io/badge/Express.js-5.x-blue.svg)
![Baileys](https://img.shields.io/badge/Baileys-7.x-orange.svg)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-purple.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

- 📱 **Multi-Session Support** - Manage multiple WhatsApp accounts simultaneously
- 🔌 **Real-time WebSocket** - Get instant notifications for messages, status updates, and more
- 👥 **Group Management** - Create, manage, and control WhatsApp groups
- 📨 **Send Messages** - Text, images, documents, locations, contacts, buttons, stickers, and status
- 📥 **Auto-Save Media** - Automatically save incoming media to server
- 💾 **Persistent Store** - Message history with optimized caching
- 🔐 **Session Persistence** - Sessions survive server restarts
- 🎛️ **Admin Dashboard** - Web-based dashboard with real-time monitoring and API tester
- 🔑 **API Key Management** - Generate and manage custom API keys from the dashboard
- 💻 **TypeScript** - Full TypeScript support for type safety and better developer experience
- 🖼️ **Image Compression** - Automatically compress images before sending to reduce file size
- 🎨 **Sticker Support** - Convert images to WhatsApp sticker format (WebP 512x512)
- 💬 **Auto Reply** - Automatically reply to incoming messages
- ✅ **Auto Mark Read** - Automatically mark incoming messages as read
- @ **Mention Support** - Mention users in group messages using @phoneNumber
- 📱 **Custom Device Name** - Set custom device/OS name when connecting
- 📊 **Status Posting** - Post images and videos to WhatsApp status

## 📋 Table of Contents

- [Full Documentation](#-full-documentation)
- [Installation](#-installation)
  - [Standard Installation](#option-1-standard-installation)
  - [Docker Installation](#option-2-docker-installation)
- [Configuration](#-configuration)
- [API Key Authentication](#-api-key-authentication)
- [Quick Start](#-quick-start)
- [Dashboard](#-dashboard)
- [API Documentation](#-api-documentation)
  - [Sessions](#sessions)
  - [Messaging](#messaging)
  - [Chat History](#chat-history)
  - [Group Management](#group-management)
- [WebSocket Events](#-websocket-events)
- [Examples](#-examples)

## 🛠 Installation

### Option 1: Standard Installation

```bash
# Clone the repository
git clone https://github.com/rsuregar/whatsbridge.git
cd whatsbridge

# Install dependencies
bun install

# Create environment file
cp .env.example .env

# Start the server
bun start

# Or development mode with auto-reload
bun run dev
```

### Option 2: Docker Installation

```bash
# Clone the repository
git clone https://github.com/rsuregar/whatsbridge.git
cd whatsbridge

# Create environment file
cp .env.example .env

# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

#### Docker Commands

| Command                           | Description                   |
| --------------------------------- | ----------------------------- |
| `docker-compose up -d`            | Start container in background |
| `docker-compose down`             | Stop and remove container     |
| `docker-compose logs -f`          | View live logs                |
| `docker-compose restart`          | Restart container             |
| `docker-compose build --no-cache` | Rebuild image                 |

#### Docker Volumes

The following data is persisted across container restarts:

| Volume                 | Path                | Description           |
| ---------------------- | ------------------- | --------------------- |
| `whatsbridge_sessions` | `/app/sessions`     | WhatsApp session data |
| `whatsbridge_media`    | `/app/public/media` | Received media files  |
| `whatsbridge_store`    | `/app/store`        | Message history store |

## ⚙ Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
CORS_ORIGIN=*

# Dashboard Authentication
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=securepassword123

# API Key Authentication (optional - leave empty or 'your_api_key_here' to disable)
API_KEY=your_secret_api_key_here

# Whitelabel Footer (optional - footer name for all messages)
MESSAGE_FOOTER=My Company Name

# Auto Reply (optional - auto reply message for incoming messages)
AUTO_REPLY=Thank you for your message. We'll get back to you soon.

# Auto Mark Read (optional - automatically mark messages as read)
AUTO_MARK_READ=true

# Device Name (optional - custom device/OS name when connecting)
DEVICE_NAME=WhatsBridge API
```

## 🔐 API Key Authentication

All WhatsApp API endpoints are protected with API key authentication. Include the `X-Api-Key` header in your requests.

### How to Enable

1. Set a strong API key in your `.env` file:

   ```env
   API_KEY=your_super_secret_key_12345
   ```

2. Include the header in all API requests:
   ```bash
   curl -X GET http://localhost:3000/api/whatsapp/sessions \
     -H "X-Api-Key: your_super_secret_key_12345"
   ```

### Disable Authentication

To disable API key authentication, leave `API_KEY` empty or set it to `your_api_key_here` in `.env`:

```env
API_KEY=
# or
API_KEY=your_api_key_here
```

### Error Responses

| Status | Message                  | Description                     |
| ------ | ------------------------ | ------------------------------- |
| 401    | Missing X-Api-Key header | API key not provided in request |
| 403    | Invalid API key          | API key doesn't match           |

### Custom API Key Management

The dashboard includes built-in API key management:

1. **Generate API Keys**: Create custom API keys with `wb_` prefix directly from the dashboard
2. **Copy to Clipboard**: One-click copy functionality for easy integration
3. **Set Custom Keys**: Manually set your own API key
4. **Reset to Default**: Revert to using the default API key from environment variables

Custom API keys are stored in `data/api-keys.json` and validated alongside the environment variable `API_KEY`.

### Dashboard Integration

After logging into the dashboard, you can access the API key management feature from the header. The dashboard will automatically use your configured API key for authenticated API calls.

## 🚀 Quick Start

1. **Start the server**

   ```bash
   bun start
   ```

2. **Create a session**

   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/sessions/mysession/connect \
     -H "X-Api-Key: your_api_key" \
     -H "Content-Type: application/json"
   ```

3. **Get QR Code** - Open in browser or scan

   ```
   http://localhost:3000/api/whatsapp/sessions/mysession/qr/image
   ```

   Note: QR image endpoint also requires API key. Use curl or include header.

4. **Send a message**
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/chats/send-text \
     -H "X-Api-Key: your_api_key" \
     -H "Content-Type: application/json" \
     -d '{"sessionId": "mysession", "chatId": "628123456789", "message": "Hello!"}'
   ```

---

## 🎛️ Dashboard

Access the admin dashboard at `http://localhost:3000/` (or `http://localhost:3000/dashboard` for backward compatibility)

### 🔐 Authentication

Dashboard requires login with username and password configured in `.env` file.

| Field    | Default Value |
| -------- | ------------- |
| Username | `admin`       |
| Password | `admin123`    |

### ✨ Dashboard Features

| Feature                   | Description                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| 📊 **Real-time Stats**    | Monitor total sessions, connected/disconnected status, and WebSocket clients |
| 📱 **Session Management** | Create, connect, reconnect, and delete WhatsApp sessions                     |
| 📷 **QR Code Scanner**    | Scan QR codes directly from the dashboard                                    |
| 📡 **Live Events**        | Real-time WebSocket event viewer with filtering                              |
| 💬 **Quick Send**         | Send messages quickly to any number                                          |
| 🧪 **API Tester**         | Test all 30+ API endpoints with pre-filled templates                         |
| 🔑 **API Key Management** | Generate, copy, and manage custom API keys directly from the dashboard       |
| 🚪 **Logout**             | Secure logout button in header                                               |

### 📸 Screenshots

![Dashboard Screenshot](./screenshot/image.png)

The dashboard provides a modern dark-themed interface:

- **Session Cards** - View all sessions with status indicators
- **QR Modal** - Full-screen QR code for easy scanning
- **Event Log** - Live scrolling event feed with timestamps
- **API Tester** - Dropdown with all endpoints and auto-generated request bodies

---

## 📚 API Documentation

Base URL: `http://localhost:3000/api/whatsapp`

### Sessions

#### List All Sessions

```http
GET /sessions
```

**Response:**

```json
{
  "success": true,
  "message": "Sessions retrieved",
  "data": [
    {
      "sessionId": "mysession",
      "status": "connected",
      "isConnected": true,
      "phoneNumber": "628123456789",
      "name": "John Doe"
    }
  ]
}
```

#### Create/Connect Session

```http
POST /sessions/:sessionId/connect
```

**Body (Optional):**

```json
{
  "metadata": {
    "userId": "user123",
    "plan": "premium",
    "customField": "any value"
  },
  "webhooks": [
    { "url": "https://your-server.com/webhook", "events": ["all"] },
    { "url": "https://backup-server.com/webhook", "events": ["message"] }
  ]
}
```

| Parameter  | Type   | Description                                            |
| ---------- | ------ | ------------------------------------------------------ |
| `metadata` | object | Optional. Custom metadata to store with session        |
| `webhooks` | array  | Optional. Array of webhook configs `[{ url, events }]` |

**Response:**

```json
{
  "success": true,
  "message": "Session created",
  "data": {
    "sessionId": "mysession",
    "status": "qr_ready",
    "qrCode": "data:image/png;base64,...",
    "metadata": { "userId": "user123" },
    "webhooks": [
      { "url": "https://your-server.com/webhook", "events": ["all"] }
    ]
  }
}
```

#### Update Session Config

```http
PATCH /sessions/:sessionId/config
```

**Body:**

```json
{
  "metadata": { "newField": "value" },
  "webhooks": [
    {
      "url": "https://new-webhook.com/endpoint",
      "events": ["message", "connection.update"]
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Session config updated",
  "data": {
    "sessionId": "mysession",
    "metadata": { "userId": "user123", "newField": "value" },
    "webhooks": [
      {
        "url": "https://new-webhook.com/endpoint",
        "events": ["message", "connection.update"]
      }
    ]
  }
}
```

#### Add Webhook

```http
POST /sessions/:sessionId/webhooks
```

**Body:**

```json
{
  "url": "https://another-server.com/webhook",
  "events": ["message", "connection.update"]
}
```

#### Remove Webhook

```http
DELETE /sessions/:sessionId/webhooks
```

**Body:**

```json
{
  "url": "https://another-server.com/webhook"
}
```

#### Get Session Status

```http
GET /sessions/:sessionId/status
```

#### Get QR Code (JSON)

```http
GET /sessions/:sessionId/qr
```

#### Get QR Code (Image)

```http
GET /sessions/:sessionId/qr/image
```

Returns a PNG image that can be displayed directly in browser or scanned.

#### Get Pair Code

```http
GET /sessions/:sessionId/pair-code
```

**Response:**

```json
{
  "success": true,
  "message": "Pair Code ready",
  "data": {
    "sessionId": "mysession",
    "pairCode": "12345678",
    "status": "pair_ready"
  }
}
```

Returns an 8-digit pair code that can be entered manually in WhatsApp instead of scanning QR code. Useful when QR code scanning is not possible.

**Note:** Pair codes are an alternative to QR codes. Either QR code or pair code will be available, not both at the same time.

#### Delete Session

```http
DELETE /sessions/:sessionId
```

---

### Messaging

> **💡 Typing Indicator**: All messaging endpoints support `typingTime` parameter (in milliseconds) to simulate typing before sending the message. This makes the bot appear more human-like.

> **🏷️ Whitelabel Footer**: All messaging endpoints support automatic footer injection. The footer format is `> _footerName_` (markdown blockquote with italic). Configuration priority: `footerName` in request payload > session metadata > `MESSAGE_FOOTER` environment variable. Set `footerName` in the request body to override per-request, or configure it globally via session metadata or environment variable.

> **✅ Number Validation**: All messaging endpoints support optional `checkNumber` parameter (boolean, default: `false`). When set to `true`, the API will check if the phone number is registered on WhatsApp before sending the message. If the number is not registered, the API will return an error response with registration status instead of attempting to send the message.

#### Send Text Message

```http
POST /chats/send-text
```

**Body:**

```json
{
  "sessionId": "mysession",
  "chatId": "628123456789",
  "message": "Hello, World! Check this out: https://example.com",
  "footerName": "My Company",
  "typingTime": 2000,
  "checkNumber": true,
  "previewLinks": true
}
```

| Parameter      | Type    | Description                                                                                                                                                                                                    |
| -------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sessionId`    | string  | Required. Session ID                                                                                                                                                                                           |
| `chatId`       | string  | Required. Phone number (628xxx) or group ID (xxx@g.us)                                                                                                                                                         |
| `message`      | string  | Required. Text message to send                                                                                                                                                                                 |
| `footerName`   | string  | Optional. Footer name (overrides metadata/env, format: `> _footerName_`)                                                                                                                                       |
| `typingTime`   | number  | Optional. Typing duration in ms before sending (default: 0)                                                                                                                                                    |
| `checkNumber`  | boolean | Optional. If `true`, checks if phone number is registered before sending (default: false)                                                                                                                      |
| `mentions`     | array   | Optional. Array of phone numbers to mention (e.g., `["628123456789"]`). Also supports `@phoneNumber` in message text                                                                                           |
| `previewLinks` | boolean | Optional. Enable link preview generation for URLs in message (default: false). Requires `link-preview-js` dependency. When enabled, Baileys will automatically generate preview cards for URLs in the message. |

**Error Response (when checkNumber is true and number is not registered):**

```json
{
  "success": false,
  "message": "Phone number is not registered on WhatsApp",
  "data": {
    "phone": "628123456789",
    "isRegistered": false,
    "jid": null
  }
}
```

#### Send Image

```http
POST /chats/send-image
```

**Body:**

```json
{
  "sessionId": "mysession",
  "chatId": "123456789@g.us",
  "imageUrl": "https://example.com/image.jpg",
  "caption": "Check this out @628123456789, @628987654321!",
  "footerName": "My Company",
  "typingTime": 1500,
  "checkNumber": true,
  "compress": true,
  "quality": 80,
  "mentions": []
}
```

| Parameter     | Type    | Description                                                                               |
| ------------- | ------- | ----------------------------------------------------------------------------------------- |
| `sessionId`   | string  | Required. Session ID                                                                      |
| `chatId`      | string  | Required. Phone number (628xxx) or group ID                                               |
| `imageUrl`    | string  | Required. Direct URL to image file                                                        |
| `caption`     | string  | Optional. Image caption                                                                   |
| `footerName`  | string  | Optional. Footer name (appended to caption)                                               |
| `typingTime`  | number  | Optional. Typing duration in ms (default: 0)                                              |
| `checkNumber` | boolean | Optional. Check if number is registered (default: false)                                  |
| `compress`    | boolean | Optional. Compress image before sending (default: true)                                   |
| `quality`     | number  | Optional. Image quality 1-100 (default: 80)                                               |
| `mentions`    | array   | Optional. Array of phone numbers to mention. Also supports `@phoneNumber` in caption text |

**Image Compression:**

- Images are automatically compressed before sending (default: enabled)
- Compression reduces file size while maintaining good quality
- Adjustable quality (1-100, default: 80)
- Set `compress: false` to disable compression
- Maximum dimensions: 1920x1920 pixels (maintains aspect ratio)

**Mention Feature:**

- Mention users by including `@phoneNumber` in the message/caption text
- Example: `"message": "Hello @628123456789, @628987654321!"` or `"caption": "Check this @628123456789!"`
- Alternatively, provide a `mentions` array in the request body
- Works in both personal chats and group chats
- Phone numbers are automatically parsed to JID format (`phoneNumber@s.whatsapp.net`)
- For group chats, mentions are validated against group participants to display user names

#### Send Document

```http
POST /chats/send-document
```

**Body:**

```json
{
  "sessionId": "mysession",
  "chatId": "628123456789",
  "documentUrl": "https://example.com/document.pdf",
  "filename": "document.pdf",
  "mimetype": "application/pdf",
  "caption": "Please review @628123456789, @628987654321!",
  "typingTime": 1000,
  "checkNumber": true,
  "mentions": []
}
```

| Parameter     | Type    | Description                                                                               |
| ------------- | ------- | ----------------------------------------------------------------------------------------- |
| `sessionId`   | string  | Required. Session ID                                                                      |
| `chatId`      | string  | Required. Phone number (628xxx) or group ID                                               |
| `documentUrl` | string  | Required. Direct URL to document                                                          |
| `filename`    | string  | Required. Filename to display                                                             |
| `mimetype`    | string  | Optional. MIME type (default: application/pdf)                                            |
| `caption`     | string  | Optional. Document caption text                                                           |
| `footerName`  | string  | Optional. Footer name (appended to caption)                                               |
| `typingTime`  | number  | Optional. Typing duration in ms (default: 0)                                              |
| `checkNumber` | boolean | Optional. Check if number is registered (default: false)                                  |
| `mentions`    | array   | Optional. Array of phone numbers to mention. Also supports `@phoneNumber` in caption text |

#### Send Location

```http
POST /chats/send-location
```

**Body:**

```json
{
  "sessionId": "mysession",
  "chatId": "628123456789",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "name": "Jakarta, Indonesia",
  "typingTime": 1000,
  "checkNumber": true
}
```

| Parameter     | Type    | Description                                              |
| ------------- | ------- | -------------------------------------------------------- |
| `sessionId`   | string  | Required. Session ID                                     |
| `chatId`      | string  | Required. Phone number (628xxx) or group ID              |
| `latitude`    | number  | Required. GPS latitude                                   |
| `longitude`   | number  | Required. GPS longitude                                  |
| `name`        | string  | Optional. Location name                                  |
| `typingTime`  | number  | Optional. Typing duration in ms (default: 0)             |
| `checkNumber` | boolean | Optional. Check if number is registered (default: false) |

#### Send Contact

```http
POST /chats/send-contact
```

**Body:**

```json
{
  "sessionId": "mysession",
  "chatId": "628123456789",
  "contactName": "John Doe",
  "contactPhone": "628987654321",
  "typingTime": 500,
  "checkNumber": true
}
```

| Parameter      | Type    | Description                                              |
| -------------- | ------- | -------------------------------------------------------- |
| `sessionId`    | string  | Required. Session ID                                     |
| `chatId`       | string  | Required. Phone number (628xxx) or group ID              |
| `contactName`  | string  | Required. Contact display name                           |
| `contactPhone` | string  | Required. Contact phone number                           |
| `typingTime`   | number  | Optional. Typing duration in ms (default: 0)             |
| `checkNumber`  | boolean | Optional. Check if number is registered (default: false) |

#### Send Button Message

```http
POST /chats/send-button
```

**Body:**

```json
{
  "sessionId": "mysession",
  "chatId": "628123456789",
  "text": "Please choose an option:",
  "footer": "Powered by WhatsBridge",
  "buttons": ["Option 1", "Option 2", "Option 3"],
  "typingTime": 2000,
  "checkNumber": true
}
```

| Parameter     | Type    | Description                                              |
| ------------- | ------- | -------------------------------------------------------- |
| `sessionId`   | string  | Required. Session ID                                     |
| `chatId`      | string  | Required. Phone number (628xxx) or group ID              |
| `text`        | string  | Required. Button message text                            |
| `footer`      | string  | Optional. Footer text                                    |
| `buttons`     | array   | Required. Array of button labels (max 3)                 |
| `typingTime`  | number  | Optional. Typing duration in ms (default: 0)             |
| `checkNumber` | boolean | Optional. Check if number is registered (default: false) |

#### Send OTP Message

```http
POST /chats/send-otp
```

**Body:**

```json
{
  "sessionId": "mysession",
  "chatId": "628123456789",
  "otpCode": "123456",
  "message": "",
  "expiryMinutes": 5,
  "typingTime": 0,
  "footerName": "My Company",
  "checkNumber": false
}
```

| Parameter       | Type    | Description                                              |
| --------------- | ------- | -------------------------------------------------------- |
| `sessionId`     | string  | Required. Session ID                                     |
| `chatId`        | string  | Required. Phone number (628xxx) or group ID              |
| `otpCode`       | string  | Required. OTP code (4-8 digits)                          |
| `message`       | string  | Optional. Custom message (default format used if empty)  |
| `expiryMinutes` | number  | Optional. Expiry time in minutes (default: 5)            |
| `typingTime`    | number  | Optional. Typing duration in ms (default: 0)             |
| `footerName`    | string  | Optional. Footer name                                    |
| `checkNumber`   | boolean | Optional. Check if number is registered (default: false) |

**Response:**

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "messageId": "ABC123",
    "chatId": "628123456789@s.whatsapp.net",
    "otpCode": "123456",
    "expiryMinutes": 5,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Note:** The OTP is sent as a simple text message with the code on a separate line, making it easy for users to select and copy the OTP directly from WhatsApp. The default format is "Paste kode OTP" followed by the OTP code.

**Mention Feature:** You can mention users by including `@phoneNumber` in the message text. Example: `"Hello @628123456789, @628987654321"`. The API will automatically parse phone numbers to JID format (`phoneNumber@s.whatsapp.net`) and mention these users. Works in both personal chats and group chats. For group chats, mentions are validated against group participants to display user names instead of phone numbers. Alternatively, you can provide a `mentions` array in the request body.

#### Extract OTP from Message

```http
POST /chats/extract-otp
```

**Body:**

```json
{
  "sessionId": "mysession",
  "messageText": "Your verification code is: 123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP code extracted successfully",
  "data": {
    "otpCode": "123456",
    "messageText": "Your verification code is: 123456"
  }
}
```

**Supported OTP Formats:**

- `"Your code is 123456"`
- `"OTP: 123456"`
- `"Verification code: 123456"`
- `"123456 is your code"`
- `"Copy Code: 123456"` (from button messages)
- Standalone 4-8 digit numbers

#### Send Broadcast (Anti-Ban)

```http
POST /chats/broadcast
```

**Body (Text Type):**

```json
{
  "sessionId": "mysession",
  "recipients": ["628123456789", "628987654321", "628111222333"],
  "type": "text",
  "message": "Hello @628987654321! Check this: https://example.com",
  "typingTime": 1000,
  "minDelay": 2000,
  "maxDelay": 5000,
  "batchSize": 10,
  "batchDelay": 30000,
  "footerName": "My Company",
  "checkNumber": false,
  "previewLinks": true,
  "mentions": ["628987654321"]
}
```

**Body (Image Type):**

```json
{
  "sessionId": "mysession",
  "recipients": ["628123456789", "628987654321"],
  "type": "image",
  "imageUrl": "https://example.com/image.jpg",
  "message": "Check this out @628987654321!",
  "typingTime": 1000,
  "minDelay": 2000,
  "maxDelay": 5000,
  "batchSize": 10,
  "batchDelay": 30000,
  "footerName": "My Company",
  "checkNumber": false,
  "mentions": ["628987654321"]
}
```

**Body (Document Type):**

```json
{
  "sessionId": "mysession",
  "recipients": ["628123456789", "628987654321"],
  "type": "document",
  "documentUrl": "https://example.com/document.pdf",
  "filename": "document.pdf",
  "mimetype": "application/pdf",
  "message": "See this @628987654321!",
  "typingTime": 1000,
  "minDelay": 2000,
  "maxDelay": 5000,
  "batchSize": 10,
  "batchDelay": 30000,
  "footerName": "My Company",
  "checkNumber": false,
  "mentions": ["628987654321"]
}
```

| Parameter      | Type    | Description                                                                                                                                |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `sessionId`    | string  | Required. Session ID                                                                                                                       |
| `recipients`   | array   | Required. Array of phone numbers or chat IDs                                                                                               |
| `type`         | string  | Optional. Message type: `"text"` (default), `"image"`, or `"document"`                                                                     |
| `message`      | string  | Required for text type. Message text or caption (for image/document). Supports `@phoneNumber` for mentions                                 |
| `imageUrl`     | string  | Required for image type. Direct URL to image file                                                                                          |
| `documentUrl`  | string  | Required for document type. Direct URL to document file                                                                                    |
| `filename`     | string  | Required for document type. Document filename                                                                                              |
| `mimetype`     | string  | Optional for document type. Document MIME type (default: application/pdf)                                                                  |
| `typingTime`   | number  | Optional. Typing duration in ms before each message (default: 1000)                                                                        |
| `minDelay`     | number  | Optional. Minimum random delay between messages in ms (default: 2000)                                                                      |
| `maxDelay`     | number  | Optional. Maximum random delay between messages in ms (default: 5000)                                                                      |
| `batchSize`    | number  | Optional. Number of messages per batch (default: 10, max: 50)                                                                              |
| `batchDelay`   | number  | Optional. Delay between batches in ms (default: 30000)                                                                                     |
| `footerName`   | string  | Optional. Footer name                                                                                                                      |
| `checkNumber`  | boolean | Optional. Check if numbers are registered before sending (default: false)                                                                  |
| `previewLinks` | boolean | Optional. Enable link preview generation for URLs in text messages (default: false). Only works for text type.                             |
| `mentions`     | array   | Optional. Array of phone numbers to mention. Also supports `@phoneNumber` in message/caption text. Works in both personal and group chats. |

**Response:**

```json
{
  "success": true,
  "message": "Broadcast completed: 3 sent, 0 failed",
  "data": {
    "total": 3,
    "success": 3,
    "failed": 0,
    "results": [
      {
        "recipient": "628123456789",
        "messageId": "ABC123",
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ],
    "errors": []
  }
}
```

**Anti-Ban Features:**

- ✅ **Typing Simulation**: Simulates typing before each message
- ✅ **Random Delays**: Random delay between messages (minDelay to maxDelay)
- ✅ **Batch Processing**: Processes messages in batches to avoid overwhelming WhatsApp
- ✅ **Batch Delays**: Longer delays between batches to avoid rate limiting
- ✅ **Number Validation**: Optional check to verify numbers before sending

**Message Types:**

- **Text**: Send text messages with optional link previews and mentions
- **Image**: Broadcast images with captions and mentions
- **Document**: Broadcast documents (PDF, etc.) with captions and mentions

**Mention Feature:**

- Mention users by including `@phoneNumber` in the message/caption text
- Example: `"message": "Hello @628123456789, @628987654321!"` or `"message": "Check this @628123456789!"` (for image/document captions)
- Alternatively, provide a `mentions` array in the request body
- Works in both personal chats and group chats
- Phone numbers are automatically parsed to JID format (`phoneNumber@s.whatsapp.net`)
- For group chats, mentions are validated against group participants to display user names

**Link Preview (Text Type Only):**

- Set `previewLinks: true` to enable automatic link preview generation for URLs in text messages
- Requires `link-preview-js` dependency
- When enabled, Baileys will automatically generate preview cards for URLs in the message

**Recommended Settings for Large Broadcasts:**

- `typingTime`: 1000-2000ms (simulates human typing)
- `minDelay`: 2000-3000ms (minimum wait between messages)
- `maxDelay`: 5000-8000ms (maximum wait between messages)
- `batchSize`: 10-20 (smaller batches = safer)
- `batchDelay`: 30000-60000ms (30-60 seconds between batches)

#### Bulk Send Text (Different Messages)

```http
POST /chats/bulk-send-text
```

**Body:**

```json
{
  "sessionId": "mysession",
  "items": [
    {
      "phone": "628123456789",
      "message": "Hello User 1! Your order is ready."
    },
    {
      "phone": "628987654321",
      "message": "Hello User 2! Your payment is confirmed."
    }
  ],
  "typingTime": 1000,
  "minDelay": 2000,
  "maxDelay": 5000,
  "batchSize": 10,
  "batchDelay": 30000,
  "footerName": "My Company",
  "checkNumber": false,
  "previewLinks": true
}
```

| Parameter      | Type    | Description                                                                                                            |
| -------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `sessionId`    | string  | Required. Session ID                                                                                                   |
| `items`        | array   | Required. Array of objects with `{phone, message}`                                                                     |
| `typingTime`   | number  | Optional. Typing duration in ms (default: 1000)                                                                        |
| `minDelay`     | number  | Optional. Minimum random delay between messages in ms (default: 2000)                                                  |
| `maxDelay`     | number  | Optional. Maximum random delay between messages in ms (default: 5000)                                                  |
| `batchSize`    | number  | Optional. Number of messages per batch (default: 10, max: 50)                                                          |
| `batchDelay`   | number  | Optional. Delay between batches in ms (default: 30000)                                                                 |
| `footerName`   | string  | Optional. Footer name                                                                                                  |
| `checkNumber`  | boolean | Optional. Check if numbers are registered before sending (default: false)                                              |
| `previewLinks` | boolean | Optional. Enable link preview generation for URLs in messages (default: false). Requires `link-preview-js` dependency. |

**Mention Feature:**

- Mention users by including `@phoneNumber` in the message text
- Example: `"message": "Hello @628123456789, @628987654321!"`
- Works in both personal chats and group chats
- Phone numbers are automatically parsed to JID format (`phoneNumber@s.whatsapp.net`)

**Response:**

```json
{
  "success": true,
  "message": "Bulk send completed: 2 sent, 0 failed",
  "data": {
    "total": 2,
    "success": 2,
    "failed": 0,
    "results": [
      {
        "phone": "628123456789",
        "messageId": "ABC123",
        "timestamp": "2024-01-15T10:30:00.000Z"
      }
    ],
    "errors": []
  }
}
```

#### Bulk Send Image (Different Images)

```http
POST /chats/bulk-send-image
```

**Body:**

```json
{
  "sessionId": "mysession",
  "items": [
    {
      "phone": "628123456789",
      "imageUrl": "https://example.com/image1.jpg",
      "caption": "Check this out @628987654321!"
    },
    {
      "phone": "628987654321",
      "imageUrl": "https://example.com/image2.jpg",
      "caption": "See this @628123456789!"
    }
  ],
  "typingTime": 1000,
  "minDelay": 2000,
  "maxDelay": 5000,
  "batchSize": 10,
  "batchDelay": 30000,
  "footerName": "My Company",
  "checkNumber": false
}
```

| Parameter     | Type    | Description                                                               |
| ------------- | ------- | ------------------------------------------------------------------------- |
| `items`       | array   | Required. Array of objects with `{phone, imageUrl, caption?}`             |
| `typingTime`  | number  | Optional. Typing duration in ms (default: 1000)                           |
| `minDelay`    | number  | Optional. Minimum random delay between messages in ms (default: 2000)     |
| `maxDelay`    | number  | Optional. Maximum random delay between messages in ms (default: 5000)     |
| `batchSize`   | number  | Optional. Number of messages per batch (default: 10, max: 50)             |
| `batchDelay`  | number  | Optional. Delay between batches in ms (default: 30000)                    |
| `footerName`  | string  | Optional. Footer name                                                     |
| `checkNumber` | boolean | Optional. Check if numbers are registered before sending (default: false) |

**Mention Feature:**

- Mention users by including `@phoneNumber` in the caption text
- Example: `"caption": "Check this out @628123456789!"`
- Works in both personal chats and group chats
- Phone numbers are automatically parsed to JID format (`phoneNumber@s.whatsapp.net`)

#### Bulk Send Document (Different Documents)

```http
POST /chats/bulk-send-document
```

**Body:**

```json
{
  "sessionId": "mysession",
  "items": [
    {
      "phone": "628123456789",
      "documentUrl": "https://example.com/invoice1.pdf",
      "filename": "invoice1.pdf",
      "mimetype": "application/pdf",
      "caption": "See this @628987654321!"
    },
    {
      "phone": "628987654321",
      "documentUrl": "https://example.com/invoice2.pdf",
      "filename": "invoice2.pdf",
      "mimetype": "application/pdf",
      "caption": "Check this @628123456789!"
    }
  ],
  "typingTime": 1000,
  "minDelay": 2000,
  "maxDelay": 5000,
  "batchSize": 10,
  "batchDelay": 30000,
  "footerName": "My Company",
  "checkNumber": false
}
```

| Parameter     | Type    | Description                                                                          |
| ------------- | ------- | ------------------------------------------------------------------------------------ |
| `items`       | array   | Required. Array of objects with `{phone, documentUrl, filename, mimetype, caption?}` |
| `typingTime`  | number  | Optional. Typing duration in ms (default: 1000)                                      |
| `minDelay`    | number  | Optional. Minimum random delay between messages in ms (default: 2000)                |
| `maxDelay`    | number  | Optional. Maximum random delay between messages in ms (default: 5000)                |
| `batchSize`   | number  | Optional. Number of messages per batch (default: 10, max: 50)                        |
| `batchDelay`  | number  | Optional. Delay between batches in ms (default: 30000)                               |
| `footerName`  | string  | Optional. Footer name                                                                |
| `checkNumber` | boolean | Optional. Check if numbers are registered before sending (default: false)            |

**Mention Feature:**

- Mention users by including `@phoneNumber` in the caption text
- Example: `"caption": "See this @628123456789!"`
- Works in both personal chats and group chats
- Phone numbers are automatically parsed to JID format (`phoneNumber@s.whatsapp.net`)

**Note:** Bulk send endpoints support the same anti-ban features as broadcast (random delays, batch processing, typing simulation).

#### Send Sticker

```http
POST /chats/send-sticker
```

**Body:**

```json
{
  "sessionId": "mysession",
  "chatId": "628123456789",
  "imageUrl": "https://example.com/image.jpg",
  "typingTime": 1000
}
```

| Parameter    | Type   | Description                                                             |
| ------------ | ------ | ----------------------------------------------------------------------- |
| `sessionId`  | string | Required. Session ID                                                    |
| `chatId`     | string | Required. Phone number (628xxx) or group ID (xxx@g.us)                  |
| `imageUrl`   | string | Required. Direct URL to image file (supports JPG, JPEG, PNG, WebP, GIF) |
| `typingTime` | number | Optional. Typing duration in ms (default: 0)                            |

**Features:**

- Automatically converts image to WebP sticker format (512x512 pixels)
- Supports JPG, JPEG, PNG, WebP, and GIF formats
- Preserves transparency for PNG images
- Resizes images to 512x512 while maintaining aspect ratio

**Response:**

```json
{
  "success": true,
  "message": "Sticker sent successfully",
  "data": {
    "messageId": "ABC123",
    "chatId": "628123456789@s.whatsapp.net",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Post WhatsApp Status

```http
POST /status/post
```

**Body:**

```json
{
  "sessionId": "mysession",
  "mediaUrl": "https://example.com/image.jpg",
  "caption": "Check out my status!",
  "type": "image"
}
```

| Parameter   | Type   | Description                                 |
| ----------- | ------ | ------------------------------------------- |
| `sessionId` | string | Required. Session ID                        |
| `mediaUrl`  | string | Required. Direct URL to image or video file |
| `caption`   | string | Optional. Status caption                    |
| `type`      | string | Required. `image` or `video`                |

**Response:**

```json
{
  "success": true,
  "message": "Status posted successfully",
  "data": {
    "messageId": "ABC123",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Send Presence Update

```http
POST /chats/presence
```

**Body:**

```json
{
  "sessionId": "mysession",
  "chatId": "628123456789",
  "presence": "composing"
}
```

| Parameter   | Type   | Description                                                              |
| ----------- | ------ | ------------------------------------------------------------------------ |
| `sessionId` | string | Required. Session ID                                                     |
| `chatId`    | string | Required. Phone number or group ID                                       |
| `presence`  | string | Required. `composing`, `recording`, `paused`, `available`, `unavailable` |

#### Check Phone Number

```http
POST /chats/check-number
```

**Body:**

```json
{
  "sessionId": "mysession",
  "phone": "628123456789"
}
```

#### Get Profile Picture

```http
POST /chats/profile-picture
```

**Body:**

```json
{
  "sessionId": "mysession",
  "phone": "628123456789"
}
```

---

### Profile & Settings

#### Update Profile Name (PushName)

```http
POST /profile/update-name
```

**Body:**

```json
{
  "sessionId": "mysession",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Profile name updated successfully",
  "data": {
    "name": "John Doe"
  }
}
```

#### Update Device Name (OS Name)

```http
POST /profile/update-device-name
```

**Body:**

```json
{
  "sessionId": "mysession",
  "deviceName": "My Custom App"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Device name updated. Reconnect session to apply changes.",
  "data": {
    "deviceName": "My Custom App"
  }
}
```

**Note:** Device name is set during connection. You need to reconnect the session for changes to take effect. The device name appears when connecting via mobile WhatsApp.

**Environment Variable:** You can also set default device name via `DEVICE_NAME` environment variable.

#### Update Auto Reply

```http
POST /profile/update-auto-reply
```

**Body:**

```json
{
  "sessionId": "mysession",
  "autoReply": "Thank you for your message. We'll get back to you soon."
}
```

**To disable auto reply:**

```json
{
  "sessionId": "mysession",
  "autoReply": null
}
```

**Response:**

```json
{
  "success": true,
  "message": "Auto reply updated",
  "data": {
    "autoReply": "Thank you for your message. We'll get back to you soon."
  }
}
```

**Note:** Auto reply only works for personal messages (not group messages). Set `autoReply` to `null` to disable.

**Environment Variable:** You can also set default auto reply via `AUTO_REPLY` environment variable.

#### Update Auto Mark Read

```http
POST /profile/update-auto-mark-read
```

**Body:**

```json
{
  "sessionId": "mysession",
  "autoMarkRead": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Auto mark read updated",
  "data": {
    "autoMarkRead": true
  }
}
```

**Note:** When enabled, all incoming messages will be automatically marked as read.

**Environment Variable:** You can also set default via `AUTO_MARK_READ=true` environment variable.

---

### Profile & Settings

#### Update Profile Name (PushName)

```http
POST /profile/update-name
```

**Body:**

```json
{
  "sessionId": "mysession",
  "name": "John Doe"
}
```

#### Update Device Name (OS Name)

```http
POST /profile/update-device-name
```

**Body:**

```json
{
  "sessionId": "mysession",
  "deviceName": "My Custom App"
}
```

**Note:** Device name is set during connection. You need to reconnect the session for changes to take effect. The device name appears when connecting via mobile WhatsApp.

**Environment Variable:** You can also set default device name via `DEVICE_NAME` environment variable.

#### Update Auto Reply

```http
POST /profile/update-auto-reply
```

**Body:**

```json
{
  "sessionId": "mysession",
  "autoReply": "Thank you for your message. We'll get back to you soon."
}
```

**To disable auto reply:**

```json
{
  "sessionId": "mysession",
  "autoReply": null
}
```

**Note:** Auto reply only works for personal messages (not group messages). Set `autoReply` to `null` to disable.

**Environment Variable:** You can also set default auto reply via `AUTO_REPLY` environment variable.

#### Update Auto Mark Read

```http
POST /profile/update-auto-mark-read
```

**Body:**

```json
{
  "sessionId": "mysession",
  "autoMarkRead": true
}
```

**Note:** When enabled, all incoming messages will be automatically marked as read.

**Environment Variable:** You can also set default via `AUTO_MARK_READ=true` environment variable.

---

### Chat History

#### Get Chats Overview

```http
POST /chats/overview
```

**Body:**

```json
{
  "sessionId": "mysession",
  "limit": 50,
  "offset": 0,
  "type": "all"
}
```

| Parameter   | Type   | Description                                  |
| ----------- | ------ | -------------------------------------------- |
| `sessionId` | string | Required. Session ID                         |
| `limit`     | number | Optional. Max results (default: 50)          |
| `offset`    | number | Optional. Pagination offset (default: 0)     |
| `type`      | string | Optional. Filter: `all`, `personal`, `group` |

#### Get Contacts

```http
POST /contacts
```

**Body:**

```json
{
  "sessionId": "mysession",
  "limit": 100,
  "offset": 0,
  "search": "john"
}
```

#### Get Chat Messages

```http
POST /chats/messages
```

**Body:**

```json
{
  "sessionId": "mysession",
  "chatId": "628123456789@s.whatsapp.net",
  "limit": 50,
  "cursor": null
}
```

#### Get Chat Info

```http
POST /chats/info
```

**Body:**

```json
{
  "sessionId": "mysession",
  "chatId": "628123456789@s.whatsapp.net"
}
```

#### Mark Chat as Read

```http
POST /chats/mark-read
```

**Body:**

```json
{
  "sessionId": "mysession",
  "chatId": "628123456789",
  "messageId": null
}
```

| Parameter   | Type   | Description                                   |
| ----------- | ------ | --------------------------------------------- |
| `sessionId` | string | Required. Session ID                          |
| `chatId`    | string | Required. Phone number or group ID            |
| `messageId` | string | Optional. Specific message ID to mark as read |

---

### Group Management

#### Get All Groups

```http
POST /groups
```

**Body:**

```json
{
  "sessionId": "mysession"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "count": 5,
    "groups": [
      {
        "id": "123456789@g.us",
        "subject": "My Group",
        "participantsCount": 25,
        "creation": 1609459200
      }
    ]
  }
}
```

#### Create Group

```http
POST /groups/create
```

**Body:**

```json
{
  "sessionId": "mysession",
  "name": "My New Group",
  "participants": ["628123456789", "628987654321"]
}
```

#### Get Group Metadata

```http
POST /groups/metadata
```

**Body:**

```json
{
  "sessionId": "mysession",
  "groupId": "123456789@g.us"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "123456789@g.us",
    "subject": "My Group",
    "description": "Group description",
    "participants": [
      { "id": "628123456789@s.whatsapp.net", "admin": "superadmin" },
      { "id": "628987654321@s.whatsapp.net", "admin": null }
    ],
    "size": 25
  }
}
```

#### Add Participants

```http
POST /groups/participants/add
```

**Body:**

```json
{
  "sessionId": "mysession",
  "groupId": "123456789@g.us",
  "participants": ["628111222333", "628444555666"]
}
```

#### Remove Participants

```http
POST /groups/participants/remove
```

**Body:**

```json
{
  "sessionId": "mysession",
  "groupId": "123456789@g.us",
  "participants": ["628111222333"]
}
```

#### Promote to Admin

```http
POST /groups/participants/promote
```

**Body:**

```json
{
  "sessionId": "mysession",
  "groupId": "123456789@g.us",
  "participants": ["628111222333"]
}
```

#### Demote from Admin

```http
POST /groups/participants/demote
```

**Body:**

```json
{
  "sessionId": "mysession",
  "groupId": "123456789@g.us",
  "participants": ["628111222333"]
}
```

#### Update Group Subject (Name)

```http
POST /groups/subject
```

**Body:**

```json
{
  "sessionId": "mysession",
  "groupId": "123456789@g.us",
  "subject": "New Group Name"
}
```

#### Update Group Description

```http
POST /groups/description
```

**Body:**

```json
{
  "sessionId": "mysession",
  "groupId": "123456789@g.us",
  "description": "This is the new group description"
}
```

#### Update Group Settings

```http
POST /groups/settings
```

**Body:**

```json
{
  "sessionId": "mysession",
  "groupId": "123456789@g.us",
  "setting": "announcement"
}
```

| Setting            | Description                          |
| ------------------ | ------------------------------------ |
| `announcement`     | Only admins can send messages        |
| `not_announcement` | All participants can send messages   |
| `locked`           | Only admins can edit group info      |
| `unlocked`         | All participants can edit group info |

#### Update Group Picture

```http
POST /groups/picture
```

**Body:**

```json
{
  "sessionId": "mysession",
  "groupId": "123456789@g.us",
  "imageUrl": "https://example.com/group-pic.jpg"
}
```

#### Leave Group

```http
POST /groups/leave
```

**Body:**

```json
{
  "sessionId": "mysession",
  "groupId": "123456789@g.us"
}
```

#### Join Group via Invite

```http
POST /groups/join
```

**Body:**

```json
{
  "sessionId": "mysession",
  "inviteCode": "https://chat.whatsapp.com/AbCdEfGhIjKlMn"
}
```

#### Get Invite Code

```http
POST /groups/invite-code
```

**Body:**

```json
{
  "sessionId": "mysession",
  "groupId": "123456789@g.us"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "groupId": "123456789@g.us",
    "inviteCode": "AbCdEfGhIjKlMn",
    "inviteLink": "https://chat.whatsapp.com/AbCdEfGhIjKlMn"
  }
}
```

#### Revoke Invite Code

```http
POST /groups/revoke-invite
```

**Body:**

```json
{
  "sessionId": "mysession",
  "groupId": "123456789@g.us"
}
```

---

## 🔌 WebSocket Events

Connect to WebSocket server at `ws://localhost:3000`

### Connection

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

// Subscribe to a session
socket.emit("subscribe", "mysession");

// Unsubscribe from a session
socket.emit("unsubscribe", "mysession");
```

### Events

| Event                | Description                             | Payload                                                        |
| -------------------- | --------------------------------------- | -------------------------------------------------------------- |
| `qr`                 | QR code generated                       | `{ sessionId, qrCode, timestamp }`                             |
| `pair.code`          | Pair code generated                     | `{ sessionId, pairCode, timestamp }`                           |
| `otp`                | OTP code extracted from message         | `{ sessionId, messageId, chatId, otpCode, sender, timestamp }` |
| `connection.update`  | Connection status changed               | `{ sessionId, status, phoneNumber?, name?, timestamp }`        |
| `message`            | New message received                    | `{ sessionId, message, timestamp }`                            |
| `message.sent`       | Message sent confirmation               | `{ sessionId, message, timestamp }`                            |
| `message.update`     | Message status update (read, delivered) | `{ sessionId, update, timestamp }`                             |
| `message.reaction`   | Message reaction added                  | `{ sessionId, reactions, timestamp }`                          |
| `message.revoke`     | Message deleted/revoked                 | `{ sessionId, key, participant, timestamp }`                   |
| `chat.update`        | Chat updated                            | `{ sessionId, chats, timestamp }`                              |
| `chat.upsert`        | New chat created                        | `{ sessionId, chats, timestamp }`                              |
| `chat.delete`        | Chat deleted                            | `{ sessionId, chatIds, timestamp }`                            |
| `contact.update`     | Contact updated                         | `{ sessionId, contacts, timestamp }`                           |
| `presence.update`    | Typing, online status                   | `{ sessionId, presence, timestamp }`                           |
| `group.participants` | Group members changed                   | `{ sessionId, update, timestamp }`                             |
| `group.update`       | Group info changed                      | `{ sessionId, update, timestamp }`                             |
| `call`               | Incoming call                           | `{ sessionId, call, timestamp }`                               |
| `labels`             | Labels updated (business)               | `{ sessionId, labels, timestamp }`                             |
| `logged.out`         | Session logged out                      | `{ sessionId, message, timestamp }`                            |

### Example: Listen for Messages

```javascript
const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected to WebSocket");
  socket.emit("subscribe", "mysession");
});

socket.on("message", (data) => {
  console.log("New message:", data.message);
  // {
  //   sessionId: 'mysession',
  //   message: {
  //     id: 'ABC123',
  //     from: '628123456789@s.whatsapp.net',
  //     text: 'Hello!',
  //     timestamp: 1234567890,
  //     ...
  //   },
  //   timestamp: '2024-01-15T10:30:00.000Z'
  // }
});

socket.on("qr", (data) => {
  console.log("Scan QR Code:", data.qrCode);
});

socket.on("connection.update", (data) => {
  console.log("Connection status:", data.status);
  if (data.status === "connected") {
    console.log(`Connected as ${data.name} (${data.phoneNumber})`);
  }
});
```

### WebSocket Test Page

Open `http://localhost:3000/ws-test` in your browser for an interactive WebSocket testing interface.

---

## 🪝 Webhooks

You can configure multiple webhook URLs to receive events from your WhatsApp session. Each webhook can subscribe to specific events.

### Setup Multiple Webhooks

Set webhooks when creating or updating a session:

```bash
# When creating session with multiple webhooks
curl -X POST http://localhost:3000/api/whatsapp/sessions/mysession/connect \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": { "userId": "123" },
    "webhooks": [
      { "url": "https://primary-server.com/webhook", "events": ["all"] },
      { "url": "https://analytics.example.com/webhook", "events": ["message"] },
      { "url": "https://backup.example.com/webhook", "events": ["connection.update"] }
    ]
  }'

# Add a webhook to existing session
curl -X POST http://localhost:3000/api/whatsapp/sessions/mysession/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://new-webhook.com/endpoint",
    "events": ["message", "connection.update"]
  }'

# Remove a webhook
curl -X DELETE http://localhost:3000/api/whatsapp/sessions/mysession/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://new-webhook.com/endpoint"
  }'

# Update all webhooks
curl -X PATCH http://localhost:3000/api/whatsapp/sessions/mysession/config \
  -H "Content-Type: application/json" \
  -d '{
    "webhooks": [
      { "url": "https://only-this-one.com/webhook", "events": ["all"] }
    ]
  }'
```

### Webhook Payload

All configured webhook endpoints will receive POST requests with this format:

```json
{
  "event": "message",
  "sessionId": "mysession",
  "metadata": {
    "userId": "123",
    "customField": "value"
  },
  "data": {
    "id": "ABC123",
    "from": "628123456789@s.whatsapp.net",
    "text": "Hello!",
    "timestamp": 1234567890
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Webhook Headers

| Header             | Value              |
| ------------------ | ------------------ |
| `Content-Type`     | `application/json` |
| `X-Webhook-Source` | `whatsbridge-api`  |
| `X-Session-Id`     | Session ID         |
| `X-Webhook-Event`  | Event name         |

### Available Webhook Events

| Event               | Description                                         |
| ------------------- | --------------------------------------------------- |
| `connection.update` | Connection status changed (connected, disconnected) |
| `message`           | New message received                                |
| `message.sent`      | Message sent confirmation                           |

Set `events: ["all"]` to receive all events, or specify individual events per webhook.

### WebSocket Stats

```http
GET /api/websocket/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalConnections": 5,
    "sessionRooms": {
      "mysession": 2,
      "othersession": 1
    }
  }
}
```

---

## 📁 Project Structure

```
whatsbridge/
├── index.ts                 # Application entry point (TypeScript)
├── package.json
├── tsconfig.json            # TypeScript configuration
├── .env                     # Environment variables
├── README.md                # Documentation
├── data/
│   └── api-keys.json        # Custom API keys storage (auto-generated)
├── public/
│   ├── dashboard.html       # Admin dashboard
│   ├── websocket-test.html  # WebSocket test page
│   └── media/               # Auto-saved media files
│       └── {sessionId}/
│           └── {chatId}/
├── sessions/                # Session authentication data
│   └── {sessionId}/
│       ├── creds.json
│       └── store.json
└── src/
    ├── config/
    │   ├── swagger.ts        # Swagger/OpenAPI configuration
    │   └── swagger-paths.ts  # API endpoint documentation
    ├── middleware/
    │   └── apiKeyAuth.ts     # API key authentication middleware
    ├── routes/
    │   └── whatsapp.ts       # API routes
    ├── services/
    │   ├── apiKey/
    │   │   └── ApiKeyService.ts  # API key management service
    │   ├── websocket/
    │   │   └── WebSocketManager.ts
    │   └── whatsapp/
    │       ├── index.ts
    │       ├── WhatsAppManager.ts
    │       ├── WhatsAppSession.ts
    │       ├── BaileysStore.ts
    │       └── MessageFormatter.ts
    └── types/
        ├── express.d.ts      # Express type extensions
        └── index.ts          # Shared TypeScript types
```

---

## 📝 Examples

### Node.js Client

```javascript
const axios = require("axios");

const API_URL = "http://localhost:3000/api/whatsapp";

// Create session
async function createSession(sessionId) {
  const response = await axios.post(`${API_URL}/sessions/${sessionId}/connect`);
  return response.data;
}

// Send message
async function sendMessage(sessionId, to, message) {
  const response = await axios.post(`${API_URL}/chats/send-text`, {
    sessionId,
    to,
    message,
  });
  return response.data;
}

// Get all groups
async function getGroups(sessionId) {
  const response = await axios.post(`${API_URL}/groups`, { sessionId });
  return response.data;
}
```

### Python Client

```python
import requests

API_URL = 'http://localhost:3000/api/whatsapp'

# Create session
def create_session(session_id):
    response = requests.post(f'{API_URL}/sessions/{session_id}/connect')
    return response.json()

# Send message
def send_message(session_id, to, message):
    response = requests.post(f'{API_URL}/chats/send-text', json={
        'sessionId': session_id,
        'to': to,
        'message': message
    })
    return response.json()

# Get all groups
def get_groups(session_id):
    response = requests.post(f'{API_URL}/groups', json={
        'sessionId': session_id
    })
    return response.json()
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Quick Links

| Resource             | URL                                       |
| -------------------- | ----------------------------------------- |
| 🎛️ Dashboard         | http://localhost:3000/                    |
| 📚 API Documentation | http://localhost:3000/docs                |
| 📚 API Base URL      | http://localhost:3000/api/whatsapp        |
| 🔌 WebSocket Test    | http://localhost:3000/ws-test             |
| 📊 WebSocket Stats   | http://localhost:3000/api/websocket/stats |
| ❤️ Health Check      | http://localhost:3000/api/health          |

---

## ⚠️ Disclaimer

This project is not affiliated with WhatsApp or Meta. Use at your own risk. Make sure to comply with WhatsApp's Terms of Service.
