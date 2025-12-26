# Plan: Whitelabel Footer Feature for All Messages

## Overview
Add a configurable whitelabel footer to all sent messages. The footer will be automatically appended to every message sent through the API, with format: `> _footerName_` (markdown blockquote with italic).

## Configuration Options

1. **Request Payload** (Priority 1 - Highest): Set `footerName` in request body (per-request override)
2. **Session Metadata** (Priority 2): Set `footerName` in session metadata
3. **Environment Variable** (Priority 3 - Lowest): Set `MESSAGE_FOOTER` in `.env` file

## Implementation Details

### 1. WhatsAppSession.js
**File**: `src/services/whatsapp/WhatsAppSession.js`

- Added `_getFooter(payloadFooterName)` helper method that:
  - Accepts optional `payloadFooterName` parameter (from request payload)
  - Priority: payload > session metadata > environment variable
  - Returns formatted footer: `\n\n> _footerName_`
  - Returns empty string if not configured

- Updated all send methods to accept `footerName` parameter and append footer:
  - `sendTextMessage`: Appends to message text
  - `sendImage`: Appends to caption
  - `sendDocument`: Appends to caption
  - `sendLocation`: Appends to location name
  - `sendButton`: Appends to footer field
  - `sendContact`: No footer (contact cards don't support text)

### 2. Route Handlers
**File**: `src/routes/whatsapp.js`

- Updated all messaging route handlers to:
  - Extract `footerName` from request body
  - Pass `footerName` to send methods (or null if not provided)

### 3. Swagger Documentation
**File**: `src/config/swagger-paths.js`

- Updated descriptions for all messaging endpoints to mention:
  - Whitelabel footer feature
  - Priority: payload > metadata > env variable
  - Footer format: `> _footerName_`
- Added `footerName` property to all messaging request schemas

### 4. Dashboard API Tester
**File**: `public/dashboard.html`

- Updated request body examples to include `footerName` field
- Updated help text for all messaging endpoints to include:
  - Information about whitelabel footer feature
  - Priority order: payload > metadata > env variable

## Usage Examples

### Via Request Payload (Per-Request Override)
```json
{
  "sessionId": "mysession",
  "chatId": "628123456789",
  "message": "Hello!",
  "footerName": "My Company Name"
}
```

### Via Session Metadata
```json
{
  "sessionId": "mysession",
  "metadata": {
    "footerName": "My Company Name"
  }
}
```

### Via Environment Variable (Global Default)
```bash
# .env file
MESSAGE_FOOTER=My Company Name
```

### Result
All messages will automatically include:
```
> _My Company Name_
```

## Files Modified

1. ✅ `src/services/whatsapp/WhatsAppSession.js` - Added footer helper and updated all send methods
2. ✅ `src/routes/whatsapp.js` - Updated route handlers to extract footerName from payload
3. ✅ `src/config/swagger-paths.js` - Updated API documentation with footerName field
4. ✅ `public/dashboard.html` - Updated examples and help text

## Implementation Status

- ✅ Footer helper method implemented
- ✅ All send methods updated (text, image, document, location, button)
- ✅ Swagger documentation updated
- ✅ Dashboard help text updated
- ✅ No linting errors

## Notes

- Footer is optional - if not configured, no footer is added
- Priority order: Request payload > Session metadata > Environment variable
- Footer format follows markdown: `> _footerName_` (blockquote with italic)
- Contact messages don't support footer (limitation of WhatsApp contact cards)
- Footer is automatically appended, can be overridden per-request via `footerName` in payload

