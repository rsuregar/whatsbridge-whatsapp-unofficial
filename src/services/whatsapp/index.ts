/**
 * WhatsApp Service Module
 * 
 * Struktur file:
 * - BaileysStore.ts     : Custom in-memory store untuk Baileys v7
 * - MessageFormatter.ts : Utility untuk format pesan
 * - WhatsAppSession.ts  : Class untuk mengelola satu sesi WhatsApp
 * - WhatsAppManager.ts  : Singleton untuk mengelola semua sesi
 * - index.ts            : Entry point (file ini)
 */

import WhatsAppManager from './WhatsAppManager';

// Singleton instance
const whatsappManager = new WhatsAppManager();

export default whatsappManager;

