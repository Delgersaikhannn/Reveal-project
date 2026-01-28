# 🛡️ Privacy-First Wallet Approval Monitor

A browser extension and web app for detecting, analyzing, and revoking risky token approvals across multiple chains.

## 🎯 Core Principles

- **READ-ONLY Extension**: Never modifies transactions or accesses private keys
- **User-Controlled Revokes**: All revoke transactions require your signature
- **Local Risk Scoring**: No external APIs for privacy assessment
- **Multi-Chain Support**: Ethereum, Arbitrum, Polygon, ApeChain
- **Chrome Web Store Compliant**: Manifest v3, strict CSP

## 🏗️ Architecture

### Browser Extension (Sentinel Mode)

**Location**: `/extension/`

**Responsibilities**:
- Detects wallet interactions via `window.ethereum` observation
- Identifies approval patterns:
  - ERC-20: `approve(address,uint256)` → `0x095ea7b3`
  - ERC-721/1155: `setApprovalForAll(address,bool)` → `0xa22cb465`
  - Permit signatures (EIP-2612)
- Shows non-blocking badge alerts with risk levels
- Routes to web app with pre-filled context

**Key Files**:
- `manifest.json` - Manifest v3 configuration
- `content.js` - Approval detection (read-only observer)
- `background.js` - Badge state & risk assessment
- `popup/` - Extension UI

### Web App (Action Center)

**Location**: `/webapp/`

**Stack**:
- Next.js 16 (App Router)
- wagmi + viem (Ethereum interactions)
- Alchemy SDK (Token API)
- TailwindCSS 4

**Responsibilities**:
- Wallet connection (MetaMask, WalletConnect)
- Fetch existing approvals across chains
- Display unified approvals table with risk badges
- Generate revoke transactions (user signs)
- Estimate gas costs

**Key Files**:
- `app/page.tsx` - Main UI with approvals table
- `lib/alchemy.ts` - Approval fetching logic
- `lib/risk.ts` - Local risk scoring engine
- `lib/revoke.ts` - Revoke transaction builders
- `lib/config.ts` - Chain & connector configuration

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Web app
cd webapp
npm install

# Extension (no build needed - vanilla JS)
# Just load in Chrome
```

### 2. Environment Setup

Create `webapp/.env.local`:

```env
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wc_project_id
NEXT_PUBLIC_APECHAIN_RPC_URL=https://apechain.calderachain.xyz/http
```

### 3. Run Web App

```bash
cd webapp
npm run dev
# Open http://localhost:3000
```

### 4. Load Extension

1. Open Chrome → Extensions → Developer Mode
2. Click "Load unpacked"
3. Select `/extension/` folder
4. Extension loaded! 🎉

## 🔍 How It Works

### Approval Detection Flow

1. **User visits dApp** (e.g., Uniswap)
2. **Extension content script** monkey-patches `window.ethereum.request`
3. **User initiates approval** (e.g., approve USDC to Uniswap)
4. **Content script detects** approval signature in transaction data
5. **Background worker** assesses risk level (unlimited + unverified = HIGH)
6. **Badge updates** with risk indicator (⚠️ or 🚨)
7. **User clicks badge** → opens web app with context
8. **Web app scans** all existing approvals
9. **User reviews** and revokes risky approvals

### Risk Scoring Logic

**File**: `webapp/lib/risk.ts`

**Factors** (local only, no external calls):
- **Unlimited approval**: +40 points
- **Unverified contract**: +25 points
- **NFT approval**: +15 points (operator controls ALL tokens)
- **Dormant (>90 days)**: +15 points
- **Known protocol**: -20 points

**Risk Levels**:
- `LOW` (0-29): Known protocol, limited approval
- `MEDIUM` (30-49): Unverified but limited
- `HIGH` (50-69): Unlimited to unverified
- `CRITICAL` (70-100): Unlimited NFT to unverified

## 📋 Supported Chains

| Chain | Chain ID | Alchemy Support | Status |
|-------|----------|----------------|--------|
| Ethereum | 1 | ✅ | ✅ MVP |
| Arbitrum | 42161 | ✅ | ✅ MVP |
| Polygon | 137 | ✅ | ✅ MVP |
| ApeChain | 33139 | ❌ (Custom RPC) | ✅ MVP |
| Optimism | 10 | ✅ | 🔜 Future |
| Base | 8453 | ✅ | 🔜 Future |

## 🛠️ Development

### Project Structure

```
extension/
├── extension/          # Browser extension
│   ├── manifest.json   # MV3 config
│   ├── content.js      # Approval detector
│   ├── background.js   # Risk assessor
│   └── popup/          # Extension UI
└── webapp/             # Next.js app
    ├── app/
    │   ├── page.tsx    # Main UI
    │   ├── layout.tsx
    │   └── providers.tsx
    ├── lib/
    │   ├── alchemy.ts  # Approval fetching
    │   ├── risk.ts     # Risk scoring
    │   ├── revoke.ts   # Revoke builders
    │   └── config.ts   # Chains & connectors
    └── package.json
```

### Adding New Chain

**1. Update `webapp/lib/config.ts`:**

```typescript
import { optimism } from "wagmi/chains";

export const config = createConfig({
  chains: [mainnet, arbitrum, polygon, optimism, apechain],
  // ...
});

export const CHAIN_NAMES: Record<number, string> = {
  // ...
  [optimism.id]: "Optimism",
};
```

**2. Update `webapp/lib/alchemy.ts`:**

```typescript
const CHAIN_BY_ID: Record<number, typeof mainnet> = {
  // ...
  [optimism.id]: optimism,
};

const KNOWN_SPENDERS: Record<number, Array<{address: string; label: string}>> = {
  // ...
  [optimism.id]: [
    { address: "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45", label: "Uniswap Universal" },
  ],
};
```

**3. Update risk scoring if needed:**

```typescript
// webapp/lib/risk.ts
const KNOWN_SAFE_PROTOCOLS: Record<number, Set<string>> = {
  // ...
  [optimism.id]: new Set([
    "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45",
  ].map(a => a.toLowerCase())),
};
```

### Testing

**Extension**:
1. Load unpacked in Chrome
2. Visit Uniswap or OpenSea
3. Initiate an approval
4. Check badge updates

**Web App**:
1. Connect wallet
2. Select chain
3. Click "Scan now"
4. Verify approvals appear with risk badges

**Test Approval** (ApeChain only):
- Click "🧪 Make Test Approval"
- Creates approval to `0x1111...1111` for 1000 tokens
- Scan again to see it appear

## 🔐 Security Best Practices

### Extension

- ✅ Manifest v3 only
- ✅ Strict CSP (no inline scripts)
- ✅ Minimal permissions
- ✅ No `eval()` or dynamic code execution
- ✅ All wallet calls forwarded unchanged

### Web App

- ✅ No server-side secrets
- ✅ All API keys client-side (Alchemy, WalletConnect)
- ✅ No user tracking or analytics
- ✅ Session-only wallet connection
- ✅ Gas estimation before revoke

## 🚫 Explicit Non-Goals

The following features are **intentionally NOT included** to maintain simplicity and security:

- ❌ Auto-revoke (requires user signature for each revoke)
- ❌ Transaction blocking (extension is read-only)
- ❌ Simulation engines (local risk scoring only)
- ❌ Custom RPC nodes (use public RPCs)
- ❌ Mobile apps (browser extension only)
- ❌ Historical analytics (current state only)
- ❌ Wallet-specific hacks or integrations

## 📜 License

MIT License - See [LICENSE](LICENSE)

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Add tests if applicable
4. Submit a PR with clear description

## 🔗 Resources

- **Alchemy API**: https://docs.alchemy.com/reference/token-api-quickstart
- **wagmi**: https://wagmi.sh/
- **Manifest v3**: https://developer.chrome.com/docs/extensions/mv3/intro/
- **EIP-2612 (Permit)**: https://eips.ethereum.org/EIPS/eip-2612

## ⚡ Quick Reference

**Detect Approval in dApp**:
```javascript
// content.js automatically detects:
// - approve(address,uint256) → 0x095ea7b3
// - setApprovalForAll(address,bool) → 0xa22cb465
```

**Revoke ERC20**:
```typescript
// webapp/lib/revoke.ts
await revokeERC20Approval(tokenAddress, spenderAddress, chainId);
// → approve(spender, 0)
```

**Revoke NFT**:
```typescript
await revokeNFTApproval(nftAddress, operatorAddress, chainId);
// → setApprovalForAll(operator, false)
```

---

**Built with** ❤️ **for DeFi safety**
