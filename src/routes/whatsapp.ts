import express, { Request, Response, NextFunction } from "express";
import whatsappManager from "../services/whatsapp";
import { SessionOptions } from "../types";
import MessageFormatter from "../services/whatsapp/MessageFormatter";

const router = express.Router();

// Get all sessions
router.get("/sessions", (_req: Request, res: Response) => {
  try {
    const sessions = whatsappManager.getAllSessions();
    return res.json({
      success: true,
      message: "Sessions retrieved",
      data: sessions.map((s) => ({
        sessionId: s.sessionId,
        status: s.status,
        isConnected: s.isConnected,
        phoneNumber: s.phoneNumber,
        name: s.name,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
    return;
  }
});

// Create/Connect a session
router.post(
  "/sessions/:sessionId/connect",
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { metadata, webhooks } = req.body;

      const options: SessionOptions = {};
      if (metadata) options.metadata = metadata;
      if (webhooks) options.webhooks = webhooks;

      const result = await whatsappManager.createSession(sessionId, options);

      return res.json({
        success: result.success,
        message: result.message,
        data: result.data,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

// Get session status
router.get("/sessions/:sessionId/status", (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = whatsappManager.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const info = session.getInfo();
    return res.json({
      success: true,
      message: "Status retrieved",
      data: {
        sessionId: info.sessionId,
        status: info.status,
        isConnected: info.isConnected,
        phoneNumber: info.phoneNumber,
        name: info.name,
        metadata: info.metadata,
        webhooks: info.webhooks,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
    return;
  }
});

// Update session config (metadata, webhooks)
router.patch("/sessions/:sessionId/config", (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { metadata, webhooks } = req.body;

    const session = whatsappManager.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const options: SessionOptions = {};
    if (metadata !== undefined) options.metadata = metadata;
    if (webhooks !== undefined) options.webhooks = webhooks;

    const updatedInfo = session.updateConfig(options);

    return res.json({
      success: true,
      message: "Session config updated",
      data: {
        sessionId: updatedInfo.sessionId,
        metadata: updatedInfo.metadata,
        webhooks: updatedInfo.webhooks,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
    return;
  }
});

// Add a webhook to session
router.post("/sessions/:sessionId/webhooks", (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { url, events } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: url",
      });
    }

    const session = whatsappManager.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const updatedInfo = session.addWebhook(url, events || ["all"]);

    return res.json({
      success: true,
      message: "Webhook added",
      data: {
        sessionId: updatedInfo.sessionId,
        webhooks: updatedInfo.webhooks,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
    return;
  }
});

// Remove a webhook from session
router.delete(
  "/sessions/:sessionId/webhooks",
  (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: url",
        });
      }

      const session = whatsappManager.getSession(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Session not found",
        });
      }

      const updatedInfo = session.removeWebhook(url);

      return res.json({
        success: true,
        message: "Webhook removed",
        data: {
          sessionId: updatedInfo.sessionId,
          webhooks: updatedInfo.webhooks,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

// Get QR Code for session
router.get("/sessions/:sessionId/qr", (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const sessionInfo = whatsappManager.getSessionQR(sessionId);

    if (!sessionInfo) {
      return res.status(404).json({
        success: false,
        message: "Session not found. Please create session first.",
      });
    }

    if (sessionInfo.isConnected) {
      return res.json({
        success: true,
        message: "Already connected to WhatsApp",
        data: {
          sessionId: sessionInfo.sessionId,
          status: "connected",
          qrCode: null,
        },
      });
    }

    if (!sessionInfo.qrCode) {
      return res.status(404).json({
        success: false,
        message: "QR Code not available yet. Please wait...",
        data: { status: sessionInfo.status },
      });
    }

    return res.json({
      success: true,
      message: "QR Code ready",
      data: {
        sessionId: sessionInfo.sessionId,
        qrCode: sessionInfo.qrCode,
        status: sessionInfo.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
    return;
  }
});

// Get QR Code as Image for session
router.get("/sessions/:sessionId/qr/image", (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const sessionInfo = whatsappManager.getSessionQR(sessionId);

    if (!sessionInfo || !sessionInfo.qrCode) {
      return res.status(404).send("QR Code not available");
    }

    // Konversi base64 ke buffer dan kirim sebagai image
    const base64Data = sessionInfo.qrCode.replace(
      /^data:image\/png;base64,/,
      ""
    );
    const imgBuffer = Buffer.from(base64Data, "base64");

    res.set("Content-Type", "image/png");
    return res.send(imgBuffer);
  } catch (error: any) {
    res.status(500).send("Error generating QR image");
    return;
  }
});

// Get Pair Code for session
router.get("/sessions/:sessionId/pair-code", (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const sessionInfo = whatsappManager.getSessionQR(sessionId);

    if (!sessionInfo) {
      return res.status(404).json({
        success: false,
        message: "Session not found. Please create session first.",
      });
    }

    if (sessionInfo.isConnected) {
      return res.json({
        success: true,
        message: "Already connected to WhatsApp",
        data: {
          sessionId: sessionInfo.sessionId,
          status: "connected",
          pairCode: null,
        },
      });
    }

    if (!sessionInfo.pairCode) {
      return res.status(404).json({
        success: false,
        message: "Pair Code not available yet. Please wait...",
        data: { status: sessionInfo.status },
      });
    }

    return res.json({
      success: true,
      message: "Pair Code ready",
      data: {
        sessionId: sessionInfo.sessionId,
        pairCode: sessionInfo.pairCode,
        status: sessionInfo.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
    return;
  }
});

// Delete/Logout a session
router.delete("/sessions/:sessionId", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const result = await whatsappManager.deleteSession(sessionId);

    return res.json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
    return;
  }
});

// ==================== CHAT API ====================

// Middleware untuk check session dari body
const checkSession = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.body) {
    res.status(400).json({
      success: false,
      message: "Request body is required",
    });
    return;
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    res.status(400).json({
      success: false,
      message: "Missing required field: sessionId",
    });
    return;
  }

  const session = whatsappManager.getSession(sessionId);

  if (!session) {
    res.status(404).json({
      success: false,
      message: "Session not found",
    });
    return;
  }

  const sessionInfo = session.getInfo();
  if (!sessionInfo.isConnected) {
    res.status(400).json({
      success: false,
      message: "Session not connected. Please scan QR code first.",
    });
    return;
  }

  req.session = session;
  next();
};

/**
 * Helper function to check if a phone number is registered on WhatsApp
 * @param session - WhatsApp session instance
 * @param chatId - Phone number to check
 * @returns Promise<{isRegistered: boolean, phone: string, jid: string | null}> or null if error
 */
async function checkNumberRegistration(
  session: any,
  chatId: string
): Promise<{
  isRegistered: boolean;
  phone: string;
  jid: string | null;
} | null> {
  try {
    // Extract phone number from chatId (remove @s.whatsapp.net if present)
    const phone = chatId.replace("@s.whatsapp.net", "").replace("@g.us", "");

    // Skip check for group IDs
    if (chatId.includes("@g.us")) {
      return { isRegistered: true, phone, jid: chatId };
    }

    const result = await session.isRegistered(phone);
    if (result.success && result.data) {
      return {
        isRegistered: result.data.isRegistered || false,
        phone: result.data.phone || phone,
        jid: result.data.jid || null,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Send text message
router.post(
  "/chats/send-text",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const {
        chatId,
        message,
        typingTime = 0,
        footerName,
        checkNumber = false,
      } = req.body;

      if (!chatId || !message) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: chatId, message",
        });
      }

      // Check number registration if requested
      if (checkNumber) {
        const checkResult = await checkNumberRegistration(req.session!, chatId);
        if (checkResult && !checkResult.isRegistered) {
          return res.status(400).json({
            success: false,
            message: "Phone number is not registered on WhatsApp",
            data: {
              phone: checkResult.phone,
              isRegistered: false,
              jid: checkResult.jid,
            },
          });
        }
      }

      const result = await req.session!.sendTextMessage(
        chatId,
        message,
        typingTime,
        footerName || null
      );
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

// Send image
router.post(
  "/chats/send-image",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const {
        chatId,
        imageUrl,
        caption,
        typingTime = 0,
        footerName,
        checkNumber = false,
      } = req.body;

      if (!chatId || !imageUrl) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: chatId, imageUrl",
        });
      }

      // Check number registration if requested
      if (checkNumber) {
        const checkResult = await checkNumberRegistration(req.session!, chatId);
        if (checkResult && !checkResult.isRegistered) {
          return res.status(400).json({
            success: false,
            message: "Phone number is not registered on WhatsApp",
            data: {
              phone: checkResult.phone,
              isRegistered: false,
              jid: checkResult.jid,
            },
          });
        }
      }

      const result = await req.session!.sendImage(
        chatId,
        imageUrl,
        caption || "",
        typingTime,
        footerName || null
      );
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

// Send document
router.post(
  "/chats/send-document",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const {
        chatId,
        documentUrl,
        filename,
        mimetype,
        caption,
        typingTime = 0,
        footerName,
        checkNumber = false,
      } = req.body;

      if (!chatId || !documentUrl || !filename) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: chatId, documentUrl, filename",
        });
      }

      // Check number registration if requested
      if (checkNumber) {
        const checkResult = await checkNumberRegistration(req.session!, chatId);
        if (checkResult && !checkResult.isRegistered) {
          return res.status(400).json({
            success: false,
            message: "Phone number is not registered on WhatsApp",
            data: {
              phone: checkResult.phone,
              isRegistered: false,
              jid: checkResult.jid,
            },
          });
        }
      }

      const result = await req.session!.sendDocument(
        chatId,
        documentUrl,
        filename,
        mimetype,
        caption || "",
        typingTime,
        footerName || null
      );
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

// Send location
router.post(
  "/chats/send-location",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const {
        chatId,
        latitude,
        longitude,
        name,
        typingTime = 0,
        footerName,
        checkNumber = false,
      } = req.body;

      if (!chatId || latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: chatId, latitude, longitude",
        });
      }

      // Check number registration if requested
      if (checkNumber) {
        const checkResult = await checkNumberRegistration(req.session!, chatId);
        if (checkResult && !checkResult.isRegistered) {
          return res.status(400).json({
            success: false,
            message: "Phone number is not registered on WhatsApp",
            data: {
              phone: checkResult.phone,
              isRegistered: false,
              jid: checkResult.jid,
            },
          });
        }
      }

      const result = await req.session!.sendLocation(
        chatId,
        latitude,
        longitude,
        name || "",
        typingTime,
        footerName || null
      );
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

// Send contact
router.post(
  "/chats/send-contact",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const {
        chatId,
        contactName,
        contactPhone,
        typingTime = 0,
        checkNumber = false,
      } = req.body;

      if (!chatId || !contactName || !contactPhone) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: chatId, contactName, contactPhone",
        });
      }

      // Check number registration if requested
      if (checkNumber) {
        const checkResult = await checkNumberRegistration(req.session!, chatId);
        if (checkResult && !checkResult.isRegistered) {
          return res.status(400).json({
            success: false,
            message: "Phone number is not registered on WhatsApp",
            data: {
              phone: checkResult.phone,
              isRegistered: false,
              jid: checkResult.jid,
            },
          });
        }
      }

      const result = await req.session!.sendContact(
        chatId,
        contactName,
        contactPhone,
        typingTime
      );
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

// Send button message
router.post(
  "/chats/send-button",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const {
        chatId,
        text,
        footer,
        buttons,
        typingTime = 0,
        footerName,
        checkNumber = false,
      } = req.body;

      if (!chatId || !text || !buttons || !Array.isArray(buttons)) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: chatId, text, buttons (array)",
        });
      }

      // Check number registration if requested
      if (checkNumber) {
        const checkResult = await checkNumberRegistration(req.session!, chatId);
        if (checkResult && !checkResult.isRegistered) {
          return res.status(400).json({
            success: false,
            message: "Phone number is not registered on WhatsApp",
            data: {
              phone: checkResult.phone,
              isRegistered: false,
              jid: checkResult.jid,
            },
          });
        }
      }

      const result = await req.session!.sendButton(
        chatId,
        text,
        footer || "",
        buttons,
        typingTime,
        footerName || null
      );
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

// Send OTP message
router.post(
  "/chats/send-otp",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const {
        chatId,
        otpCode,
        message,
        expiryMinutes = 5,
        typingTime = 0,
        footerName,
        checkNumber = false,
      } = req.body;

      if (!chatId || !otpCode) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: chatId, otpCode",
        });
      }

      // Validate OTP code format (4-8 digits)
      if (!/^\d{4,8}$/.test(otpCode)) {
        return res.status(400).json({
          success: false,
          message: "OTP code must be 4-8 digits",
        });
      }

      // Check number registration if requested
      if (checkNumber) {
        const checkResult = await checkNumberRegistration(req.session!, chatId);
        if (checkResult && !checkResult.isRegistered) {
          return res.status(400).json({
            success: false,
            message: "Phone number is not registered on WhatsApp",
            data: {
              phone: checkResult.phone,
              isRegistered: false,
              jid: checkResult.jid,
            },
          });
        }
      }

      const result = await req.session!.sendOTP(
        chatId,
        otpCode,
        message || "",
        expiryMinutes,
        typingTime,
        footerName || null
      );
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

// Extract OTP from message text
router.post(
  "/chats/extract-otp",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { messageText } = req.body;

      if (!messageText) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: messageText",
        });
      }

      const otpCode = MessageFormatter.extractOTP(messageText);

      return res.json({
        success: true,
        message: otpCode
          ? "OTP code extracted successfully"
          : "No OTP code found in message",
        data: {
          otpCode: otpCode,
          messageText: messageText,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

// Send presence update (typing indicator)
router.post(
  "/chats/presence",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { chatId, presence = "composing" } = req.body;

      if (!chatId) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: chatId",
        });
      }

      const validPresences = [
        "composing",
        "recording",
        "paused",
        "available",
        "unavailable",
      ];
      if (!validPresences.includes(presence)) {
        return res.status(400).json({
          success: false,
          message: `Invalid presence. Must be one of: ${validPresences.join(
            ", "
          )}`,
        });
      }

      const result = await req.session!.sendPresenceUpdate(chatId, presence);
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

// Check if number is registered on WhatsApp
router.post(
  "/chats/check-number",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: phone",
        });
      }

      const result = await req.session!.isRegistered(phone);
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

// Get profile picture
router.post(
  "/chats/profile-picture",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: phone",
        });
      }

      const result = await req.session!.getProfilePicture(phone);
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

// ==================== CHAT HISTORY API ====================

/**
 * Get chats overview - hanya chat yang punya pesan
 * Body: { sessionId, limit?, offset?, type? }
 * type: 'all' | 'personal' | 'group'
 */
router.post(
  "/chats/overview",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { limit = 50, offset = 0, type = "all" } = req.body;
      const result = await req.session!.getChatsOverview(limit, offset, type);
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * Get contacts list - semua kontak yang tersimpan
 * Body: { sessionId, limit?, offset?, search? }
 */
router.post("/contacts", checkSession, async (req: Request, res: Response) => {
  try {
    const { limit = 100, offset = 0, search = "" } = req.body;
    const result = await req.session!.getContacts(limit, offset, search);
    return res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
    return;
  }
});

/**
 * Get messages from any chat (personal or group)
 * Body: { sessionId, chatId, limit?, cursor? }
 * chatId: phone number (628xxx) or group id (xxx@g.us)
 */
router.post(
  "/chats/messages",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { chatId, limit = 50, cursor = null } = req.body;

      if (!chatId) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: chatId",
        });
      }

      const result = await req.session!.getChatMessages(chatId, limit, cursor);
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * Get chat info/detail (personal or group)
 * Body: { sessionId, chatId }
 */
router.post(
  "/chats/info",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { chatId } = req.body;

      if (!chatId) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: chatId",
        });
      }

      const result = await req.session!.getChatInfo(chatId);
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * Mark a chat as read
 * Body: { sessionId, chatId, messageId? }
 */
router.post(
  "/chats/mark-read",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { chatId, messageId } = req.body;

      if (!chatId) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: chatId",
        });
      }

      const result = await req.session!.markChatRead(chatId, messageId);
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

// ==================== GROUP MANAGEMENT ====================

/**
 * Create a new group
 * Body: { sessionId, name, participants: ['628xxx', '628yyy'] }
 */
router.post(
  "/groups/create",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { name, participants } = req.body;

      if (!name || !participants) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: name, participants",
        });
      }

      const result = await req.session!.createGroup(name, participants);
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * Get all participating groups
 * Body: { sessionId }
 */
router.post("/groups", checkSession, async (req: Request, res: Response) => {
  try {
    const result = await req.session!.getAllGroups();
    return res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
    return;
  }
});

/**
 * Get group metadata
 * Body: { sessionId, groupId }
 */
router.post(
  "/groups/metadata",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { groupId } = req.body;

      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: groupId",
        });
      }

      const result = await req.session!.groupGetMetadata(groupId);
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * Add participants to a group
 * Body: { sessionId, groupId, participants: ['628xxx', '628yyy'] }
 */
router.post(
  "/groups/participants/add",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { groupId, participants } = req.body;

      if (!groupId || !participants) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: groupId, participants",
        });
      }

      const result = await req.session!.groupAddParticipants(
        groupId,
        participants
      );
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * Remove participants from a group
 * Body: { sessionId, groupId, participants: ['628xxx', '628yyy'] }
 */
router.post(
  "/groups/participants/remove",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { groupId, participants } = req.body;

      if (!groupId || !participants) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: groupId, participants",
        });
      }

      const result = await req.session!.groupRemoveParticipants(
        groupId,
        participants
      );
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * Promote participants to admin
 * Body: { sessionId, groupId, participants: ['628xxx', '628yyy'] }
 */
router.post(
  "/groups/participants/promote",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { groupId, participants } = req.body;

      if (!groupId || !participants) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: groupId, participants",
        });
      }

      const result = await req.session!.groupPromoteParticipants(
        groupId,
        participants
      );
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * Demote participants from admin
 * Body: { sessionId, groupId, participants: ['628xxx', '628yyy'] }
 */
router.post(
  "/groups/participants/demote",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { groupId, participants } = req.body;

      if (!groupId || !participants) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: groupId, participants",
        });
      }

      const result = await req.session!.groupDemoteParticipants(
        groupId,
        participants
      );
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * Update group subject (name)
 * Body: { sessionId, groupId, subject }
 */
router.post(
  "/groups/subject",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { groupId, subject } = req.body;

      if (!groupId || !subject) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: groupId, subject",
        });
      }

      const result = await req.session!.groupUpdateSubject(groupId, subject);
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * Update group description
 * Body: { sessionId, groupId, description }
 */
router.post(
  "/groups/description",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { groupId, description } = req.body;

      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: groupId",
        });
      }

      const result = await req.session!.groupUpdateDescription(
        groupId,
        description
      );
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * Update group settings
 * Body: { sessionId, groupId, setting: 'announcement'|'not_announcement'|'locked'|'unlocked' }
 */
router.post(
  "/groups/settings",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { groupId, setting } = req.body;

      if (!groupId || !setting) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: groupId, setting",
        });
      }

      const result = await req.session!.groupUpdateSettings(groupId, setting);
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * Update group profile picture
 * Body: { sessionId, groupId, imageUrl }
 */
router.post(
  "/groups/picture",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { groupId, imageUrl } = req.body;

      if (!groupId || !imageUrl) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: groupId, imageUrl",
        });
      }

      const result = await req.session!.groupUpdateProfilePicture(
        groupId,
        imageUrl
      );
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * Leave a group
 * Body: { sessionId, groupId }
 */
router.post(
  "/groups/leave",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { groupId } = req.body;

      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: groupId",
        });
      }

      const result = await req.session!.groupLeave(groupId);
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * Join a group using invitation code/link
 * Body: { sessionId, inviteCode } - Can be full URL or just the code
 */
router.post(
  "/groups/join",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { inviteCode } = req.body;

      if (!inviteCode) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: inviteCode",
        });
      }

      const result = await req.session!.groupJoinByInvite(inviteCode);
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * Get group invitation code/link
 * Body: { sessionId, groupId }
 */
router.post(
  "/groups/invite-code",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { groupId } = req.body;

      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: groupId",
        });
      }

      const result = await req.session!.groupGetInviteCode(groupId);
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * Revoke group invitation code
 * Body: { sessionId, groupId }
 */
router.post(
  "/groups/revoke-invite",
  checkSession,
  async (req: Request, res: Response) => {
    try {
      const { groupId } = req.body;

      if (!groupId) {
        return res.status(400).json({
          success: false,
          message: "Missing required field: groupId",
        });
      }

      const result = await req.session!.groupRevokeInvite(groupId);
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

export default router;
