# Browser Extension Setup

## Development

1. **Load extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `extension/` directory

2. **Test the extension:**
   - Navigate to any dApp with wallet (e.g., Uniswap, OpenSea)
   - Connect your wallet
   - Extension badge should turn green
   - Attempt an approval transaction
   - Badge should turn yellow
   - Click extension icon to open web app

## Files

- `manifest.json` - Extension configuration (Manifest V3)
- `content.js` - Injected into all pages, detects wallet
- `background.js` - Service worker, manages state & badge
- `popup/` - Extension popup UI
- `assets/` - Icons

## Key Features

- ✅ Detects wallet providers (MetaMask, etc.)
- ✅ Observes approval transactions
- ✅ Badge notifications (green/yellow/red)
- ✅ Opens web app with context
- ❌ Does NOT modify transactions
- ❌ Does NOT store private keys

## Notes

- Extension communicates with web app via URL params
- All approvals are scanned in the web app (not extension)
- Replace placeholder PNG icons with actual icons for production
