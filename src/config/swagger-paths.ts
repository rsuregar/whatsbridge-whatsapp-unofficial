/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Check if server is running
 *     security: []
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Server is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /api/websocket/stats:
 *   get:
 *     tags: [WebSocket]
 *     summary: Get WebSocket stats
 *     description: Get current WebSocket connection statistics
 *     security: []
 *     responses:
 *       200:
 *         description: WebSocket statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalConnections:
 *                       type: integer
 *                     rooms:
 *                       type: object
 */

/**
 * @swagger
 * /api/dashboard/login:
 *   post:
 *     tags: [Dashboard]
 *     summary: Dashboard login
 *     description: Authenticate to access the dashboard
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */

// ==================== SESSIONS ====================

/**
 * @swagger
 * /api/whatsapp/sessions:
 *   get:
 *     tags: [Sessions]
 *     summary: List all sessions
 *     description: Get list of all WhatsApp sessions
 *     responses:
 *       200:
 *         description: Sessions list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Session'
 */

/**
 * @swagger
 * /api/whatsapp/sessions/{sessionId}/connect:
 *   post:
 *     tags: [Sessions]
 *     summary: Create/Connect session
 *     description: Create a new session or reconnect existing session
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         example: mysession
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metadata:
 *                 type: object
 *                 description: Custom metadata
 *                 example: { "userId": "123", "plan": "premium" }
 *               webhooks:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Webhook'
 *     responses:
 *       200:
 *         description: Session created/connected
 *       400:
 *         description: Session already exists
 */

/**
 * @swagger
 * /api/whatsapp/sessions/{sessionId}/status:
 *   get:
 *     tags: [Sessions]
 *     summary: Get session status
 *     description: Get detailed status of a session
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session status
 *       404:
 *         description: Session not found
 */

/**
 * @swagger
 * /api/whatsapp/sessions/{sessionId}/qr:
 *   get:
 *     tags: [Sessions]
 *     summary: Get QR code
 *     description: Get QR code for session authentication (base64)
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     qrCode:
 *                       type: string
 *                       description: Base64 QR code image
 */

/**
 * @swagger
 * /api/whatsapp/sessions/{sessionId}/qr/image:
 *   get:
 *     tags: [Sessions]
 *     summary: Get QR code image
 *     description: Get QR code as PNG image
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code PNG image
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 */

/**
 * @swagger
 * /api/whatsapp/sessions/{sessionId}/pairing-code:
 *   post:
 *     tags: [Sessions]
 *     summary: Request pairing code
 *     description: "Request a pairing code to connect WhatsApp Web without QR code. Phone number must be numbers only (no +, (), or -), must include country code. This is NOT Mobile API, it's a method to connect WhatsApp Web without QR code. You can connect only with one device."
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber]
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "628123456789"
 *                 description: Phone number with country code (numbers only, no +, (), or -)
 *           examples:
 *             default:
 *               value:
 *                 phoneNumber: "628123456789"
 *     responses:
 *       200:
 *         description: Pairing code generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                     pairingCode:
 *                       type: string
 *                       description: 8-digit pairing code
 *                     phoneNumber:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: "pair_ready"
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Session not found
 */

/**
 * @swagger
 * /api/whatsapp/sessions/{sessionId}/config:
 *   patch:
 *     tags: [Sessions]
 *     summary: Update session config
 *     description: Update metadata and webhooks for a session
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metadata:
 *                 type: object
 *               webhooks:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Webhook'
 *     responses:
 *       200:
 *         description: Config updated
 */

/**
 * @swagger
 * /api/whatsapp/sessions/{sessionId}/webhooks:
 *   post:
 *     tags: [Sessions]
 *     summary: Add webhook
 *     description: Add a new webhook to session
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Webhook'
 *     responses:
 *       200:
 *         description: Webhook added
 *   delete:
 *     tags: [Sessions]
 *     summary: Remove webhook
 *     description: Remove a webhook from session
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Webhook removed
 */

/**
 * @swagger
 * /api/whatsapp/sessions/{sessionId}:
 *   delete:
 *     tags: [Sessions]
 *     summary: Delete session
 *     description: Logout and delete a session
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session deleted
 */

// ==================== MESSAGING ====================

/**
 * @swagger
 * /api/whatsapp/chats/send-text:
 *   post:
 *     tags: [Messaging]
 *     summary: Send text message
 *     description: "Send a text message to a chat with optional mention support. Mention users in group chats by including @phoneNumber in the message text (e.g., 'Hello @628123456789, @628987654321!'). A whitelabel footer (format: > _footerName_) will be automatically appended if configured. Priority: payload footerName > session metadata > environment variable (MESSAGE_FOOTER)."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, chatId, message]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: mysession
 *               chatId:
 *                 type: string
 *                 example: "628123456789"
 *                 description: Phone number or group JID
 *               message:
 *                 type: string
 *                 example: "Hello @628123456789, @628987654321!"
 *                 description: Message text. Supports @phoneNumber format for mentions. Works in both personal and group chats. Phone numbers are automatically parsed to JID format (phoneNumber@s.whatsapp.net).
 *               footerName:
 *                 type: string
 *                 description: Optional footer name to override session metadata or env variable
 *                 example: "My Company"
 *               typingTime:
 *                 type: integer
 *                 example: 2000
 *                 description: Typing indicator duration (ms)
 *                 default: 0
 *               checkNumber:
 *                 type: boolean
 *                 example: false
 *                 default: false
 *                 description: If true, checks if phone number is registered before sending
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["628123456789", "628987654321"]
 *                 description: Array of phone numbers to mention. Also supports @phoneNumber in message text. Works in both personal and group chats. Phone numbers are automatically parsed to JID format (phoneNumber@s.whatsapp.net).
 *               previewLinks:
 *                 type: boolean
 *                 example: false
 *                 default: false
 *                 description: "Enable link preview generation for URLs in message (requires link-preview-js). When enabled, Baileys will automatically generate preview cards for URLs in the message."
 *           examples:
 *             default:
 *               value:
 *                 sessionId: "mysession"
 *                 chatId: "628123456789"
 *                 message: "Hello @628123456789, @628987654321!"
 *                 footerName: "My Company"
 *                 typingTime: 2000
 *                 checkNumber: false
 *                 mentions: []
 *     responses:
 *       200:
 *         description: Message sent
 *       400:
 *         description: Phone number not registered (when checkNumber is true)
 */

/**
 * @swagger
 * /api/whatsapp/chats/send-image:
 *   post:
 *     tags: [Messaging]
 *     summary: Send image message
 *     description: "Send an image with optional caption. A whitelabel footer (format: > _footerName_) will be automatically appended to the caption if configured. Priority: payload footerName > session metadata > environment variable (MESSAGE_FOOTER)."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, chatId, imageUrl]
 *             properties:
 *               sessionId:
 *                 type: string
 *               chatId:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *                 example: https://example.com/image.jpg
 *               caption:
 *                 type: string
 *                 description: Optional caption text. Supports @phoneNumber format for mentions. Works in both personal and group chats. Phone numbers are automatically parsed to JID format (phoneNumber@s.whatsapp.net).
 *                 example: "Check this out @628123456789!"
 *               footerName:
 *                 type: string
 *                 description: Optional footer name to override session metadata or env variable
 *                 example: "My Company"
 *               typingTime:
 *                 type: integer
 *               checkNumber:
 *                 type: boolean
 *                 example: false
 *                 description: If true, checks if phone number is registered before sending
 *               compress:
 *                 type: boolean
 *                 example: true
 *                 description: "Compress image before sending (default: true)"
 *               quality:
 *                 type: integer
 *                 example: 80
 *                 description: "Image quality 1-100 (default: 80)"
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["628123456789", "628987654321"]
 *                 description: Array of phone numbers to mention. Also supports @phoneNumber in caption text (e.g., "Hello @628123456789!"). Works in both personal and group chats. Phone numbers are automatically parsed to JID format (phoneNumber@s.whatsapp.net).
 *               viewOnce:
 *                 type: boolean
 *                 example: false
 *                 default: false
 *                 description: "Enable view once message. When enabled, the image can only be viewed once by the recipient. Works with image, video, and audio messages."
 *           examples:
 *             default:
 *               value:
 *                 sessionId: "mysession"
 *                 chatId: "628123456789"
 *                 imageUrl: "https://example.com/image.jpg"
 *                 caption: "Check this out @628123456789!"
 *                 footerName: "My Company"
 *                 typingTime: 0
 *                 checkNumber: false
 *                 compress: true
 *                 quality: 80
 *                 mentions: []
 *     responses:
 *       200:
 *         description: Image sent
 *       400:
 *         description: Phone number not registered (when checkNumber is true)
 */

/**
 * @swagger
 * /api/whatsapp/chats/send-document:
 *   post:
 *     tags: [Messaging]
 *     summary: Send document
 *     description: "Send a document/file with optional mention support. Mention users in group chats by including @phoneNumber in the caption text (e.g., 'Please review @628123456789!'). A whitelabel footer (format: > _footerName_) will be automatically appended to the caption if configured. Priority: payload footerName > session metadata > environment variable (MESSAGE_FOOTER)."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, chatId, documentUrl, filename]
 *             properties:
 *               sessionId:
 *                 type: string
 *               chatId:
 *                 type: string
 *               documentUrl:
 *                 type: string
 *                 example: https://example.com/document.pdf
 *               filename:
 *                 type: string
 *                 example: document.pdf
 *               mimetype:
 *                 type: string
 *                 example: application/pdf
 *               caption:
 *                 type: string
 *                 description: Optional caption text for the document. Supports @phoneNumber format for mentions. Works in both personal and group chats. Phone numbers are automatically parsed to JID format (phoneNumber@s.whatsapp.net).
 *                 example: "Please review this document @628123456789!"
 *               footerName:
 *                 type: string
 *                 description: Optional footer name to override session metadata or env variable
 *                 example: "My Company"
 *               typingTime:
 *                 type: integer
 *               checkNumber:
 *                 type: boolean
 *                 example: false
 *                 description: If true, checks if phone number is registered before sending
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["628123456789", "628987654321"]
 *                 description: Array of phone numbers to mention. Also supports @phoneNumber in caption text. Works in both personal and group chats. Phone numbers are automatically parsed to JID format (phoneNumber@s.whatsapp.net).
 *               viewOnce:
 *                 type: boolean
 *                 example: false
 *                 default: false
 *                 description: "Enable view once message. When enabled, the document/media can only be viewed once by the recipient. Works with image, video, and audio messages."
 *           examples:
 *             default:
 *               value:
 *                 sessionId: "mysession"
 *                 chatId: "628123456789"
 *                 documentUrl: "https://example.com/document.pdf"
 *                 filename: "document.pdf"
 *                 mimetype: "application/pdf"
 *                 caption: "Please review this document @628123456789!"
 *                 footerName: "My Company"
 *                 typingTime: 0
 *                 checkNumber: false
 *                 mentions: []
 *     responses:
 *       200:
 *         description: Document sent
 *       400:
 *         description: Phone number not registered (when checkNumber is true)
 */

/**
 * @swagger
 * /api/whatsapp/chats/send-location:
 *   post:
 *     tags: [Messaging]
 *     summary: Send location
 *     description: "Send a location message. A whitelabel footer (format: > _footerName_) will be automatically appended to the location name if configured. Priority: payload footerName > session metadata > environment variable (MESSAGE_FOOTER)."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, chatId, latitude, longitude]
 *             properties:
 *               sessionId:
 *                 type: string
 *               chatId:
 *                 type: string
 *               latitude:
 *                 type: number
 *                 example: -6.2088
 *               longitude:
 *                 type: number
 *                 example: 106.8456
 *               name:
 *                 type: string
 *                 example: Jakarta
 *               footerName:
 *                 type: string
 *                 description: Optional footer name to override session metadata or env variable
 *                 example: "My Company"
 *               typingTime:
 *                 type: integer
 *               checkNumber:
 *                 type: boolean
 *                 example: false
 *                 description: If true, checks if phone number is registered before sending
 *           examples:
 *             default:
 *               value:
 *                 sessionId: "mysession"
 *                 chatId: "628123456789"
 *                 latitude: -6.2088
 *                 longitude: 106.8456
 *                 name: "Jakarta, Indonesia"
 *                 footerName: "My Company"
 *                 typingTime: 0
 *                 checkNumber: false
 *     responses:
 *       200:
 *         description: Location sent
 *       400:
 *         description: Phone number not registered (when checkNumber is true)
 */

/**
 * @swagger
 * /api/whatsapp/chats/send-contact:
 *   post:
 *     tags: [Messaging]
 *     summary: Send contact
 *     description: Send a contact card
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, chatId, contactName, contactPhone]
 *             properties:
 *               sessionId:
 *                 type: string
 *               chatId:
 *                 type: string
 *               contactName:
 *                 type: string
 *                 example: John Doe
 *               contactPhone:
 *                 type: string
 *                 example: "628987654321"
 *               typingTime:
 *                 type: integer
 *               checkNumber:
 *                 type: boolean
 *                 example: false
 *                 description: If true, checks if phone number is registered before sending
 *           examples:
 *             default:
 *               value:
 *                 sessionId: "mysession"
 *                 chatId: "628123456789"
 *                 contactName: "John Doe"
 *                 contactPhone: "628987654321"
 *                 typingTime: 0
 *                 checkNumber: false
 *     responses:
 *       200:
 *         description: Contact sent
 *       400:
 *         description: Phone number not registered (when checkNumber is true)
 */

/**
 * @swagger
 * /api/whatsapp/chats/send-button:
 *   post:
 *     tags: [Messaging]
 *     summary: Send button message
 *     description: "Send a message with interactive buttons. A whitelabel footer (format: > _footerName_) will be automatically appended to the footer if configured. Priority: payload footerName > session metadata > environment variable (MESSAGE_FOOTER)."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, chatId, text, buttons]
 *             properties:
 *               sessionId:
 *                 type: string
 *               chatId:
 *                 type: string
 *               text:
 *                 type: string
 *                 example: Choose an option
 *               footer:
 *                 type: string
 *               footerName:
 *                 type: string
 *                 description: Optional footer name to override session metadata or env variable
 *                 example: "My Company"
 *               buttons:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Option 1", "Option 2", "Option 3"]
 *               typingTime:
 *                 type: integer
 *               checkNumber:
 *                 type: boolean
 *                 example: false
 *                 description: If true, checks if phone number is registered before sending
 *           examples:
 *             default:
 *               value:
 *                 sessionId: "mysession"
 *                 chatId: "628123456789"
 *                 text: "Please choose an option:"
 *                 footer: "Powered by WhatsBridge"
 *                 footerName: "My Company"
 *                 buttons: ["Option 1", "Option 2", "Option 3"]
 *                 typingTime: 0
 *                 checkNumber: false
 *     responses:
 *       200:
 *         description: Button message sent
 *       400:
 *         description: Phone number not registered (when checkNumber is true)
 */

/**
 * @swagger
 * /api/whatsapp/chats/send-otp:
 *   post:
 *     tags: [Messaging]
 *     summary: Send OTP message
 *     description: "Send a One-Time Password (OTP) message. The OTP code is formatted in a simple text format that makes it easy to select and copy directly from WhatsApp. The default format is 'Paste kode OTP' followed by the OTP code on a separate line."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, chatId, otpCode]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: mysession
 *               chatId:
 *                 type: string
 *                 example: "628123456789"
 *               otpCode:
 *                 type: string
 *                 example: "123456"
 *                 description: OTP code (4-8 digits)
 *               message:
 *                 type: string
 *                 description: Optional custom message (default format will be used if empty)
 *               expiryMinutes:
 *                 type: integer
 *                 example: 5
 *                 description: "Expiry time in minutes (default: 5)"
 *               typingTime:
 *                 type: integer
 *                 example: 0
 *               footerName:
 *                 type: string
 *                 example: "My Company"
 *               checkNumber:
 *                 type: boolean
 *                 example: false
 *           examples:
 *             default:
 *               value:
 *                 sessionId: "mysession"
 *                 chatId: "628123456789"
 *                 otpCode: "123456"
 *                 message: ""
 *                 expiryMinutes: 5
 *                 typingTime: 0
 *                 footerName: "My Company"
 *                 checkNumber: false
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid OTP format or phone number not registered
 */

/**
 * @swagger
 * /api/whatsapp/chats/extract-otp:
 *   post:
 *     tags: [Messaging]
 *     summary: Extract OTP from message text
 *     description: "Extract OTP code from message text. Supports various formats including 'Your code is 123456', 'OTP: 123456', 'Copy Code: 123456', and standalone 4-8 digit numbers."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, messageText]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: mysession
 *               messageText:
 *                 type: string
 *                 example: "Your verification code is: 123456"
 *           examples:
 *             default:
 *               value:
 *                 sessionId: "mysession"
 *                 messageText: "Your verification code is: 123456"
 *     responses:
 *       200:
 *         description: OTP extracted successfully (or not found)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     otpCode:
 *                       type: string
 *                       nullable: true
 *                     messageText:
 *                       type: string
 */

/**
 * @swagger
 * /api/whatsapp/chats/broadcast:
 *   post:
 *     tags: [Messaging]
 *     summary: Send broadcast messages with anti-ban features
 *     description: "Send messages to multiple recipients with configurable delays, batch processing, and typing simulation to avoid WhatsApp bans. Includes random delays between messages and batch delays to mimic human behavior."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, recipients, message]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: mysession
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["628123456789", "628987654321", "628111222333"]
 *                 description: Array of phone numbers or chat IDs
 *               message:
 *                 type: string
 *                 example: "Hello! This is a broadcast message."
 *               typingTime:
 *                 type: integer
 *                 example: 1000
 *                 description: "Typing duration in ms before each message (default: 1000)"
 *               minDelay:
 *                 type: integer
 *                 example: 2000
 *                 description: "Minimum random delay between messages in ms (default: 2000)"
 *               maxDelay:
 *                 type: integer
 *                 example: 5000
 *                 description: "Maximum random delay between messages in ms (default: 5000)"
 *               batchSize:
 *                 type: integer
 *                 example: 10
 *                 description: "Number of messages per batch (default: 10, max: 50)"
 *               batchDelay:
 *                 type: integer
 *                 example: 30000
 *                 description: "Delay between batches in ms (default: 30000)"
 *               footerName:
 *                 type: string
 *                 example: "My Company"
 *               checkNumber:
 *                 type: boolean
 *                 example: false
 *           examples:
 *             default:
 *               value:
 *                 sessionId: "mysession"
 *                 recipients: ["628123456789", "628987654321"]
 *                 message: "Hello! This is a broadcast message."
 *                 typingTime: 1000
 *                 minDelay: 2000
 *                 maxDelay: 5000
 *                 batchSize: 10
 *                 batchDelay: 30000
 *                 footerName: "My Company"
 *                 checkNumber: false
 *     responses:
 *       200:
 *         description: Broadcast completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     success:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *                     results:
 *                       type: array
 *                     errors:
 *                       type: array
 */

/**
 * @swagger
 * /api/whatsapp/chats/bulk-send-text:
 *   post:
 *     tags: [Messaging]
 *     summary: Bulk send text messages (different messages to different recipients)
 *     description: "Send different text messages to different recipients with anti-ban features. Each item in the array can have a different message."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, items]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: mysession
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [phone, message]
 *                   properties:
 *                     phone:
 *                       type: string
 *                       example: "628123456789"
 *                     message:
 *                       type: string
 *                       example: "Hello! Your personalized message."
 *                 example:
 *                   - phone: "628123456789"
 *                     message: "Hello User 1!"
 *                   - phone: "628987654321"
 *                     message: "Hello User 2!"
 *               typingTime:
 *                 type: integer
 *                 example: 1000
 *               minDelay:
 *                 type: integer
 *                 example: 2000
 *               maxDelay:
 *                 type: integer
 *                 example: 5000
 *               batchSize:
 *                 type: integer
 *                 example: 10
 *               batchDelay:
 *                 type: integer
 *                 example: 30000
 *               footerName:
 *                 type: string
 *                 example: "My Company"
 *               checkNumber:
 *                 type: boolean
 *                 example: false
 *           examples:
 *             default:
 *               value:
 *                 sessionId: "mysession"
 *                 items:
 *                   - phone: "628123456789"
 *                     message: "Hello User 1!"
 *                   - phone: "628987654321"
 *                     message: "Hello User 2!"
 *                 typingTime: 1000
 *                 minDelay: 2000
 *                 maxDelay: 5000
 *                 batchSize: 10
 *                 batchDelay: 30000
 *                 footerName: "My Company"
 *                 checkNumber: false
 *     responses:
 *       200:
 *         description: Bulk send completed
 */

/**
 * @swagger
 * /api/whatsapp/chats/bulk-send-image:
 *   post:
 *     tags: [Messaging]
 *     summary: Bulk send image messages (different images to different recipients)
 *     description: "Send different images to different recipients with anti-ban features."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, items]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: mysession
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [phone, imageUrl]
 *                   properties:
 *                     phone:
 *                       type: string
 *                       example: "628123456789"
 *                     imageUrl:
 *                       type: string
 *                       example: "https://example.com/image.jpg"
 *                     caption:
 *                       type: string
 *                       example: "Your image"
 *               typingTime:
 *                 type: integer
 *                 example: 1000
 *               minDelay:
 *                 type: integer
 *                 example: 2000
 *               maxDelay:
 *                 type: integer
 *                 example: 5000
 *               batchSize:
 *                 type: integer
 *                 example: 10
 *               batchDelay:
 *                 type: integer
 *                 example: 30000
 *               footerName:
 *                 type: string
 *                 example: "My Company"
 *               checkNumber:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Bulk send completed
 */

/**
 * @swagger
 * /api/whatsapp/chats/bulk-send-document:
 *   post:
 *     tags: [Messaging]
 *     summary: Bulk send document messages (different documents to different recipients)
 *     description: "Send different documents to different recipients with anti-ban features."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, items]
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: mysession
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [phone, documentUrl, filename, mimetype]
 *                   properties:
 *                     phone:
 *                       type: string
 *                       example: "628123456789"
 *                     documentUrl:
 *                       type: string
 *                       example: "https://example.com/document.pdf"
 *                     filename:
 *                       type: string
 *                       example: "document.pdf"
 *                     mimetype:
 *                       type: string
 *                       example: "application/pdf"
 *                     caption:
 *                       type: string
 *                       example: "Your document"
 *               typingTime:
 *                 type: integer
 *                 example: 1000
 *               minDelay:
 *                 type: integer
 *                 example: 2000
 *               maxDelay:
 *                 type: integer
 *                 example: 5000
 *               batchSize:
 *                 type: integer
 *                 example: 10
 *               batchDelay:
 *                 type: integer
 *                 example: 30000
 *               footerName:
 *                 type: string
 *                 example: "My Company"
 *               checkNumber:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Bulk send completed
 */

/**
 * @swagger
 * /api/whatsapp/chats/presence:
 *   post:
 *     tags: [Messaging]
 *     summary: Send presence update
 *     description: Send typing/recording indicator
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, chatId, presence]
 *             properties:
 *               sessionId:
 *                 type: string
 *               chatId:
 *                 type: string
 *               presence:
 *                 type: string
 *                 enum: [composing, recording, paused, available, unavailable]
 *     responses:
 *       200:
 *         description: Presence updated
 */

/**
 * @swagger
 * /api/whatsapp/chats/check-number:
 *   post:
 *     tags: [Messaging]
 *     summary: Check WhatsApp number
 *     description: Check if a phone number is registered on WhatsApp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, phone]
 *             properties:
 *               sessionId:
 *                 type: string
 *               phone:
 *                 type: string
 *                 example: "628123456789"
 *     responses:
 *       200:
 *         description: Number check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     exists:
 *                       type: boolean
 *                     jid:
 *                       type: string
 */

// ==================== CHAT HISTORY ====================

/**
 * @swagger
 * /api/whatsapp/chats/overview:
 *   post:
 *     tags: [Chat History]
 *     summary: Get chat overview
 *     description: Get list of all chats with last message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId]
 *             properties:
 *               sessionId:
 *                 type: string
 *               limit:
 *                 type: integer
 *                 example: 50
 *               offset:
 *                 type: integer
 *                 example: 0
 *               type:
 *                 type: string
 *                 enum: [all, individual, group]
 *     responses:
 *       200:
 *         description: Chat list
 */

/**
 * @swagger
 * /api/whatsapp/chats/messages:
 *   post:
 *     tags: [Chat History]
 *     summary: Get chat messages
 *     description: Get messages from a specific chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, chatId]
 *             properties:
 *               sessionId:
 *                 type: string
 *               chatId:
 *                 type: string
 *               limit:
 *                 type: integer
 *                 example: 50
 *               cursor:
 *                 type: string
 *                 description: Pagination cursor
 *     responses:
 *       200:
 *         description: Messages list
 */

/**
 * @swagger
 * /api/whatsapp/chats/info:
 *   post:
 *     tags: [Chat History]
 *     summary: Get chat info
 *     description: Get detailed information about a chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, chatId]
 *             properties:
 *               sessionId:
 *                 type: string
 *               chatId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chat information
 */

/**
 * @swagger
 * /api/whatsapp/chats/mark-read:
 *   post:
 *     tags: [Chat History]
 *     summary: Mark chat as read
 *     description: Mark all messages in a chat as read
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, chatId]
 *             properties:
 *               sessionId:
 *                 type: string
 *               chatId:
 *                 type: string
 *               messageId:
 *                 type: string
 *                 description: Specific message to mark as read
 *     responses:
 *       200:
 *         description: Chat marked as read
 */

/**
 * @swagger
 * /api/whatsapp/contacts:
 *   post:
 *     tags: [Chat History]
 *     summary: Get contacts
 *     description: Get all contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId]
 *             properties:
 *               sessionId:
 *                 type: string
 *               limit:
 *                 type: integer
 *               offset:
 *                 type: integer
 *               search:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contacts list
 */

/**
 * @swagger
 * /api/whatsapp/chats/profile-picture:
 *   post:
 *     tags: [Chat History]
 *     summary: Get profile picture
 *     description: Get profile picture URL of a contact
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, phone]
 *             properties:
 *               sessionId:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile picture URL
 */

/**
 * @swagger
 * /api/whatsapp/chats/contact-info:
 *   post:
 *     tags: [Chat History]
 *     summary: Get contact info
 *     description: Get detailed contact information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, phone]
 *             properties:
 *               sessionId:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact information
 */

// ==================== GROUPS ====================

/**
 * @swagger
 * /api/whatsapp/groups:
 *   post:
 *     tags: [Groups]
 *     summary: List groups
 *     description: Get all groups for a session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId]
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Groups list
 */

/**
 * @swagger
 * /api/whatsapp/groups/create:
 *   post:
 *     tags: [Groups]
 *     summary: Create group
 *     description: Create a new WhatsApp group
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, name, participants]
 *             properties:
 *               sessionId:
 *                 type: string
 *               name:
 *                 type: string
 *                 example: My New Group
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["628123456789", "628987654321"]
 *     responses:
 *       200:
 *         description: Group created
 */

/**
 * @swagger
 * /api/whatsapp/groups/metadata:
 *   post:
 *     tags: [Groups]
 *     summary: Get group metadata
 *     description: Get detailed group information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, groupId]
 *             properties:
 *               sessionId:
 *                 type: string
 *               groupId:
 *                 type: string
 *                 example: "120363123456789@g.us"
 *     responses:
 *       200:
 *         description: Group metadata
 */

/**
 * @swagger
 * /api/whatsapp/groups/participants/add:
 *   post:
 *     tags: [Groups]
 *     summary: Add participants
 *     description: Add participants to a group
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, groupId, participants]
 *             properties:
 *               sessionId:
 *                 type: string
 *               groupId:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Participants added
 */

/**
 * @swagger
 * /api/whatsapp/groups/participants/remove:
 *   post:
 *     tags: [Groups]
 *     summary: Remove participants
 *     description: Remove participants from a group
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, groupId, participants]
 *             properties:
 *               sessionId:
 *                 type: string
 *               groupId:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Participants removed
 */

/**
 * @swagger
 * /api/whatsapp/groups/participants/promote:
 *   post:
 *     tags: [Groups]
 *     summary: Promote to admin
 *     description: Promote participants to group admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, groupId, participants]
 *             properties:
 *               sessionId:
 *                 type: string
 *               groupId:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Participants promoted
 */

/**
 * @swagger
 * /api/whatsapp/groups/participants/demote:
 *   post:
 *     tags: [Groups]
 *     summary: Demote from admin
 *     description: Demote admins to regular participants
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, groupId, participants]
 *             properties:
 *               sessionId:
 *                 type: string
 *               groupId:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Participants demoted
 */

/**
 * @swagger
 * /api/whatsapp/groups/subject:
 *   post:
 *     tags: [Groups]
 *     summary: Update group subject
 *     description: Change group name/subject
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, groupId, subject]
 *             properties:
 *               sessionId:
 *                 type: string
 *               groupId:
 *                 type: string
 *               subject:
 *                 type: string
 *                 example: New Group Name
 *     responses:
 *       200:
 *         description: Subject updated
 */

/**
 * @swagger
 * /api/whatsapp/groups/description:
 *   post:
 *     tags: [Groups]
 *     summary: Update group description
 *     description: Change group description
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, groupId, description]
 *             properties:
 *               sessionId:
 *                 type: string
 *               groupId:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Description updated
 */

/**
 * @swagger
 * /api/whatsapp/groups/settings:
 *   post:
 *     tags: [Groups]
 *     summary: Update group settings
 *     description: Change group settings (who can send messages, edit info)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, groupId, setting]
 *             properties:
 *               sessionId:
 *                 type: string
 *               groupId:
 *                 type: string
 *               setting:
 *                 type: string
 *                 enum: [announcement, not_announcement, locked, unlocked]
 *     responses:
 *       200:
 *         description: Settings updated
 */

/**
 * @swagger
 * /api/whatsapp/groups/picture:
 *   post:
 *     tags: [Groups]
 *     summary: Update group picture
 *     description: Change group profile picture
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, groupId, imageUrl]
 *             properties:
 *               sessionId:
 *                 type: string
 *               groupId:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Picture updated
 */

/**
 * @swagger
 * /api/whatsapp/groups/leave:
 *   post:
 *     tags: [Groups]
 *     summary: Leave group
 *     description: Leave a WhatsApp group
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, groupId]
 *             properties:
 *               sessionId:
 *                 type: string
 *               groupId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Left group
 */

/**
 * @swagger
 * /api/whatsapp/groups/join:
 *   post:
 *     tags: [Groups]
 *     summary: Join group
 *     description: Join a group using invite code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, inviteCode]
 *             properties:
 *               sessionId:
 *                 type: string
 *               inviteCode:
 *                 type: string
 *                 example: AbCdEfGhIjK
 *     responses:
 *       200:
 *         description: Joined group
 */

/**
 * @swagger
 * /api/whatsapp/groups/invite-code:
 *   post:
 *     tags: [Groups]
 *     summary: Get invite code
 *     description: Get group invite code/link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, groupId]
 *             properties:
 *               sessionId:
 *                 type: string
 *               groupId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invite code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     inviteCode:
 *                       type: string
 *                     inviteLink:
 *                       type: string
 */

/**
 * @swagger
 * /api/whatsapp/groups/revoke-invite:
 *   post:
 *     tags: [Groups]
 *     summary: Revoke invite code
 *     description: Revoke current invite code and generate new one
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, groupId]
 *             properties:
 *               sessionId:
 *                 type: string
 *               groupId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invite revoked
 */

// ==================== WEBSOCKET DOCUMENTATION ====================

/**
 * @swagger
 * tags:
 *   - name: WebSocket
 *     description: |
 *       ## Real-time WebSocket Events
 *
 *       Connect to the WebSocket server for real-time updates.
 *
 *       ### Connection
 *       ```javascript
 *       const socket = io('ws://your-server:3000');
 *       ```
 *
 *       ### Subscribe to Session Events
 *       ```javascript
 *       // Subscribe to receive events from a specific session
 *       socket.emit('subscribe', 'your-session-id');
 *
 *       // Unsubscribe from session events
 *       socket.emit('unsubscribe', 'your-session-id');
 *       ```
 *
 *       ### Available Events
 *
 *       | Event | Description | Payload |
 *       |-------|-------------|---------|
 *       | `qr` | QR code generated for authentication | `{ sessionId, qr, qrCode }` |
 *       | `connection.update` | Connection status changed | `{ sessionId, status, isConnected }` |
 *       | `message` | New incoming message | `{ sessionId, message, chatId, ... }` |
 *       | `message.sent` | Message sent confirmation | `{ sessionId, messageId, status }` |
 *       | `message.update` | Message status update (delivered/read) | `{ sessionId, messageId, status }` |
 *       | `message.revoke` | Message deleted/revoked | `{ sessionId, messageId, chatId }` |
 *       | `chat.update` | Chat updated | `{ sessionId, chat }` |
 *       | `chat.upsert` | New chat created | `{ sessionId, chat }` |
 *       | `chat.delete` | Chat deleted | `{ sessionId, chatId }` |
 *       | `contact.update` | Contact updated | `{ sessionId, contact }` |
 *       | `presence.update` | Presence status (typing, online) | `{ sessionId, chatId, presence }` |
 *       | `group.participants` | Group members update | `{ sessionId, groupId, action, participants }` |
 *       | `group.update` | Group info update | `{ sessionId, groupId, update }` |
 *       | `call` | Incoming call | `{ sessionId, call }` |
 *       | `logged.out` | Session logged out | `{ sessionId, reason }` |
 *
 *       ### Example: Listen for Messages
 *       ```javascript
 *       socket.on('message', (data) => {
 *         console.log('New message:', data);
 *         // data.sessionId - Which session received the message
 *         // data.message - Message content and metadata
 *         // data.chatId - Chat/sender ID
 *       });
 *       ```
 *
 *       ### Example: Listen for Connection Updates
 *       ```javascript
 *       socket.on('connection.update', (data) => {
 *         console.log('Connection status:', data.status);
 *         // data.status: 'connecting', 'connected', 'disconnected'
 *       });
 *       ```
 *
 *       ### Example: Listen for QR Code
 *       ```javascript
 *       socket.on('qr', (data) => {
 *         console.log('Scan this QR:', data.qrCode);
 *         // data.qrCode - Base64 encoded QR image
 *       });
 *       ```
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WebSocketEvent:
 *       type: object
 *       description: WebSocket event payload structure
 *       properties:
 *         sessionId:
 *           type: string
 *           description: Session that triggered the event
 *           example: mysession
 *         event:
 *           type: string
 *           description: Event type
 *           example: message
 *         data:
 *           type: object
 *           description: Event-specific data
 *
 *     QREvent:
 *       type: object
 *       description: QR code event payload
 *       properties:
 *         sessionId:
 *           type: string
 *           example: mysession
 *         qr:
 *           type: string
 *           description: Raw QR string data
 *         qrCode:
 *           type: string
 *           description: Base64 encoded QR code image (data:image/png;base64,...)
 *
 *     ConnectionUpdateEvent:
 *       type: object
 *       description: Connection status update event
 *       properties:
 *         sessionId:
 *           type: string
 *           example: mysession
 *         status:
 *           type: string
 *           enum: [connecting, connected, disconnected]
 *           example: connected
 *         isConnected:
 *           type: boolean
 *           example: true
 *         phoneNumber:
 *           type: string
 *           example: "628123456789"
 *         name:
 *           type: string
 *           example: John Doe
 *
 *     MessageEvent:
 *       type: object
 *       description: Incoming message event
 *       properties:
 *         sessionId:
 *           type: string
 *           example: mysession
 *         message:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: Message ID
 *             chatId:
 *               type: string
 *               description: Chat/sender JID
 *             fromMe:
 *               type: boolean
 *               description: Was sent by the session user
 *             timestamp:
 *               type: integer
 *               description: Unix timestamp
 *             type:
 *               type: string
 *               enum: [text, image, video, audio, document, sticker, location, contact]
 *             content:
 *               type: object
 *               description: Message content based on type
 *             pushName:
 *               type: string
 *               description: Sender display name
 *
 *     MessageUpdateEvent:
 *       type: object
 *       description: Message status update event
 *       properties:
 *         sessionId:
 *           type: string
 *         messageId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, sent, delivered, read, played]
 *         chatId:
 *           type: string
 *
 *     PresenceUpdateEvent:
 *       type: object
 *       description: Presence/typing indicator event
 *       properties:
 *         sessionId:
 *           type: string
 *         chatId:
 *           type: string
 *         presence:
 *           type: string
 *           enum: [composing, recording, paused, available, unavailable]
 *         lastSeen:
 *           type: integer
 *           description: Last seen timestamp (if available)
 *
 *     GroupParticipantsEvent:
 *       type: object
 *       description: Group participants update event
 *       properties:
 *         sessionId:
 *           type: string
 *         groupId:
 *           type: string
 *           example: "120363123456789@g.us"
 *         action:
 *           type: string
 *           enum: [add, remove, promote, demote]
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *           example: ["628123456789@s.whatsapp.net"]
 *         actor:
 *           type: string
 *           description: Who performed the action
 *
 *     CallEvent:
 *       type: object
 *       description: Incoming call event
 *       properties:
 *         sessionId:
 *           type: string
 *         call:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             from:
 *               type: string
 *             isVideo:
 *               type: boolean
 *             isGroup:
 *               type: boolean
 *             status:
 *               type: string
 *               enum: [offer, ringing, timeout, reject, accept]
 */

module.exports = {};
