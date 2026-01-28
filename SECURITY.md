# Privacy-First Wallet Approval Monitor

## Security & Privacy Disclosure

**READ-ONLY ARCHITECTURE**

This browser extension and web application are designed with a **privacy-first, read-only approach** to wallet approval monitoring:

### Extension (Browser)

✅ **What the extension DOES:**
- Observes wallet transaction requests via `window.ethereum.request`
- Detects approval-related calls (ERC20 `approve`, NFT `setApprovalForAll`, Permit signatures)
- Shows non-blocking alerts with risk assessment
- Opens web app with pre-filled wallet context

🚫 **What the extension NEVER does:**
- Access private keys or seed phrases
- Sign or modify transactions
- Block or intercept wallet operations
- Store sensitive data beyond minimal preferences
- Make external API calls for tracking

### Web App (Action Center)

✅ **What the web app DOES:**
- Connects to your wallet with YOUR explicit signature
- Fetches existing approvals using Alchemy API (public data only)
- Displays approval state with risk scoring
- Generates revoke transactions (YOU sign them)
- Estimates gas costs

🚫 **What the web app NEVER does:**
- Auto-revoke approvals without your signature
- Access your private keys
- Store your transaction history
- Track your activity across sessions
- Share data with third parties

### Risk Scoring

Our risk assessment is **100% local and rule-based**:
- Unlimited approvals → HIGH risk
- Unverified contracts → MEDIUM/HIGH risk
- Known protocols (Uniswap, 1inch, OpenSea) → LOW risk
- NFT `setApprovalForAll` → Inherently higher risk

**No external APIs** are called for risk scoring. All calculations happen locally in your browser.

### Data Storage

**Extension:**
- Detected wallet addresses (temporary, per-tab)
- User preferences (theme, etc.)
- Badge state

**Web App:**
- No persistent storage
- Session-only wallet connection via WalletConnect/MetaMask
- No analytics or tracking cookies

### Chrome Web Store Compliance

- ✅ Manifest v3
- ✅ Strict Content Security Policy
- ✅ No inline scripts
- ✅ Minimal permissions (`activeTab`, `storage`, `contextMenus`)
- ✅ Host permissions for Alchemy API only
- ✅ Clear disclosure of all network requests

### Supported Chains

**MVP:**
- Ethereum Mainnet
- Arbitrum
- Polygon
- ApeChain (custom RPC)

### User Responsibilities

⚠️ **You are always in control:**
- Review each revoke transaction before signing
- Verify gas estimates
- Understand that revoking approvals requires on-chain transactions (gas fees apply)
- This tool provides information; **you make the final decision**

### Limitations

This tool does NOT:
- Simulate transactions
- Provide historical analytics
- Auto-revoke approvals
- Support mobile apps
- Operate custom RPC nodes
- Guarantee 100% approval detection (relies on Alchemy API and transaction history)

### Open Source

This project is open source. You can review the code:
- Extension: `/extension/` folder
- Web App: `/webapp/` folder
- Risk Scoring: `/webapp/lib/risk.ts`

### Contact & Support

For security concerns or bug reports:
- GitHub Issues: [Your Repo URL]
- Email: security@yourdomain.com

### License

MIT License - See LICENSE file for details

---

**⚡ Bottom Line:**
This tool monitors and informs. **You** review and sign. No secrets, no tracking, no modifications.
