# TypeScript Migration Plan

## Overview
Complete refactoring of NotifWA from JavaScript to TypeScript for better type safety, IDE support, and maintainability.

## Status

### ✅ Completed
- [x] TypeScript configuration (tsconfig.json)
- [x] Package.json updated with TypeScript dependencies
- [x] Type definitions created (src/types/index.ts)
- [x] index.js → index.ts
- [x] Middleware converted (apiKeyAuth.ts)
- [x] Config files converted (swagger.ts, swagger-paths.ts renamed)

### 🔄 In Progress
- [ ] Routes conversion (whatsapp.ts)
- [ ] Service files conversion

### ⏳ Pending
- [ ] WhatsAppManager.ts
- [ ] WhatsAppSession.ts
- [ ] BaileysStore.ts
- [ ] MessageFormatter.ts
- [ ] WebSocketManager.ts
- [ ] whatsapp/index.ts
- [ ] Dockerfile update for TypeScript build
- [ ] .gitignore update
- [ ] Build and test

## Files to Convert

### Routes
- `src/routes/whatsapp.js` → `src/routes/whatsapp.ts` (1022 lines)

### Services
- `src/services/whatsapp/index.js` → `src/services/whatsapp/index.ts`
- `src/services/whatsapp/WhatsAppManager.js` → `src/services/whatsapp/WhatsAppManager.ts` (149 lines)
- `src/services/whatsapp/WhatsAppSession.js` → `src/services/whatsapp/WhatsAppSession.js` (1801 lines - LARGE)
- `src/services/whatsapp/BaileysStore.js` → `src/services/whatsapp/BaileysStore.ts`
- `src/services/whatsapp/MessageFormatter.js` → `src/services/whatsapp/MessageFormatter.ts`
- `src/services/websocket/WebSocketManager.js` → `src/services/websocket/WebSocketManager.ts`

## Type Definitions Needed

1. Baileys types (from @whiskeysockets/baileys)
2. Express Request/Response types
3. Socket.IO types
4. Custom WhatsApp types (already in src/types/index.ts)

## Build Process

1. Development: `npm run dev` (uses tsx watch)
2. Build: `npm run build` (compiles to dist/)
3. Production: `npm start` (runs dist/index.js)

## Notes

- Large files (WhatsAppSession.js ~1801 lines) will need careful conversion
- Baileys library types may need custom type definitions
- Socket.IO types are available via @types/socket.io
- All CommonJS require/module.exports need to be converted to ES6 imports/exports

