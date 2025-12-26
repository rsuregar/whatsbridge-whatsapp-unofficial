import path from "path";
import fs from "fs";
import WhatsAppSession from "./WhatsAppSession";
import { SessionOptions, SessionInfo, ApiResponse } from "../../types";

/**
 * WhatsApp Manager Class
 * Mengelola semua sesi WhatsApp (Singleton)
 */
class WhatsAppManager {
  private sessions: Map<string, WhatsAppSession>;
  private sessionsFolder: string;

  constructor() {
    this.sessions = new Map();
    this.sessionsFolder = path.join(process.cwd(), "sessions");
    this.initExistingSessions();
  }

  /**
   * Load existing sessions on startup
   */
  async initExistingSessions(): Promise<void> {
    try {
      if (!fs.existsSync(this.sessionsFolder)) {
        fs.mkdirSync(this.sessionsFolder, { recursive: true });
        return;
      }

      const sessionDirs = fs.readdirSync(this.sessionsFolder);
      for (const sessionId of sessionDirs) {
        const sessionPath = path.join(this.sessionsFolder, sessionId);
        if (fs.statSync(sessionPath).isDirectory()) {
          console.log(`🔄 Restoring session: ${sessionId}`);
          // Session will load its own config from file
          const session = new WhatsAppSession(sessionId, {});
          this.sessions.set(sessionId, session);
          await session.connect();
        }
      }
    } catch (error) {
      console.error("Error initializing sessions:", error);
    }
  }

  /**
   * Create a new session or reconnect existing
   * @param sessionId - Session identifier
   * @param options - Session options
   * @returns ApiResponse with session info
   */
  async createSession(
    sessionId: string,
    options: SessionOptions = {}
  ): Promise<ApiResponse<SessionInfo>> {
    // Validate session ID
    if (!sessionId || !/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
      return {
        success: false,
        message:
          "Invalid session ID. Use only letters, numbers, underscore, and dash.",
      };
    }

    // Check if session already exists
    if (this.sessions.has(sessionId)) {
      const existingSession = this.sessions.get(sessionId)!;

      // Update config if provided
      if (options.metadata || options.webhooks) {
        existingSession.updateConfig(options);
      }

      const sessionInfo = existingSession.getInfo();
      if (sessionInfo.isConnected) {
        return {
          success: false,
          message: "Session already connected",
          data: sessionInfo,
        };
      }
      // Reconnect existing session
      await existingSession.connect();
      return {
        success: true,
        message: "Reconnecting existing session",
        data: existingSession.getInfo(),
      };
    }

    // Create new session with options
    const session = new WhatsAppSession(sessionId, options);
    session._saveConfig(); // Save initial config
    this.sessions.set(sessionId, session);
    await session.connect();

    return {
      success: true,
      message: "Session created",
      data: session.getInfo(),
    };
  }

  /**
   * Get session by ID
   * @param sessionId
   * @returns WhatsAppSession or undefined
   */
  getSession(sessionId: string): WhatsAppSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions info
   * @returns Array of session info
   */
  getAllSessions(): SessionInfo[] {
    const sessionsInfo: SessionInfo[] = [];
    for (const [_sessionId, session] of this.sessions) {
      sessionsInfo.push(session.getInfo());
    }
    return sessionsInfo;
  }

  /**
   * Delete a session
   * @param sessionId
   * @returns ApiResponse
   */
  async deleteSession(sessionId: string): Promise<ApiResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: "Session not found" };
    }

    await session.logout();
    this.sessions.delete(sessionId);
    return { success: true, message: "Session deleted successfully" };
  }

  /**
   * Get session QR code info
   * @param sessionId
   * @returns SessionInfo or null
   */
  getSessionQR(sessionId: string): SessionInfo | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    return session.getInfo();
  }
}

export default WhatsAppManager;
