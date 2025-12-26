import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";

/**
 * WebSocket Manager (Singleton)
 * Mengelola koneksi WebSocket dan event broadcasting
 */
class WebSocketManager {
  private io: SocketIOServer | null = null;
  private sessionRooms: Map<string, Set<string>> = new Map(); // sessionId -> Set of socket IDs

  /**
   * Initialize Socket.IO server
   * @param httpServer - HTTP server instance
   * @param options - Socket.IO options
   */
  initialize(httpServer: HTTPServer, options: any = {}): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: options.cors?.origin || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      ...options,
    });

    this._setupConnectionHandlers();
    console.log("🔌 WebSocket server initialized");
    return this.io;
  }

  /**
   * Setup connection event handlers
   */
  private _setupConnectionHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket: Socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);

      // Client subscribes to a session
      socket.on("subscribe", (sessionId: string) => {
        if (!sessionId) {
          socket.emit("error", { message: "Session ID is required" });
          return;
        }

        // Join the session room
        socket.join(`session:${sessionId}`);

        // Track socket in session room
        if (!this.sessionRooms.has(sessionId)) {
          this.sessionRooms.set(sessionId, new Set());
        }
        this.sessionRooms.get(sessionId)!.add(socket.id);

        console.log(
          `📡 Client ${socket.id} subscribed to session: ${sessionId}`
        );
        socket.emit("subscribed", {
          sessionId,
          message: `Subscribed to session ${sessionId}`,
        });
      });

      // Client unsubscribes from a session
      socket.on("unsubscribe", (sessionId: string) => {
        if (!sessionId) return;

        socket.leave(`session:${sessionId}`);

        if (this.sessionRooms.has(sessionId)) {
          this.sessionRooms.get(sessionId)!.delete(socket.id);
          if (this.sessionRooms.get(sessionId)!.size === 0) {
            this.sessionRooms.delete(sessionId);
          }
        }

        console.log(
          `📴 Client ${socket.id} unsubscribed from session: ${sessionId}`
        );
        socket.emit("unsubscribed", { sessionId });
      });

      // Handle disconnect
      socket.on("disconnect", (reason: string) => {
        console.log(`🔌 Client disconnected: ${socket.id} - Reason: ${reason}`);

        // Remove socket from all session rooms
        for (const [sessionId, sockets] of this.sessionRooms.entries()) {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              this.sessionRooms.delete(sessionId);
            }
          }
        }
      });

      // Ping-pong for connection health check
      socket.on("ping", () => {
        socket.emit("pong", { timestamp: Date.now() });
      });
    });
  }

  /**
   * Emit event to specific session subscribers
   * @param sessionId - Session ID
   * @param event - Event name
   * @param data - Event data
   */
  emitToSession(sessionId: string, event: string, data: any): void {
    if (!this.io) {
      console.warn("WebSocket server not initialized");
      return;
    }

    this.io.to(`session:${sessionId}`).emit(event, {
      sessionId,
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /**
   * Emit event to all connected clients
   * @param event - Event name
   * @param data - Event data
   */
  broadcast(event: string, data: any): void {
    if (!this.io) {
      console.warn("WebSocket server not initialized");
      return;
    }

    this.io.emit(event, {
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  // ==================== WhatsApp Event Emitters ====================

  /**
   * Emit QR code event
   */
  emitQRCode(sessionId: string, qrCode: string): void {
    this.emitToSession(sessionId, "qr", { qrCode });
  }

  /**
   * Emit connection status change
   */
  emitConnectionStatus(
    sessionId: string,
    status: string,
    details: any = {}
  ): void {
    this.emitToSession(sessionId, "connection.update", {
      status,
      ...details,
    });
  }

  /**
   * Emit new message received
   */
  emitMessage(sessionId: string, message: any): void {
    this.emitToSession(sessionId, "message", { message });
  }

  /**
   * Emit message sent confirmation
   */
  emitMessageSent(sessionId: string, message: any): void {
    this.emitToSession(sessionId, "message.sent", { message });
  }

  /**
   * Emit message status update (read, delivered, etc)
   */
  emitMessageStatus(sessionId: string, update: any): void {
    this.emitToSession(sessionId, "message.update", { update });
  }

  /**
   * Emit message deleted/revoked
   */
  emitMessageRevoke(sessionId: string, key: any, participant: string): void {
    this.emitToSession(sessionId, "message.revoke", { key, participant });
  }

  /**
   * Emit chat update (archive, mute, pin, etc)
   */
  emitChatUpdate(sessionId: string, chats: any): void {
    this.emitToSession(sessionId, "chat.update", { chats });
  }

  /**
   * Emit new chat created
   */
  emitChatsUpsert(sessionId: string, chats: any): void {
    this.emitToSession(sessionId, "chat.upsert", { chats });
  }

  /**
   * Emit chat deleted
   */
  emitChatDelete(sessionId: string, chatIds: string[]): void {
    this.emitToSession(sessionId, "chat.delete", { chatIds });
  }

  /**
   * Emit contact update
   */
  emitContactUpdate(sessionId: string, contacts: any): void {
    this.emitToSession(sessionId, "contact.update", { contacts });
  }

  /**
   * Emit presence update (typing, online, etc)
   */
  emitPresence(sessionId: string, presence: any): void {
    this.emitToSession(sessionId, "presence.update", { presence });
  }

  /**
   * Emit group participants update
   */
  emitGroupParticipants(sessionId: string, update: any): void {
    this.emitToSession(sessionId, "group.participants", { update });
  }

  /**
   * Emit group update (name, description, etc)
   */
  emitGroupUpdate(sessionId: string, update: any): void {
    this.emitToSession(sessionId, "group.update", { update });
  }

  /**
   * Emit call event
   */
  emitCall(sessionId: string, call: any): void {
    this.emitToSession(sessionId, "call", { call });
  }

  /**
   * Emit labels update
   */
  emitLabels(sessionId: string, labels: any): void {
    this.emitToSession(sessionId, "labels", { labels });
  }

  /**
   * Emit session logged out
   */
  emitLoggedOut(sessionId: string): void {
    this.emitToSession(sessionId, "logged.out", {
      message: "Session has been logged out",
    });
  }

  /**
   * Get connection stats
   */
  getStats(): {
    totalConnections: number;
    sessionRooms: Record<string, number>;
  } | null {
    if (!this.io) return null;

    const rooms: Record<string, number> = {};
    for (const [sessionId, sockets] of this.sessionRooms.entries()) {
      rooms[sessionId] = sockets.size;
    }

    return {
      totalConnections: (this.io.engine as any)?.clientsCount || 0,
      sessionRooms: rooms,
    };
  }
}

// Singleton instance
const wsManager = new WebSocketManager();

export default wsManager;
