// Extend Express Request to include session property
import { WhatsAppSession } from "../services/whatsapp/WhatsAppSession";

declare global {
  namespace Express {
    interface Request {
      session?: WhatsAppSession;
    }
  }
}

export {};
