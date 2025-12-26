# Plan: Add Caption Support to Send Document Feature

## Overview
Enhance the `send-document` API endpoint to support sending captions along with documents, similar to how `send-image` already supports captions.

## Current State
- `sendDocument` method in `WhatsAppSession.js` currently accepts: `chatId`, `documentUrl`, `filename`, `mimetype`, `typingTime`
- The route handler in `whatsapp.js` accepts the same parameters
- Swagger documentation doesn't include `caption` field
- Baileys library supports caption for documents (similar to images)

## Changes Required

### 1. Update WhatsAppSession.js
**File**: `src/services/whatsapp/WhatsAppSession.js`
- Modify `sendDocument` method signature to accept `caption` parameter (default: empty string)
- Add `caption` field to the message payload sent to Baileys
- Follow the same pattern as `sendImage` method (line 550-578)

**Changes**:
```javascript
// Current signature:
async sendDocument(chatId, documentUrl, filename, mimetype = 'application/pdf', typingTime = 0)

// New signature:
async sendDocument(chatId, documentUrl, filename, mimetype = 'application/pdf', caption = '', typingTime = 0)

// Update message payload to include caption:
const result = await this.socket.sendMessage(jid, {
    document: { url: documentUrl },
    fileName: filename,
    mimetype: mimetype,
    caption: caption  // Add this line
});
```

### 2. Update Route Handler
**File**: `src/routes/whatsapp.js`
- Extract `caption` from request body (line 382)
- Pass `caption` to `sendDocument` method (line 391)
- Make `caption` optional (default to empty string if not provided)

**Changes**:
```javascript
// Line 382: Extract caption from body
const { chatId, documentUrl, filename, mimetype, caption, typingTime = 0 } = req.body;

// Line 391: Pass caption to sendDocument
const result = await req.session.sendDocument(chatId, documentUrl, filename, mimetype, caption || '', typingTime);
```

### 3. Update Swagger Documentation
**File**: `src/config/swagger-paths.js`
- Add `caption` property to the request body schema (around line 407)
- Document it as optional field with example

**Changes**:
```javascript
// Add after mimetype property:
*               caption:
*                 type: string
*                 description: Optional caption text for the document
*                 example: "Please review this document"
```

## Implementation Steps

1. ✅ Create plan document
2. ✅ Update `WhatsAppSession.js` - add caption parameter to `sendDocument` method
3. ✅ Update `whatsapp.js` route - extract and pass caption parameter
4. ✅ Update `swagger-paths.js` - add caption to API documentation
5. ✅ Implementation completed - ready for testing

## Testing Considerations

- **Backward Compatibility**: Ensure existing API calls without `caption` still work (default to empty string)
- **Validation**: Caption should be optional, no validation needed
- **Baileys Compatibility**: Verify that Baileys accepts caption for document messages (should work similar to images)

## Files to Modify

1. `src/services/whatsapp/WhatsAppSession.js` - Method implementation
2. `src/routes/whatsapp.js` - Route handler
3. `src/config/swagger-paths.js` - API documentation

## Notes

- This follows the same pattern as `sendImage` which already supports captions
- The change is backward compatible since `caption` is optional
- No breaking changes to existing API consumers

