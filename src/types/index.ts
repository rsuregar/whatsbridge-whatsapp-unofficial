// Common type definitions for WhatsBridge

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface SessionInfo {
  sessionId: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_ready' | 'pair_ready';
  isConnected: boolean;
  phoneNumber?: string | null;
  name?: string | null;
  qrCode?: string | null;
  pairCode?: string | null;
  metadata?: Record<string, any>;
  webhooks?: WebhookConfig[];
}

export interface WebhookConfig {
  url: string;
  events?: string[];
}

export interface SessionOptions {
  metadata?: Record<string, any>;
  webhooks?: WebhookConfig[];
}

export interface MessageData {
  messageId: string;
  chatId: string;
  timestamp: string;
}

export interface SendMessageResult {
  success: boolean;
  message: string;
  data?: MessageData;
}

export interface ChatMessage {
  key: {
    id: string;
    fromMe: boolean;
    remoteJid: string;
  };
  message: any;
  messageTimestamp: number;
}

export interface Contact {
  id: string;
  name?: string;
  notify?: string;
}

export interface GroupMetadata {
  id: string;
  subject: string;
  creation: number;
  owner?: string;
  desc?: string;
  participants: GroupParticipant[];
  admins?: string[];
}

export interface GroupParticipant {
  id: string;
  admin?: 'admin' | 'superadmin';
}

export interface CreateSessionRequest {
  sessionId: string;
  metadata?: Record<string, any>;
  webhooks?: WebhookConfig[];
}

export interface SendTextRequest {
  sessionId: string;
  chatId: string;
  message: string;
  footerName?: string;
  typingTime?: number;
}

export interface SendImageRequest {
  sessionId: string;
  chatId: string;
  imageUrl: string;
  caption?: string;
  footerName?: string;
  typingTime?: number;
}

export interface SendDocumentRequest {
  sessionId: string;
  chatId: string;
  documentUrl: string;
  filename: string;
  mimetype?: string;
  caption?: string;
  footerName?: string;
  typingTime?: number;
}

export interface SendLocationRequest {
  sessionId: string;
  chatId: string;
  latitude: number;
  longitude: number;
  name?: string;
  footerName?: string;
  typingTime?: number;
}

export interface SendContactRequest {
  sessionId: string;
  chatId: string;
  contactName: string;
  contactPhone: string;
  typingTime?: number;
}

export interface SendButtonRequest {
  sessionId: string;
  chatId: string;
  text: string;
  footer?: string;
  footerName?: string;
  buttons: string[];
  typingTime?: number;
}

