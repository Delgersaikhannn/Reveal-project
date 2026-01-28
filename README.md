# Multichain Approval Manager

A Web3 security tool combining a browser extension sentinel with a web app for managing token & NFT approvals across multiple chains.

## Architecture

- **Browser Extension**: Detection-only sentinel that observes wallet interactions
- **Web App**: Alchemy-powered approval scanner with revoke capabilities

## Project Structure

```
├── extension/          # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── content.js     # Wallet detection & observation
│   ├── background.js  # Service worker
│   ├── popup/         # Extension popup UI
│   └── assets/
│
└── webapp/            # Next.js Web Application
    ├── app/
    ├── components/
    ├── lib/           # Alchemy SDK, wagmi config
    └── public/
```

## Quick Start

### Extension Development
```bash
cd extension
# Load unpacked extension in Chrome from this directory
```

### Web App Development
```bash
cd webapp
npm install
npm run dev
```

## Tech Stack

- Extension: Vanilla JS + Manifest V3
- Web App: Next.js 14, wagmi, viem, Alchemy SDK
- Supported Chains: Ethereum, Polygon, Arbitrum, Optimism, Base
