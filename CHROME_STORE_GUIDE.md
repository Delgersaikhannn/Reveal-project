# Chrome Web Store Submission Guide

## Extension Overview

**Name**: Ape Approval Guard  
**Category**: Productivity / Security  
**Target Audience**: Web3 users, DeFi traders, NFT collectors

## Store Listing Content

### Short Description (132 chars max)
```
Monitor wallet approvals in real-time. Detect risky unlimited allowances. Revoke safely with privacy-first architecture.
```

### Detailed Description

```markdown
🛡️ PRIVACY-FIRST WALLET APPROVAL MONITOR

Protect your crypto assets by monitoring and revoking token approvals across Ethereum, Arbitrum, Polygon, and ApeChain.

✅ WHAT IT DOES:
• Detects approval requests in real-time (ERC-20, ERC-721, ERC-1155)
• Identifies unlimited approvals with risk assessment
• Shows non-blocking alerts with risk levels
• Opens web dashboard for comprehensive approval review
• Generates revoke transactions (you sign them)

🔒 PRIVACY & SECURITY:
• READ-ONLY: Never modifies transactions or accesses private keys
• LOCAL RISK SCORING: No external API calls for privacy assessment
• USER-CONTROLLED: All revoke transactions require your signature
• CHROME WEB STORE COMPLIANT: Manifest v3, strict CSP
• OPEN SOURCE: Review the code on GitHub

⚡ KEY FEATURES:
• Real-time approval detection on any dApp
• Multi-chain support (Ethereum, Arbitrum, Polygon, ApeChain)
• Risk badges (LOW, MEDIUM, HIGH, CRITICAL)
• Unified approvals table (ERC-20 & NFTs in one view)
• Gas estimation before revoke
• Known protocol detection (Uniswap, OpenSea, 1inch, etc.)

🚫 WHAT IT NEVER DOES:
• Access your private keys or seed phrases
• Auto-revoke approvals without your consent
• Block or intercept wallet operations
• Track your activity or transactions
• Share data with third parties

🎯 USE CASES:
• Review unlimited approvals before confirming
• Audit existing approvals across multiple chains
• Revoke approvals to dormant or suspicious contracts
• Clean up old approvals to reduce attack surface

📋 SUPPORTED:
• Chains: Ethereum, Arbitrum, Polygon, ApeChain (+ more coming)
• Wallets: MetaMask, WalletConnect, Coinbase Wallet, Rainbow, etc.
• Tokens: ERC-20, ERC-721, ERC-1155

⚠️ IMPORTANT NOTES:
• Revoking approvals requires on-chain transactions (gas fees apply)
• Review each transaction before signing
• This tool provides information - YOU make the final decision

📖 OPEN SOURCE:
Review the code: [Your GitHub URL]
Security disclosure: See SECURITY.md in repository

Built with Next.js, wagmi, viem, and Alchemy API.
```

### Screenshots (Required: 1-5)

1. **Badge in Action**: Browser with extension badge showing risk alert
2. **Approvals Table**: Web app showing unified approvals with risk badges
3. **Risk Breakdown**: Tooltip/modal showing risk assessment reasons
4. **Revoke Confirmation**: Modal showing revoke confirmation
5. **Chain Selector**: UI showing multi-chain support

### Promotional Graphics

**Small Tile** (440x280):
- Extension logo + "Monitor Approvals"
- Risk badge icons
- Multi-chain logos

**Large Tile** (920x680):
- Full UI screenshot
- "Privacy-First Approval Monitor" headline
- Key features listed

**Marquee** (1400x560):
- Hero image with browser + web app
- "Protect Your Crypto Assets"
- Risk badges + chain logos

## Privacy Policy

**URL**: `https://yourdomain.com/privacy-policy`

**Content**:

```markdown
# Privacy Policy - Ape Approval Guard

**Last Updated**: January 2026

## Overview
Ape Approval Guard is a privacy-first browser extension and web application for monitoring token approvals. We do not collect, store, or share any personal data.

## Data Collection
**WE COLLECT NOTHING**. Specifically:
- ❌ No wallet addresses stored
- ❌ No transaction history tracked
- ❌ No browsing activity logged
- ❌ No analytics or tracking cookies
- ❌ No personal information collected

## Data Storage
**Extension**:
- Temporary per-tab state (wallet detection, badge status)
- User preferences (theme, language) stored locally in browser
- All data cleared when tab closes

**Web App**:
- Session-only wallet connection via WalletConnect/MetaMask
- No server-side storage
- No persistent cookies

## Third-Party Services
**Alchemy API**:
- Used to fetch on-chain approval data (public blockchain information)
- Your IP address may be visible to Alchemy (see their privacy policy)
- No user-identifying information sent

**WalletConnect**:
- Used for wallet connection
- No transaction data stored by us
- See WalletConnect privacy policy

## Data Sharing
We do not share, sell, or transmit any user data to third parties. Period.

## Security
- All computations happen locally in your browser
- No server-side processing of sensitive data
- Open source code available for review

## Your Rights
You can delete all extension data by:
1. Uninstalling the extension
2. Clearing browser storage

## Changes to Policy
We will notify users of any privacy policy changes via extension update notes.

## Contact
Security concerns: security@yourdomain.com
Privacy questions: privacy@yourdomain.com

## Open Source
Full source code: [Your GitHub URL]
```

## Permissions Justification

### `activeTab`
**Why**: To detect approval transactions on the current tab and show contextual alerts.  
**User Benefit**: Real-time approval monitoring without manual scanning.

### `storage`
**Why**: To store user preferences (theme, language) and temporary badge state.  
**User Benefit**: Persistent settings across sessions.

### `contextMenus`
**Why**: To add "Scan Wallet Approvals" option in right-click menu.  
**User Benefit**: Quick access to approval scanner from any page.

### Host Permissions (`http://*/*`, `https://*/*`)
**Why**: To inject content script on all pages where wallet interactions occur.  
**User Benefit**: Universal approval detection on any dApp.

**Note**: The extension ONLY observes `window.ethereum.request` calls. It never modifies requests or responses.

## Common Rejection Reasons & Solutions

### 1. "Too Broad Host Permissions"
**Solution**: Explain that approval monitoring requires detection on ANY dApp (Uniswap, OpenSea, etc.), which necessitates `<all_urls>`. The extension is read-only and never modifies page content.

### 2. "Accesses Remote Code"
**Solution**: Confirm all code is bundled in extension. Web app is opened in new tab (user-initiated). No dynamic script loading.

### 3. "Unclear Value Proposition"
**Solution**: Emphasize security benefit - unlimited approvals are a major attack vector in Web3. This tool helps users identify and revoke risky approvals.

### 4. "Privacy Concerns"
**Solution**: Point to detailed privacy policy, open source code, and read-only architecture. No data collection or tracking.

## Pre-Submission Checklist

- [ ] All permissions justified in store listing
- [ ] Privacy policy URL provided and accessible
- [ ] Manifest v3 compliant (no MV2 features)
- [ ] No obfuscated code
- [ ] Content script clearly documented
- [ ] Security disclosure (SECURITY.md) referenced
- [ ] Screenshots show actual functionality
- [ ] Detailed description explains read-only nature
- [ ] Support email provided
- [ ] GitHub repository linked (optional but recommended)

## Testing Before Submission

1. Load unpacked extension in Chrome
2. Test on multiple dApps (Uniswap, OpenSea, SushiSwap)
3. Verify badge updates correctly
4. Confirm web app opens with context
5. Test revoke flow end-to-end
6. Check all chains (ETH, ARB, POLYGON, APECHAIN)
7. Test with multiple wallets (MetaMask, WalletConnect)

## Post-Submission

**Review Time**: Typically 1-3 weeks  
**Response**: Address any feedback promptly  
**Updates**: Submit new versions via Chrome Web Store Developer Dashboard

## Support Resources

- **Developer Dashboard**: https://chrome.google.com/webstore/devconsole
- **MV3 Migration Guide**: https://developer.chrome.com/docs/extensions/mv3/intro/
- **Store Policies**: https://developer.chrome.com/docs/webstore/program-policies/

## Version History Format

```
Version 1.0.0 - Initial Release
• Real-time approval detection
• Multi-chain support (ETH, ARB, POLYGON, APECHAIN)
• Risk assessment with badges
• Unified approvals table
• Revoke functionality

Version 1.1.0 - Enhancements
• Added Optimism support
• Improved risk scoring
• UI polish
• Bug fixes
```

---

**Ready to submit?** Package your extension with `chrome.runtime.getManifest()` and upload to Chrome Web Store Developer Dashboard.
