/**
 * Message Formatter Utility
 * Format pesan WhatsApp untuk response API
 */

interface FormattedMessage {
  id: string;
  chatId: string;
  fromMe: boolean;
  sender: string;
  senderPhone?: string;
  senderName?: string | null;
  timestamp: number;
  type: string;
  content: any;
  caption?: string | null;
  mimetype?: string | null;
  filename?: string | null;
  mediaUrl?: string | null;
  isGroup: boolean;
  otpCode?: string | null;
  quotedMessage?: {
    id: string;
    sender: string;
  } | null;
}

interface LastMessagePreview {
  type: string;
  text: string | null;
  fromMe: boolean;
  timestamp: number;
}

class MessageFormatter {
  /**
   * Format message untuk response
   * @param msg - Raw message object dari Baileys
   * @returns Formatted message or null
   */
  static formatMessage(msg: any): FormattedMessage | null {
    if (!msg || !msg.message) return null;

    const messageContent = msg.message;
    let type = "unknown";
    let content: any = null;
    let caption: string | null = null;
    let mimetype: string | null = null;
    let filename: string | null = null;

    if (messageContent?.conversation) {
      type = "text";
      content = messageContent.conversation;
    } else if (messageContent?.extendedTextMessage) {
      type = "text";
      content = messageContent.extendedTextMessage.text;
    } else if (messageContent?.imageMessage) {
      type = "image";
      caption = messageContent.imageMessage.caption || null;
      mimetype = messageContent.imageMessage.mimetype || null;
    } else if (messageContent?.videoMessage) {
      type = "video";
      caption = messageContent.videoMessage.caption || null;
      mimetype = messageContent.videoMessage.mimetype || null;
    } else if (messageContent?.audioMessage) {
      type = messageContent.audioMessage.ptt ? "ptt" : "audio";
      mimetype = messageContent.audioMessage.mimetype || null;
    } else if (messageContent?.documentMessage) {
      type = "document";
      filename = messageContent.documentMessage.fileName || null;
      mimetype = messageContent.documentMessage.mimetype || null;
    } else if (messageContent?.stickerMessage) {
      type = "sticker";
      mimetype = messageContent.stickerMessage.mimetype || null;
    } else if (messageContent?.locationMessage) {
      type = "location";
      content = {
        latitude: messageContent.locationMessage.degreesLatitude,
        longitude: messageContent.locationMessage.degreesLongitude,
        name: messageContent.locationMessage.name || null,
        address: messageContent.locationMessage.address || null,
      };
    } else if (messageContent?.contactMessage) {
      type = "contact";
      content = {
        displayName: messageContent.contactMessage.displayName,
        vcard: messageContent.contactMessage.vcard,
      };
    } else if (messageContent?.contactsArrayMessage) {
      type = "contacts";
      content = messageContent.contactsArrayMessage.contacts?.map((c: any) => ({
        displayName: c.displayName,
        vcard: c.vcard,
      }));
    } else if (messageContent?.reactionMessage) {
      type = "reaction";
      content = {
        emoji: messageContent.reactionMessage.text,
        targetMessageId: messageContent.reactionMessage.key?.id,
      };
    } else if (messageContent?.protocolMessage) {
      type = "protocol";
      content = messageContent.protocolMessage.type;
    } else if (messageContent?.buttonsMessage) {
      type = "button";
      content = messageContent.buttonsMessage.contentText || "";
    }

    // Extract OTP code from message content
    const otpCode = MessageFormatter.extractOTP(content || "");

    return {
      id: msg.key.id,
      chatId: msg.key.remoteJid,
      fromMe: msg.key.fromMe || false,
      sender: msg.key.participant || msg.key.remoteJid,
      senderPhone: (msg.key.participant || msg.key.remoteJid)?.split("@")[0],
      senderName: msg.pushName || null,
      timestamp:
        typeof msg.messageTimestamp === "object"
          ? msg.messageTimestamp.low
          : msg.messageTimestamp,
      type: type,
      content: content,
      caption: caption,
      mimetype: mimetype,
      filename: filename,
      mediaUrl: msg._mediaPath || null,
      isGroup: msg.key.remoteJid?.includes("@g.us") || false,
      quotedMessage: msg.message?.extendedTextMessage?.contextInfo
        ?.quotedMessage
        ? {
            id: msg.message.extendedTextMessage.contextInfo.stanzaId,
            sender: msg.message.extendedTextMessage.contextInfo.participant,
          }
        : null,
      otpCode: otpCode,
    };
  }

  /**
   * Extract OTP code from message text
   * Supports various OTP formats:
   * - "Your code is 123456"
   * - "OTP: 123456"
   * - "Verification code: 123456"
   * - "123456 is your code"
   * - Button text with "Copy Code: 123456"
   * - Standalone 4-8 digit numbers
   * @param text - Message text to extract OTP from
   * @returns OTP code or null
   */
  static extractOTP(text: string): string | null {
    if (!text || typeof text !== "string") return null;

    // Pattern 1: "Copy Code: 123456" (from button messages)
    const copyCodeMatch = text.match(/copy\s*code[:\s]+(\d{4,8})/i);
    if (copyCodeMatch) return copyCodeMatch[1];

    // Pattern 2: "Your code is 123456" or "OTP: 123456" or "Verification code: 123456"
    const codePatterns = [
      /(?:code|otp|verification\s*code)[:\s]+(\d{4,8})/i,
      /(\d{4,8})\s+(?:is\s+your|is\s+the|as\s+your)\s+(?:code|otp|verification\s*code)/i,
      /your\s+(?:code|otp|verification\s*code)\s+is[:\s]+(\d{4,8})/i,
    ];

    for (const pattern of codePatterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    // Pattern 3: Standalone 4-8 digit number (if message is short and contains only digits/spaces)
    const cleanText = text.trim();
    if (/^\d{4,8}$/.test(cleanText)) {
      return cleanText;
    }

    // Pattern 4: Number in asterisks or bold: *123456* or **123456**
    const boldMatch = text.match(/\*{1,2}(\d{4,8})\*{1,2}/);
    if (boldMatch) return boldMatch[1];

    return null;
  }

  /**
   * Format last message preview untuk chat overview
   * @param msg - Raw message object
   * @returns Last message preview or null
   */
  static formatLastMessagePreview(msg: any): LastMessagePreview | null {
    if (!msg || !msg.message) return null;

    const content = msg.message;
    let type = "unknown";
    let text: string | null = null;

    if (content.conversation) {
      type = "text";
      text = content.conversation;
    } else if (content.extendedTextMessage?.text) {
      type = "text";
      text = content.extendedTextMessage.text;
    } else if (content.imageMessage) {
      type = "image";
      text = content.imageMessage.caption || "📷 Photo";
    } else if (content.videoMessage) {
      type = "video";
      text = content.videoMessage.caption || "🎥 Video";
    } else if (content.audioMessage) {
      type = content.audioMessage.ptt ? "ptt" : "audio";
      text = content.audioMessage.ptt ? "🎤 Voice message" : "🎵 Audio";
    } else if (content.documentMessage) {
      type = "document";
      text = `📄 ${content.documentMessage.fileName || "Document"}`;
    } else if (content.stickerMessage) {
      type = "sticker";
      text = "🏷️ Sticker";
    } else if (content.locationMessage) {
      type = "location";
      text = "📍 Location";
    } else if (content.contactMessage) {
      type = "contact";
      text = `👤 ${content.contactMessage.displayName || "Contact"}`;
    } else if (content.reactionMessage) {
      type = "reaction";
      text = content.reactionMessage.text || "👍";
    }

    return {
      type: type,
      text: text
        ? text.length > 100
          ? text.substring(0, 100) + "..."
          : text
        : null,
      fromMe: msg.key?.fromMe || false,
      timestamp: msg.messageTimestamp || 0,
    };
  }
}

export default MessageFormatter;
