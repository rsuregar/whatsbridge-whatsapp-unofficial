import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  getContentType,
} from "@whiskeysockets/baileys";
import pino from "pino";
import path from "path";
import fs from "fs";
import qrcode from "qrcode";

import BaileysStore from "./BaileysStore";
import MessageFormatter from "./MessageFormatter";
import wsManager from "../websocket/WebSocketManager";

/**
 * WhatsApp Session Class
 * Mengelola satu sesi WhatsApp
 */
class WhatsAppSession {
  private sessionId: string;
  private socket: any;
  private qrCode: string | null;
  private pairCode: string | null;
  private connectionStatus:
    | "connected"
    | "disconnected"
    | "connecting"
    | "qr_ready"
    | "pair_ready"
    | "error";
  private authFolder: string;
  private storeFile: string;
  private configFile: string;
  private mediaFolder: string;
  private phoneNumber: string | null;
  private name: string | null;
  private store: BaileysStore | null;
  private storeInterval: NodeJS.Timeout | null;
  private authState: any;
  private metadata: Record<string, any>;
  private webhooks: Array<{ url: string; events?: string[] }>;

  constructor(sessionId: string, options: any = {}) {
    this.sessionId = sessionId;
    this.socket = null;
    this.qrCode = null;
    this.pairCode = null;
    this.connectionStatus = "disconnected";
    this.authFolder = path.join(process.cwd(), "sessions", sessionId);
    this.storeFile = path.join(this.authFolder, "store.json");
    this.configFile = path.join(this.authFolder, "config.json");
    this.mediaFolder = path.join(process.cwd(), "public", "media", sessionId);
    this.phoneNumber = null;
    this.name = null;
    this.store = null;
    this.storeInterval = null;

    // Custom metadata and webhook
    this.metadata = options.metadata || {};
    this.webhooks = options.webhooks || []; // Array of { url, events? }

    // Load config if exists
    this._loadConfig();
  }

  /**
   * Load session config from file
   */
  _loadConfig(): void {
    try {
      if (fs.existsSync(this.configFile)) {
        const config = JSON.parse(fs.readFileSync(this.configFile, "utf8"));
        this.metadata = config.metadata || this.metadata;
        this.webhooks = config.webhooks || this.webhooks;
      }
    } catch (e: any | Error) {
      console.log(
        `⚠️ [${this.sessionId}] Could not load config:`,
        e instanceof Error ? e.message : String(e)
      );
    }
  }

  /**
   * Save session config to file
   */
  _saveConfig(): void {
    try {
      if (!fs.existsSync(this.authFolder)) {
        fs.mkdirSync(this.authFolder, { recursive: true });
      }
      fs.writeFileSync(
        this.configFile,
        JSON.stringify(
          {
            metadata: this.metadata,
            webhooks: this.webhooks,
          },
          null,
          2
        )
      );
    } catch (e: any | Error) {
      console.log(
        `⚠️ [${this.sessionId}] Could not save config:`,
        e instanceof Error ? e.message : String(e)
      );
    }
  }

  /**
   * Update session config
   */
  updateConfig(options: any = {}): any {
    if (options.metadata !== undefined) {
      this.metadata = { ...this.metadata, ...options.metadata };
    }
    if (options.webhooks !== undefined) {
      this.webhooks = options.webhooks;
    }
    this._saveConfig();
    return this.getInfo();
  }

  /**
   * Add a webhook URL
   */
  addWebhook(url: string, events: string[] = ["all"]): any {
    // Check if already exists
    const exists = this.webhooks.find((w) => w.url === url);
    if (exists) {
      exists.events = events;
    } else {
      this.webhooks.push({ url, events });
    }
    this._saveConfig();
    return this.getInfo();
  }

  /**
   * Remove a webhook URL
   */
  removeWebhook(url: string): any {
    this.webhooks = this.webhooks.filter((w) => w.url !== url);
    this._saveConfig();
    return this.getInfo();
  }

  /**
   * Check for pair code in saved credentials file
   */
  _checkPairCodeFromFile(): void {
    try {
      const credsFile = path.join(this.authFolder, "creds.json");
      if (fs.existsSync(credsFile)) {
        const credsData = JSON.parse(fs.readFileSync(credsFile, "utf8"));
        if (credsData?.pairingCode && credsData.pairingCode !== this.pairCode) {
          this.pairCode = credsData.pairingCode;
          this.connectionStatus = "pair_ready";
          this.qrCode = null;
          console.log(
            `🔢 [${this.sessionId}] Pair Code found in creds file: ${this.pairCode}`
          );
          if (this.pairCode) {
            wsManager.emitPairCode(this.sessionId, this.pairCode);
          }
        }
      }
    } catch (e: any | Error) {
      // Silent fail - file might not exist or be locked
    }
  }

  /**
   * Get footer text from payload, metadata, or environment variable
   * Priority: payload > metadata > environment variable
   * Format: > _footerName_ (markdown blockquote with italic)
   * @param {string} [payloadFooterName] - Optional footer name from request payload
   * @returns {string} Footer text or empty string
   */
  _getFooter(payloadFooterName: string | null = null): string {
    // Priority: payload > metadata > environment variable
    const footerName =
      payloadFooterName ||
      this.metadata?.footerName ||
      process.env.MESSAGE_FOOTER ||
      "";

    if (!footerName) {
      return "";
    }

    // Format: > _footerName_
    return `\n\n> _${footerName}_`;
  }

  /**
   * Send webhook notification to all configured webhook URLs
   */
  async _sendWebhook(event: string, data: any): Promise<void> {
    if (!this.webhooks || this.webhooks.length === 0) return;

    const payload = {
      event,
      sessionId: this.sessionId,
      metadata: this.metadata,
      data,
      timestamp: new Date().toISOString(),
    };

    // Send to all webhooks in parallel
    const promises = this.webhooks.map(async (webhook) => {
      // Check if event should be sent to this webhook
      const events = webhook.events || ["all"];
      if (!events.includes("all") && !events.includes(event)) {
        return;
      }

      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Source": "whatsbridge-api",
            "X-Session-Id": this.sessionId,
            "X-Webhook-Event": event,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.log(
            `⚠️ [${this.sessionId}] Webhook to ${webhook.url} failed: ${response.status}`
          );
        }
      } catch (error: any) {
        console.log(
          `⚠️ [${this.sessionId}] Webhook to ${webhook.url} error:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    });

    // Wait for all webhooks to complete (non-blocking)
    Promise.all(promises).catch(() => {});
  }

  // ==================== CONNECTION ====================

  async connect(): Promise<any> {
    try {
      // Pastikan folder auth ada
      if (!fs.existsSync(this.authFolder)) {
        fs.mkdirSync(this.authFolder, { recursive: true });
      }

      // Initialize custom in-memory store with sessionId
      this.store = new BaileysStore(this.sessionId);

      // Load existing store data if available
      if (fs.existsSync(this.storeFile)) {
        try {
          this.store.readFromFile(this.storeFile);
          console.log(`📂 [${this.sessionId}] Store data loaded from file`);
        } catch (e: any | Error) {
          console.log(
            `⚠️ [${this.sessionId}] Could not load store file:`,
            e instanceof Error ? e.message : String(e)
          );
        }
      }

      // Save store periodically (every 30 seconds) and cleanup old media
      this.storeInterval = setInterval(() => {
        try {
          // Cleanup old media files before saving (keep only last 100 per chat)
          if (this.store) {
            this.store.cleanupOldMedia(100);
            this.store.writeToFile(this.storeFile);
          }
          // Also check for pair code in saved credentials
          this._checkPairCodeFromFile();
        } catch (e: any | Error) {
          // Silent fail
        }
      }, 30_000);

      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
      this.authState = state; // Store reference to auth state
      const { version } = await fetchLatestBaileysVersion();

      // Check if pair code exists in saved credentials
      if (state.creds?.pairingCode) {
        this.pairCode = state.creds.pairingCode;
        this.connectionStatus = "pair_ready";
        console.log(
          `🔢 [${this.sessionId}] Pair Code found in credentials: ${this.pairCode}`
        );
        wsManager.emitPairCode(this.sessionId, this.pairCode);
      }

      this.socket = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "silent" }),
        browser: ["WhatsBridge API", "Chrome", "1.0.0"],
        syncFullHistory: true,
      });

      // Store reference to socket's auth state if available
      if (this.socket.authState) {
        this.authState = this.socket.authState;
      }

      // Bind store to socket events
      this.store.bind(this.socket.ev);

      // Setup event listeners
      this._setupEventListeners(saveCreds);

      // Check for pair code after a short delay (in case it's generated asynchronously)
      setTimeout(() => {
        this._checkPairCodeFromFile();
      }, 2000);

      return { success: true, message: "Initializing connection..." };
    } catch (error: any | Error) {
      console.error(`[${this.sessionId}] Error connecting:`, error);
      this.connectionStatus = "error";
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  _setupEventListeners(saveCreds: () => void): void {
    // Connection update
    this.socket.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, qr, isNewLogin } = update;

      // Debug: Log update structure when QR or pair code might be available
      if (connection === "connecting" || connection === "open") {
        // Log all update fields to help debug pair code detection
        const relevantKeys = Object.keys(update).filter(
          (key) =>
            !["connection", "lastDisconnect"].includes(key) &&
            (key.toLowerCase().includes("pair") ||
              key.toLowerCase().includes("code") ||
              key.toLowerCase().includes("qr") ||
              key === "isNewLogin")
        );
        if (relevantKeys.length > 0) {
          console.log(
            `🔍 [${this.sessionId}] Connection update (relevant keys):`,
            relevantKeys.join(", ")
          );
          // Log the actual values for debugging (without sensitive data)
          relevantKeys.forEach((key) => {
            const value = update[key];
            if (typeof value === "string" && value.length < 50) {
              console.log(`  ${key}:`, value);
            }
          });
        }
      }

      if (qr) {
        this.qrCode = await qrcode.toDataURL(qr);
        this.connectionStatus = "qr_ready";
        this.pairCode = null;
        console.log(
          `📱 [${this.sessionId}] QR Code generated! Scan dengan WhatsApp Anda.`
        );

        // Emit QR code to WebSocket
        wsManager.emitQRCode(this.sessionId, this.qrCode);
      }

      // Handle pair code - check multiple possible field names
      // Baileys might use different field names in different versions
      const pairCode =
        update.pairingCode ||
        update.pairCode ||
        update.pair_code ||
        update.pairing_code ||
        update.code;

      if (pairCode && typeof pairCode === "string") {
        this.pairCode = pairCode;
        this.connectionStatus = "pair_ready";
        this.qrCode = null;
        console.log(
          `🔢 [${this.sessionId}] Pair Code generated: ${this.pairCode}`
        );

        // Emit pair code to WebSocket
        wsManager.emitPairCode(this.sessionId, this.pairCode);
      }

      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut;

        console.log(
          `❌ [${this.sessionId}] Connection closed:`,
          lastDisconnect?.error?.message
        );
        this.connectionStatus = "disconnected";
        this.qrCode = null;
        this.pairCode = null;

        // Emit connection status to WebSocket
        wsManager.emitConnectionStatus(this.sessionId, "disconnected", {
          reason: lastDisconnect?.error?.message,
          shouldReconnect,
        });

        // Send webhook
        this._sendWebhook("connection.update", {
          status: "disconnected",
          reason: lastDisconnect?.error?.message,
          shouldReconnect,
        });

        if (shouldReconnect) {
          console.log(`🔄 [${this.sessionId}] Reconnecting...`);
          setTimeout(() => this.connect(), 5000);
        } else {
          console.log(`🚪 [${this.sessionId}] Logged out.`);
          wsManager.emitLoggedOut(this.sessionId);
          this.deleteAuthFolder();
        }
      } else if (connection === "open") {
        console.log(`✅ [${this.sessionId}] WhatsApp Connected Successfully!`);
        this.connectionStatus = "connected";
        this.qrCode = null;
        this.pairCode = null;

        if (this.socket.user) {
          this.phoneNumber = this.socket.user.id.split(":")[0];
          // Use sessionId as default instead of "Unknown"
          this.name = this.socket.user.name || this.sessionId;
          console.log(
            `👤 [${this.sessionId}] Connected as: ${this.name} (${this.phoneNumber})`
          );
        } else {
          // If socket.user is not available yet, use sessionId as default
          this.name = this.sessionId;
        }

        // Fetch profile name asynchronously (might not be available immediately after connection)
        this._fetchProfileName().catch((err) => {
          console.log(
            `⚠️ [${this.sessionId}] Could not fetch profile name:`,
            err.message
          );
        });

        // Emit connection status to WebSocket
        wsManager.emitConnectionStatus(this.sessionId, "connected", {
          phoneNumber: this.phoneNumber,
          name: this.name,
        });

        // Send webhook
        this._sendWebhook("connection.update", {
          status: "connected",
          phoneNumber: this.phoneNumber,
          name: this.name,
        });
      } else if (connection === "connecting") {
        console.log(`🔄 [${this.sessionId}] Connecting to WhatsApp...`);
        this.connectionStatus = "connecting";

        // Emit connection status to WebSocket
        wsManager.emitConnectionStatus(this.sessionId, "connecting");
      }
    });

    // Save credentials and check for pair code updates
    this.socket.ev.on("creds.update", () => {
      saveCreds();
      // Check if pair code was generated/updated in credentials
      // Try multiple ways to access the credentials
      const creds =
        this.socket?.authState?.creds ||
        this.authState?.creds ||
        (this.socket as any)?.user?.creds;

      if (creds?.pairingCode) {
        const newPairCode = creds.pairingCode;
        if (newPairCode !== this.pairCode && newPairCode) {
          this.pairCode = newPairCode;
          this.connectionStatus = "pair_ready";
          this.qrCode = null;
          console.log(
            `🔢 [${this.sessionId}] Pair Code updated from credentials: ${this.pairCode}`
          );
          if (this.pairCode) {
            wsManager.emitPairCode(this.sessionId, this.pairCode);
          }
        }
      }
    });

    // Messages upsert (new messages)
    this.socket.ev.on("messages.upsert", async (m: any) => {
      const message = m.messages[0];
      if (!message.key.fromMe && m.type === "notify") {
        console.log(
          `📩 [${this.sessionId}] New message from:`,
          message.key.remoteJid
        );

        // Auto-save media if present
        await this._autoSaveMedia(message);

        // Emit message to WebSocket
        const formattedMessage = MessageFormatter.formatMessage(message);
        wsManager.emitMessage(this.sessionId, formattedMessage);

        // If message contains OTP, emit OTP event
        if (formattedMessage?.otpCode) {
          wsManager.emitOTP(this.sessionId, {
            messageId: formattedMessage.id,
            chatId: formattedMessage.chatId,
            otpCode: formattedMessage.otpCode,
            sender: formattedMessage.sender,
            timestamp: formattedMessage.timestamp,
          });
        }

        // Send webhook
        this._sendWebhook("message", formattedMessage);
      } else if (message.key.fromMe && m.type === "notify") {
        // Message sent confirmation
        const formattedMessage = MessageFormatter.formatMessage(message);
        wsManager.emitMessageSent(this.sessionId, formattedMessage);

        // Send webhook
        this._sendWebhook("message.sent", formattedMessage);
      }
    });

    // Messages update (status: read, delivered, etc)
    this.socket.ev.on("messages.update", (updates: any) => {
      wsManager.emitMessageStatus(this.sessionId, updates);
    });

    // Message reaction
    this.socket.ev.on("messages.reaction", (reactions: any) => {
      wsManager.emitToSession(this.sessionId, "message.reaction", {
        reactions,
      });
    });

    // Chats upsert
    this.socket.ev.on("chats.upsert", (chats: any) => {
      console.log(
        `💬 [${this.sessionId}] Chats updated: ${chats.length} chats`
      );
      wsManager.emitChatsUpsert(this.sessionId, chats);
    });

    // Chats update
    this.socket.ev.on("chats.update", (chats: any) => {
      wsManager.emitChatUpdate(this.sessionId, chats);
    });

    // Chats delete
    this.socket.ev.on("chats.delete", (chatIds: any) => {
      wsManager.emitChatDelete(this.sessionId, chatIds);
    });

    // Contacts upsert
    this.socket.ev.on("contacts.upsert", (contacts: any) => {
      console.log(
        `👥 [${this.sessionId}] Contacts updated: ${contacts.length} contacts`
      );
      wsManager.emitContactUpdate(this.sessionId, contacts);
    });

    // Contacts update
    this.socket.ev.on("contacts.update", (contacts: any) => {
      wsManager.emitContactUpdate(this.sessionId, contacts);
    });

    // Presence update (typing, online, etc)
    this.socket.ev.on("presence.update", (presence: any) => {
      wsManager.emitPresence(this.sessionId, presence);
    });

    // Group participants update
    this.socket.ev.on("group-participants.update", (update: any) => {
      wsManager.emitGroupParticipants(this.sessionId, update);
    });

    // Groups update
    this.socket.ev.on("groups.update", (updates: any) => {
      wsManager.emitGroupUpdate(this.sessionId, updates);
    });

    // Call events
    this.socket.ev.on("call", (calls: any) => {
      wsManager.emitCall(this.sessionId, calls);
    });

    // Labels (for business accounts)
    this.socket.ev.on("labels.edit", (label: any) => {
      wsManager.emitLabels(this.sessionId, { type: "edit", label });
    });

    this.socket.ev.on("labels.association", (association: any) => {
      wsManager.emitLabels(this.sessionId, {
        type: "association",
        association,
      });
    });
  }

  getInfo(): any {
    return {
      sessionId: this.sessionId,
      status: this.connectionStatus,
      isConnected: this.connectionStatus === "connected",
      phoneNumber: this.phoneNumber,
      name: this.name,
      qrCode: this.qrCode,
      pairCode: this.pairCode,
      storeStats: this.store ? this.store.getStats() : null,
      metadata: this.metadata,
      webhooks: this.webhooks,
    };
  }

  async logout(): Promise<any> {
    try {
      if (this.storeInterval) {
        clearInterval(this.storeInterval);
      }

      // Clear store and delete all media files
      if (this.store) {
        this.store.clear();
      }

      // Delete media folder for this session
      this.deleteMediaFolder();

      if (this.socket) {
        await this.socket.logout();
        this.socket = null;
      }
      this.deleteAuthFolder();
      this.connectionStatus = "disconnected";
      this.qrCode = null;
      this.phoneNumber = null;
      this.name = null;
      return { success: true, message: "Logged out successfully" };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  deleteAuthFolder(): void {
    try {
      if (fs.existsSync(this.authFolder)) {
        fs.rmSync(this.authFolder, { recursive: true, force: true });
        console.log(`🗑️ [${this.sessionId}] Auth folder deleted`);
      }
    } catch (error: any) {
      console.error(`[${this.sessionId}] Error deleting auth folder:`, error);
    }
  }

  deleteMediaFolder(): void {
    try {
      if (fs.existsSync(this.mediaFolder)) {
        fs.rmSync(this.mediaFolder, { recursive: true, force: true });
        console.log(`🗑️ [${this.sessionId}] Media folder deleted`);
      }
    } catch (error: any) {
      console.error(`[${this.sessionId}] Error deleting media folder:`, error);
    }
  }

  getSocket(): any {
    return this.socket;
  }

  // ==================== HELPERS ====================

  formatPhoneNumber(phone: string): string {
    let formatted = phone.replace(/\D/g, "");
    if (formatted.startsWith("0")) {
      formatted = "62" + formatted.slice(1);
    }
    if (!formatted.includes("@")) {
      formatted = formatted + "@s.whatsapp.net";
    }
    return formatted;
  }

  formatJid(id: string, isGroup: boolean = false): string {
    if (id.includes("@")) return id;

    let formatted = id.replace(/\D/g, "");
    if (formatted.startsWith("0")) {
      formatted = "62" + formatted.slice(1);
    }

    return isGroup ? `${formatted}@g.us` : `${formatted}@s.whatsapp.net`;
  }

  formatChatId(chatId: string): string {
    if (chatId.includes("@")) return chatId;

    let formatted = chatId.replace(/\D/g, "");
    if (formatted.startsWith("0")) {
      formatted = "62" + formatted.slice(1);
    }
    return `${formatted}@s.whatsapp.net`;
  }

  isGroupId(chatId: string): boolean {
    return chatId.includes("@g.us");
  }

  // ==================== SEND MESSAGES ====================

  /**
   * Send presence update (typing indicator)
   * @param {string} chatId - Chat ID
   * @param {string} presence - 'composing' | 'recording' | 'paused'
   */
  async sendPresenceUpdate(
    chatId: string,
    presence: string = "composing"
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      const jid = this.formatChatId(chatId);
      await this.socket.sendPresenceUpdate(presence, jid);

      return { success: true, message: `Presence '${presence}' sent` };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Helper: Send typing indicator and wait
   * @param {string} jid - Formatted JID
   * @param {number} typingTime - Time in milliseconds to show typing
   */
  async _simulateTyping(jid: string, typingTime: number = 0): Promise<void> {
    if (typingTime > 0) {
      await this.socket.sendPresenceUpdate("composing", jid);
      await new Promise((resolve) => setTimeout(resolve, typingTime));
      await this.socket.sendPresenceUpdate("paused", jid);
    }
  }

  async sendTextMessage(
    chatId: string,
    message: string,
    typingTime: number = 0,
    footerName: string | null = null
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      const jid = this.formatChatId(chatId);

      // Simulate typing if typingTime > 0
      await this._simulateTyping(jid, typingTime);

      // Append footer if configured
      const footer = this._getFooter(footerName);
      const messageWithFooter = message + footer;

      const result = await this.socket.sendMessage(jid, {
        text: messageWithFooter,
      });

      return {
        success: true,
        message: "Message sent successfully",
        data: {
          messageId: result.key.id,
          chatId: jid,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendImage(
    chatId: string,
    imageUrl: string,
    caption: string = "",
    typingTime: number = 0,
    footerName: string | null = null
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      const jid = this.formatChatId(chatId);

      // Simulate typing if typingTime > 0
      await this._simulateTyping(jid, typingTime);

      // Append footer to caption if configured
      const footer = this._getFooter(footerName);
      const captionWithFooter = caption + footer;

      const result = await this.socket.sendMessage(jid, {
        image: { url: imageUrl },
        caption: captionWithFooter,
      });

      return {
        success: true,
        message: "Image sent successfully",
        data: {
          messageId: result.key.id,
          chatId: jid,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendDocument(
    chatId: string,
    documentUrl: string,
    filename: string,
    mimetype: string = "application/pdf",
    caption: string = "",
    typingTime: number = 0,
    footerName: string | null = null
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      const jid = this.formatChatId(chatId);

      // Simulate typing if typingTime > 0
      await this._simulateTyping(jid, typingTime);

      // Append footer to caption if configured
      const footer = this._getFooter(footerName);
      const captionWithFooter = caption + footer;

      const result = await this.socket.sendMessage(jid, {
        document: { url: documentUrl },
        fileName: filename,
        mimetype: mimetype,
        caption: captionWithFooter,
      });

      return {
        success: true,
        message: "Document sent successfully",
        data: {
          messageId: result.key.id,
          chatId: jid,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendLocation(
    chatId: string,
    latitude: number,
    longitude: number,
    name: string = "",
    typingTime: number = 0,
    footerName: string | null = null
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      const jid = this.formatChatId(chatId);

      // Simulate typing if typingTime > 0
      await this._simulateTyping(jid, typingTime);

      // Append footer to name if configured
      const footer = this._getFooter(footerName);
      const nameWithFooter = name + footer;

      const result = await this.socket.sendMessage(jid, {
        location: {
          degreesLatitude: latitude,
          degreesLongitude: longitude,
          name: nameWithFooter,
        },
      });

      return {
        success: true,
        message: "Location sent successfully",
        data: {
          messageId: result.key.id,
          chatId: jid,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendContact(
    chatId: string,
    contactName: string,
    contactPhone: string,
    typingTime: number = 0
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      const jid = this.formatChatId(chatId);

      // Simulate typing if typingTime > 0
      await this._simulateTyping(jid, typingTime);

      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${contactName}\nTEL;type=CELL;type=VOICE;waid=${contactPhone}:+${contactPhone}\nEND:VCARD`;

      const result = await this.socket.sendMessage(jid, {
        contacts: {
          displayName: contactName,
          contacts: [{ vcard }],
        },
      });

      return {
        success: true,
        message: "Contact sent successfully",
        data: {
          messageId: result.key.id,
          chatId: jid,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendButton(
    chatId: string,
    text: string,
    footer: string,
    buttons: string[],
    typingTime: number = 0,
    footerName: string | null = null
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      const jid = this.formatChatId(chatId);

      // Simulate typing if typingTime > 0
      await this._simulateTyping(jid, typingTime);

      // Append footer to button message footer if configured
      const whitelabelFooter = this._getFooter(footerName);
      const footerWithWhitelabel = (footer || "") + whitelabelFooter;

      const result = await this.socket.sendMessage(jid, {
        text: text,
        footer: footerWithWhitelabel || undefined,
        buttons: buttons.map((btn, idx) => ({
          buttonId: `btn_${idx}`,
          buttonText: { displayText: btn },
          type: 1,
        })),
        headerType: 1,
      });

      return {
        success: true,
        message: "Button message sent successfully",
        data: {
          messageId: result.key.id,
          chatId: jid,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ==================== OTP MESSAGES ====================

  /**
   * Send OTP message with easily copyable format
   * Uses sendTextMessage internally for reliability
   * @param chatId - Chat ID (phone number)
   * @param otpCode - OTP code to send
   * @param message - Optional custom message (default format will be used if empty)
   * @param expiryMinutes - Optional expiry time in minutes
   * @param typingTime - Typing duration in ms
   * @param footerName - Optional footer name
   * @returns ApiResponse
   */
  async sendOTP(
    chatId: string,
    otpCode: string,
    message: string = "",
    expiryMinutes: number = 5,
    typingTime: number = 0,
    footerName: string | null = null
  ): Promise<any> {
    try {
      // Format OTP message - simple text format that makes OTP easy to copy
      // The OTP code is placed on its own line with clear formatting and bold highlighting
      let otpMessage: string;
      
      if (message && message.includes("{code}")) {
        // If custom message has {code} placeholder, replace it with bold OTP code value
        // Extract {code} and replace with bold formatted OTP code
        // Ensure no spaces around asterisks for proper WhatsApp formatting
        otpMessage = message.replace(/{code}/g, `*${otpCode}*`);
      } else if (message) {
        // If message doesn't have {code}, send message as-is (no formatting changes)
        otpMessage = message;
      } else {
        // If message is empty, use default format with OTP code
        // Default format: OTP code on separate line with bold highlighting for easy selection
        otpMessage = `Paste kode OTP\n\n*${otpCode}*\n\nKode ini berlaku selama ${expiryMinutes} menit.`;
      }

      // Send message directly to ensure formatting is preserved
      // Baileys should automatically handle markdown formatting (asterisks for bold)
      try {
        if (!this.socket || this.connectionStatus !== "connected") {
          return { success: false, message: "Session not connected" };
        }

        const jid = this.formatChatId(chatId);

        // Simulate typing if typingTime > 0
        await this._simulateTyping(jid, typingTime);

        // Append footer if configured
        const footer = this._getFooter(footerName);
        const messageWithFooter = otpMessage + footer;

        // Send message - Baileys will automatically handle markdown formatting
        const result = await this.socket.sendMessage(jid, {
          text: messageWithFooter,
        });

        return {
          success: true,
          message: "OTP sent successfully",
          data: {
            messageId: result.key.id,
            chatId: jid,
            otpCode: otpCode,
            expiryMinutes: expiryMinutes,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error: any | Error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }

      // If successful, add OTP-specific data to response
      if (result.success) {
        return {
          ...result,
          data: {
            ...result.data,
            otpCode: otpCode,
            expiryMinutes: expiryMinutes,
          },
        };
      }

      return result;
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ==================== CONTACT & PROFILE ====================

  /**
   * Fetch profile name after connection (might not be available immediately)
   */
  async _fetchProfileName(): Promise<void> {
    try {
      if (!this.socket || !this.phoneNumber) return;

      // Wait a bit for profile to be available
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Try to get updated name from socket.user (might be populated after connection)
      // Only update if we have a real name (not sessionId or empty)
      if (
        this.socket.user?.name &&
        this.socket.user.name !== "Unknown" &&
        this.socket.user.name !== this.sessionId &&
        this.socket.user.name.trim().length > 0
      ) {
        this.name = this.socket.user.name;
        console.log(
          `👤 [${this.sessionId}] Profile name updated: ${this.name}`
        );
        
        // Emit updated connection status
        wsManager.emitConnectionStatus(this.sessionId, "connected", {
          phoneNumber: this.phoneNumber,
          name: this.name,
        });
        return;
      }

      // Try to get profile name from store
      if (this.store) {
        const jid = `${this.phoneNumber}@s.whatsapp.net`;
        const contactInfo = this.store.getContact(jid);
        if (
          contactInfo?.name &&
          contactInfo.name !== "Unknown" &&
          contactInfo.name !== this.sessionId &&
          contactInfo.name.trim().length > 0
        ) {
          this.name = contactInfo.name;
          console.log(
            `👤 [${this.sessionId}] Profile name updated from store: ${this.name}`
          );
          
          // Emit updated connection status
          wsManager.emitConnectionStatus(this.sessionId, "connected", {
            phoneNumber: this.phoneNumber,
            name: this.name,
          });
        }
      }
    } catch (error: any | Error) {
      // Silent fail - profile name might not be available
      console.log(
        `⚠️ [${this.sessionId}] Could not fetch profile name:`,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Update profile name (pushName)
   */
  async updateProfileName(name: string): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (!name || name.trim().length === 0) {
        return {
          success: false,
          message: "Profile name is required",
        };
      }

      // Update profile name using Baileys
      await this.socket.updateProfileName(name.trim());

      // Update local name
      this.name = name.trim();

      // Emit updated connection status
      wsManager.emitConnectionStatus(this.sessionId, "connected", {
        phoneNumber: this.phoneNumber,
        name: this.name,
      });

      return {
        success: true,
        message: "Profile name updated successfully",
        data: {
          name: this.name,
          phoneNumber: this.phoneNumber,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async isRegistered(phone: string): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      const jid = this.formatPhoneNumber(phone);
      const [result] = await this.socket.onWhatsApp(
        jid.replace("@s.whatsapp.net", "")
      );

      return {
        success: true,
        data: {
          phone: phone,
          isRegistered: !!result?.exists,
          jid: result?.jid || null,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getProfilePicture(phone: string): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      const jid = this.formatPhoneNumber(phone);
      const ppUrl = await this.socket.profilePictureUrl(jid, "image");

      return {
        success: true,
        data: {
          phone: phone,
          profilePicture: ppUrl,
        },
      };
    } catch (error: any) {
      return {
        success: true,
        data: {
          phone: phone,
          profilePicture: null,
        },
      };
    }
  }

  async getContactInfo(phone: string): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      const jid = this.formatPhoneNumber(phone);

      let profilePicture = null;
      try {
        profilePicture = await this.socket.profilePictureUrl(jid, "image");
      } catch (e) {}

      let status = null;
      try {
        const statusResult = await this.socket.fetchStatus(jid);
        status = statusResult?.status || null;
      } catch (e) {}

      let isRegistered = false;
      try {
        const [result] = await this.socket.onWhatsApp(
          jid.replace("@s.whatsapp.net", "")
        );
        isRegistered = !!result?.exists;
      } catch (e) {}

      return {
        success: true,
        data: {
          phone: phone,
          jid: jid,
          isRegistered: isRegistered,
          profilePicture: profilePicture,
          status: status,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ==================== GROUPS ====================

  async getChats(): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      const chats = await this.socket.groupFetchAllParticipating();
      const groups = Object.values(chats).map((group: any) => ({
        id: group.id,
        name: group.subject,
        isGroup: true,
        owner: group.owner,
        creation: group.creation,
        participantsCount: group.participants?.length || 0,
        desc: group.desc || null,
      }));

      return {
        success: true,
        data: {
          groups: groups,
          totalGroups: groups.length,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getGroupMetadata(groupId: string): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      const jid = this.formatJid(groupId, true);
      const metadata = await this.socket.groupMetadata(jid);

      return {
        success: true,
        data: {
          id: metadata.id,
          name: metadata.subject,
          owner: metadata.owner,
          creation: metadata.creation,
          desc: metadata.desc || null,
          descId: metadata.descId || null,
          participants: metadata.participants.map((p: any) => ({
            id: p.id,
            admin: p.admin || null,
            phone: p.id.split("@")[0],
          })),
          participantsCount: metadata.participants.length,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ==================== CHAT HISTORY ====================

  /**
   * Get chats overview - OPTIMIZED VERSION using pre-computed cache
   */
  async getChatsOverview(
    limit: number = 50,
    offset: number = 0,
    type: string = "all"
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (!this.store) {
        return { success: false, message: "Store not initialized" };
      }

      // Use fast method from BaileysStore
      const result = this.store.getChatsOverviewFast({
        limit: 1000,
        offset: 0,
      });
      let chats = result.data;

      // Filter by type if needed
      if (type === "group") {
        chats = chats.filter((c) => c.isGroup);
      } else if (type === "personal") {
        chats = chats.filter((c) => !c.isGroup);
      }

      // Fetch missing profile pictures in parallel (batch)
      const chatsNeedingPics = chats
        .filter((c) => !c.profilePicture)
        .slice(0, 20);
      if (chatsNeedingPics.length > 0) {
        const picPromises = chatsNeedingPics.map(async (chat) => {
          try {
            const url = await this.socket.profilePictureUrl(chat.id, "image");
            if (this.store) {
              this.store.setProfilePicture(chat.id, url);
            }
            chat.profilePicture = url;
          } catch (e: any | Error) {
            // No profile picture available
          }
        });
        await Promise.all(picPromises);
      }

      // Apply pagination
      const total = chats.length;
      const paginatedChats = chats.slice(offset, offset + limit);

      // Transform to expected format
      const formattedChats = paginatedChats.map((chat) => ({
        id: chat.id,
        name: chat.name,
        phone: chat.isGroup ? null : chat.id.split("@")[0],
        isGroup: chat.isGroup,
        profilePicture: chat.profilePicture,
        participantsCount: null,
        lastMessage: chat.lastMessage?.preview || null,
        lastMessageTimestamp:
          chat.lastMessage?.timestamp || chat.conversationTimestamp || 0,
        unreadCount: chat.unreadCount || 0,
      }));

      return {
        success: true,
        data: {
          total: total,
          limit: limit,
          offset: offset,
          hasMore: offset + limit < total,
          chats: formattedChats,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get contacts list - OPTIMIZED VERSION using cache
   */
  async getContacts(
    limit: number = 100,
    offset: number = 0,
    search: string = ""
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (!this.store) {
        return { success: false, message: "Store not initialized" };
      }

      // Use fast method from BaileysStore
      const result = this.store.getContactsFast({
        limit: 1000,
        offset: 0,
        search,
      });
      let contacts = result.data;

      // Apply pagination
      const total = contacts.length;
      const paginatedContacts = contacts.slice(offset, offset + limit);

      // Fetch missing profile pictures in parallel (batch of 20 max)
      const contactsNeedingPics = paginatedContacts
        .filter((c) => !c.profilePicture)
        .slice(0, 20);
      if (contactsNeedingPics.length > 0) {
        const picPromises = contactsNeedingPics.map(async (contact) => {
          try {
            const url = await this.socket.profilePictureUrl(
              contact.id,
              "image"
            );
            if (this.store) {
              this.store.setProfilePicture(contact.id, url);
            }
            contact.profilePicture = url;
          } catch (e: any | Error) {
            // No profile picture available
          }
        });
        await Promise.all(picPromises);
      }

      // Transform to expected format
      const formattedContacts = paginatedContacts.map((c) => ({
        id: c.id,
        phone: c.id.split("@")[0],
        name: c.name,
        shortName: c.notify || null,
        pushName: c.notify || null,
        profilePicture: c.profilePicture,
      }));

      return {
        success: true,
        data: {
          total: total,
          limit: limit,
          offset: offset,
          hasMore: offset + limit < total,
          contacts: formattedContacts,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getChatMessages(
    chatId: string,
    limit: number = 50,
    cursor: string | null = null
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      const jid = this.formatChatId(chatId);
      const isGroup = this.isGroupId(jid);

      let messages = [];

      // Try to fetch from server first (if fetchMessageHistory is available)
      if (typeof this.socket.fetchMessageHistory === "function") {
        try {
          const cursorMsg = cursor
            ? {
                before: {
                  id: cursor,
                  fromMe: false,
                  remoteJid: jid,
                },
              }
            : undefined;

          const result = await this.socket.fetchMessageHistory(
            limit,
            cursorMsg,
            jid
          );
          if (Array.isArray(result)) {
            messages = result;
          }
        } catch (fetchError) {
          // Silent fail, will use store as fallback
        }
      }

      // Fallback: Try to get messages from store
      if (messages.length === 0 && this.store) {
        try {
          const storeMessages = this.store.getMessages(jid, {
            limit,
            before: cursor,
          });
          if (storeMessages && storeMessages.length > 0) {
            messages = storeMessages;
          }
        } catch (storeError) {
          console.log(
            `[${this.sessionId}] Store messages error:`,
            storeError instanceof Error
              ? storeError.message
              : String(storeError)
          );
        }
      }

      const formattedMessages = messages
        .filter((msg) => msg && msg.key) // Filter invalid messages
        .map((msg) => MessageFormatter.formatMessage(msg))
        .filter((msg) => msg !== null);

      return {
        success: true,
        data: {
          chatId: jid,
          isGroup: isGroup,
          total: formattedMessages.length,
          limit: limit,
          cursor:
            formattedMessages.length > 0
              ? formattedMessages[formattedMessages.length - 1].id
              : null,
          hasMore: formattedMessages.length === limit,
          messages: formattedMessages,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getChatInfo(chatId: string): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      const jid = this.formatChatId(chatId);
      const isGroup = this.isGroupId(jid);

      let profilePicture = null;
      try {
        profilePicture = await this.socket.profilePictureUrl(jid, "image");
      } catch (e) {}

      if (isGroup) {
        try {
          const metadata = await this.socket.groupMetadata(jid);
          return {
            success: true,
            data: {
              id: jid,
              name: metadata.subject,
              isGroup: true,
              profilePicture: profilePicture,
              owner: metadata.owner,
              ownerPhone: metadata.owner?.split("@")[0],
              creation: metadata.creation,
              description: metadata.desc || null,
              participants: metadata.participants.map((p: any) => ({
                id: p.id,
                phone: p.id.split("@")[0],
                isAdmin: p.admin === "admin" || p.admin === "superadmin",
                isSuperAdmin: p.admin === "superadmin",
              })),
              participantsCount: metadata.participants.length,
            },
          };
        } catch (e: any | Error) {
          return { success: false, message: "Failed to get group info" };
        }
      } else {
        const phone = jid.split("@")[0];

        let status = null;
        try {
          const statusResult = await this.socket.fetchStatus(jid);
          status = statusResult?.status || null;
        } catch (e: any | Error) {}

        let isRegistered = false;
        try {
          const [result] = await this.socket.onWhatsApp(phone);
          isRegistered = !!result?.exists;
        } catch (e: any | Error) {}

        return {
          success: true,
          data: {
            id: jid,
            phone: phone,
            isGroup: false,
            profilePicture: profilePicture,
            status: status,
            isRegistered: isRegistered,
          },
        };
      }
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ==================== CHAT READ STATUS ====================

  /**
   * Mark a chat as read
   * @param {string} chatId - Chat ID (phone number or group ID)
   * @param {string|null} messageId - Optional specific message ID to mark as read
   */
  async markChatRead(
    chatId: string,
    messageId: string | null = null
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      const jid = this.formatChatId(chatId);

      // If specific message ID provided, use it
      if (messageId) {
        await this.socket.readMessages([
          {
            remoteJid: jid,
            id: messageId,
            participant: this.isGroupId(jid) ? undefined : undefined,
          },
        ]);
      } else {
        // Mark all messages in chat as read using chatModify
        await this.socket.chatModify({ markRead: true, lastMessages: [] }, jid);
      }

      console.log(`✅ [${this.sessionId}] Chat marked as read: ${jid}`);

      return {
        success: true,
        message: "Chat marked as read",
        data: {
          chatId: jid,
          messageId: messageId || null,
        },
      };
    } catch (error: any | Error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[${this.sessionId}] Mark read error:`, errorMessage);
      return { success: false, message: errorMessage };
    }
  }

  // ==================== MEDIA DOWNLOAD ====================

  /**
   * Auto-save media when message received
   */
  async _autoSaveMedia(message: any): Promise<string | null> {
    try {
      if (!message.message) return null;

      const contentType = getContentType(message.message);
      const mediaTypes = [
        "imageMessage",
        "audioMessage",
        "documentMessage",
        "stickerMessage",
      ]; // 'videoMessage' can be added if needed

      if (!contentType || !mediaTypes.includes(contentType)) return null;

      const mediaContent = message.message[contentType];
      if (!mediaContent) return null;

      // Download media
      const buffer = await downloadMediaMessage(
        message,
        "buffer",
        {},
        {
          logger: pino({ level: "silent" }),
          reuploadRequest: this.socket?.updateMediaMessage,
        }
      );

      // Create media folder structure: public/media/{sessionId}/{chatId}/
      const chatId = message.key.remoteJid
        .replace("@s.whatsapp.net", "")
        .replace("@g.us", "");
      const mediaDir = path.join(this.mediaFolder, chatId);

      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }

      // Generate filename
      const mimetype =
        mediaContent.mimetype || this._getMimetypeFromContentType(contentType);
      const ext = this._getExtFromMimetype(mimetype);
      const filename = mediaContent.fileName || `${message.key.id}.${ext}`;
      const filePath = path.join(mediaDir, filename);

      // Save file
      fs.writeFileSync(filePath, buffer);

      // Register media file in store for cleanup tracking
      if (this.store) {
        this.store.registerMediaFile(message.key.id, filePath);
      }

      // Store media path in message for later reference
      const relativePath = `/media/${this.sessionId}/${chatId}/${filename}`;

      console.log(`💾 [${this.sessionId}] Media saved: ${relativePath}`);

      // Media path is already tracked via registerMediaFile above
      // The store will handle message updates through its event bindings

      return relativePath;
    } catch (error: any | Error) {
      console.error(
        `[${this.sessionId}] Auto-save media error:`,
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  _getMimetypeFromContentType(contentType: string): string {
    const map: Record<string, string> = {
      imageMessage: "image/jpeg",
      audioMessage: "audio/ogg",
      documentMessage: "application/pdf",
      stickerMessage: "image/webp",
    };
    return map[contentType] || "application/octet-stream";
  }

  _getExtFromMimetype(mimetype: string): string {
    const map: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
      "video/mp4": "mp4",
      "video/3gpp": "3gp",
      "audio/ogg": "ogg",
      "audio/ogg; codecs=opus": "ogg",
      "audio/mpeg": "mp3",
      "audio/mp4": "m4a",
      "application/pdf": "pdf",
    };
    return map[mimetype] || mimetype.split("/")[1]?.split(";")[0] || "bin";
  }

  // Legacy methods for backward compatibility
  async getMessages(
    chatId: string,
    _isGroup: boolean = false,
    limit: number = 50
  ): Promise<any> {
    return this.getChatMessages(chatId, limit, null);
  }

  async fetchMessages(
    chatId: string,
    _isGroup: boolean = false,
    limit: number = 50,
    cursor: string | null = null
  ): Promise<any> {
    return this.getChatMessages(chatId, limit, cursor);
  }

  // ==================== GROUP MANAGEMENT ====================

  /**
   * Create a new group
   * @param {string} name - Group name/subject
   * @param {Array<string>} participants - Array of phone numbers to add
   * @returns {Object}
   */
  async createGroup(name: string, participants: string[]): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (
        !name ||
        !participants ||
        !Array.isArray(participants) ||
        participants.length === 0
      ) {
        return {
          success: false,
          message: "Group name and at least one participant are required",
        };
      }

      // Format participant JIDs
      const participantJids = participants.map((p) =>
        this.formatPhoneNumber(p)
      );

      const group = await this.socket.groupCreate(name, participantJids);

      return {
        success: true,
        message: "Group created successfully",
        data: {
          groupId: group.id,
          groupJid: group.id,
          subject: name,
          participants: participantJids,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Add participants to a group
   * @param {string} groupId - Group JID
   * @param {Array<string>} participants - Array of phone numbers to add
   * @returns {Object}
   */
  async groupAddParticipants(
    groupId: string,
    participants: string[]
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (
        !groupId ||
        !participants ||
        !Array.isArray(participants) ||
        participants.length === 0
      ) {
        return {
          success: false,
          message: "Group ID and participants are required",
        };
      }

      const gid = this.formatJid(groupId, true);
      const participantJids = participants.map((p) =>
        this.formatPhoneNumber(p)
      );

      const result = await this.socket.groupParticipantsUpdate(
        gid,
        participantJids,
        "add"
      );

      return {
        success: true,
        message: "Participants added successfully",
        data: {
          groupId: gid,
          participants: result,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Remove participants from a group
   * @param {string} groupId - Group JID
   * @param {Array<string>} participants - Array of phone numbers to remove
   * @returns {Object}
   */
  async groupRemoveParticipants(
    groupId: string,
    participants: string[]
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (
        !groupId ||
        !participants ||
        !Array.isArray(participants) ||
        participants.length === 0
      ) {
        return {
          success: false,
          message: "Group ID and participants are required",
        };
      }

      const gid = this.formatJid(groupId, true);
      const participantJids = participants.map((p) =>
        this.formatPhoneNumber(p)
      );

      const result = await this.socket.groupParticipantsUpdate(
        gid,
        participantJids,
        "remove"
      );

      return {
        success: true,
        message: "Participants removed successfully",
        data: {
          groupId: gid,
          participants: result,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Promote participants to admin
   * @param {string} groupId - Group JID
   * @param {Array<string>} participants - Array of phone numbers to promote
   * @returns {Object}
   */
  async groupPromoteParticipants(
    groupId: string,
    participants: string[]
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (
        !groupId ||
        !participants ||
        !Array.isArray(participants) ||
        participants.length === 0
      ) {
        return {
          success: false,
          message: "Group ID and participants are required",
        };
      }

      const gid = this.formatJid(groupId, true);
      const participantJids = participants.map((p) =>
        this.formatPhoneNumber(p)
      );

      const result = await this.socket.groupParticipantsUpdate(
        gid,
        participantJids,
        "promote"
      );

      return {
        success: true,
        message: "Participants promoted to admin successfully",
        data: {
          groupId: gid,
          participants: result,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Demote participants from admin
   * @param {string} groupId - Group JID
   * @param {Array<string>} participants - Array of phone numbers to demote
   * @returns {Object}
   */
  async groupDemoteParticipants(
    groupId: string,
    participants: string[]
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (
        !groupId ||
        !participants ||
        !Array.isArray(participants) ||
        participants.length === 0
      ) {
        return {
          success: false,
          message: "Group ID and participants are required",
        };
      }

      const gid = this.formatJid(groupId, true);
      const participantJids = participants.map((p) =>
        this.formatPhoneNumber(p)
      );

      const result = await this.socket.groupParticipantsUpdate(
        gid,
        participantJids,
        "demote"
      );

      return {
        success: true,
        message: "Participants demoted from admin successfully",
        data: {
          groupId: gid,
          participants: result,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update group subject (name)
   * @param {string} groupId - Group JID
   * @param {string} subject - New group name
   * @returns {Object}
   */
  async groupUpdateSubject(groupId: string, subject: string): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (!groupId || !subject) {
        return { success: false, message: "Group ID and subject are required" };
      }

      const gid = this.formatJid(groupId, true);
      await this.socket.groupUpdateSubject(gid, subject);

      return {
        success: true,
        message: "Group subject updated successfully",
        data: {
          groupId: gid,
          subject: subject,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update group description
   * @param {string} groupId - Group JID
   * @param {string} description - New group description
   * @returns {Object}
   */
  async groupUpdateDescription(
    groupId: string,
    description?: string
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (!groupId) {
        return { success: false, message: "Group ID is required" };
      }

      const gid = this.formatJid(groupId, true);
      await this.socket.groupUpdateDescription(gid, description || "");

      return {
        success: true,
        message: "Group description updated successfully",
        data: {
          groupId: gid,
          description: description || "",
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Leave a group
   * @param {string} groupId - Group JID
   * @returns {Object}
   */
  async groupLeave(groupId: string): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (!groupId) {
        return { success: false, message: "Group ID is required" };
      }

      const gid = this.formatJid(groupId, true);
      await this.socket.groupLeave(gid);

      return {
        success: true,
        message: "Left group successfully",
        data: {
          groupId: gid,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Join a group using invitation code
   * @param {string} inviteCode - Group invitation code (from invite link)
   * @returns {Object}
   */
  async groupJoinByInvite(inviteCode: string): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (!inviteCode) {
        return { success: false, message: "Invitation code is required" };
      }

      // Remove URL prefix if present (https://chat.whatsapp.com/...)
      const code = inviteCode.replace(/^https?:\/\/chat\.whatsapp\.com\//, "");

      const groupId = await this.socket.groupAcceptInvite(code);

      return {
        success: true,
        message: "Joined group successfully",
        data: {
          groupId: groupId,
          inviteCode: code,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get group invitation code
   * @param {string} groupId - Group JID
   * @returns {Object}
   */
  async groupGetInviteCode(groupId: string): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (!groupId) {
        return { success: false, message: "Group ID is required" };
      }

      const gid = this.formatJid(groupId, true);
      const code = await this.socket.groupInviteCode(gid);

      return {
        success: true,
        message: "Invite code retrieved successfully",
        data: {
          groupId: gid,
          inviteCode: code,
          inviteLink: `https://chat.whatsapp.com/${code}`,
        },
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Revoke group invitation code
   * @param {string} groupId - Group JID
   * @returns {Object}
   */
  async groupRevokeInvite(groupId: string): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (!groupId) {
        return { success: false, message: "Group ID is required" };
      }

      const gid = this.formatJid(groupId, true);
      const newCode = await this.socket.groupRevokeInvite(gid);

      return {
        success: true,
        message: "Invite code revoked successfully",
        data: {
          groupId: gid,
          newInviteCode: newCode,
          newInviteLink: `https://chat.whatsapp.com/${newCode}`,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get group metadata
   * @param {string} groupId - Group JID
   * @returns {Object}
   */
  async groupGetMetadata(groupId: string): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (!groupId) {
        return { success: false, message: "Group ID is required" };
      }

      const gid = this.formatJid(groupId, true);
      const metadata = await this.socket.groupMetadata(gid);

      return {
        success: true,
        message: "Group metadata retrieved successfully",
        data: {
          id: metadata.id,
          subject: metadata.subject,
          subjectOwner: metadata.subjectOwner,
          subjectTime: metadata.subjectTime,
          description: metadata.desc,
          descriptionId: metadata.descId,
          restrict: metadata.restrict,
          announce: metadata.announce,
          size: metadata.size,
          participants: metadata.participants?.map((p: any) => ({
            id: p.id,
            admin: p.admin || null,
            isSuperAdmin: p.admin === "superadmin",
          })),
          creation: metadata.creation,
          owner: metadata.owner,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get all participating groups metadata
   * @returns {Object}
   */
  async getAllGroups(): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      const groups = await this.socket.groupFetchAllParticipating();

      const groupList = Object.values(groups).map((g: any) => ({
        id: g.id,
        subject: g.subject,
        subjectOwner: g.subjectOwner,
        subjectTime: g.subjectTime,
        description: g.desc,
        restrict: g.restrict,
        announce: g.announce,
        size: g.size,
        participantsCount: g.participants?.length || 0,
        creation: g.creation,
        owner: g.owner,
      }));

      return {
        success: true,
        message: "Groups retrieved successfully",
        data: {
          count: groupList.length,
          groups: groupList,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update group settings (who can send messages, who can edit group info)
   * @param {string} groupId - Group JID
   * @param {string} setting - 'announcement' (only admins send) or 'not_announcement' (all can send)
   *                          or 'locked' (only admins edit) or 'unlocked' (all can edit)
   * @returns {Object}
   */
  async groupUpdateSettings(groupId: string, setting: string): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (!groupId || !setting) {
        return { success: false, message: "Group ID and setting are required" };
      }

      const validSettings = [
        "announcement",
        "not_announcement",
        "locked",
        "unlocked",
      ];
      if (!validSettings.includes(setting)) {
        return {
          success: false,
          message: `Invalid setting. Use: ${validSettings.join(", ")}`,
        };
      }

      const gid = this.formatJid(groupId, true);
      await this.socket.groupSettingUpdate(gid, setting);

      return {
        success: true,
        message: "Group settings updated successfully",
        data: {
          groupId: gid,
          setting: setting,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update group profile picture
   * @param {string} groupId - Group JID
   * @param {string} imageUrl - Image URL
   * @returns {Object}
   */
  async groupUpdateProfilePicture(
    groupId: string,
    imageUrl: string
  ): Promise<any> {
    try {
      if (!this.socket || this.connectionStatus !== "connected") {
        return { success: false, message: "Session not connected" };
      }

      if (!groupId || !imageUrl) {
        return {
          success: false,
          message: "Group ID and image URL are required",
        };
      }

      const gid = this.formatJid(groupId, true);
      await this.socket.updateProfilePicture(gid, { url: imageUrl });

      return {
        success: true,
        message: "Group profile picture updated successfully",
        data: {
          groupId: gid,
        },
      };
    } catch (error: any | Error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export default WhatsAppSession;
