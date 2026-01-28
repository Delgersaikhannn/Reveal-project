# Privacy Passport System

## Overview

**Philosophy**: "Prove your wallet is safe — without revealing your wallet."

The Privacy Passport is a zero-knowledge proof system that allows users to prove specific security properties about their wallet without exposing sensitive information like addresses, balances, or transaction history.

## Architecture

```
┌─────────────┐
│  Extension  │  1. Detects wallet connection
│  (Verify)   │  2. Checks for existing passport
└──────┬──────┘  3. Shows passport status in badge
       │
       │ chrome.storage.local
       │
┌──────▼──────┐
│  Web App    │  1. User scans approvals
│  (Generate) │  2. Generates Privacy Passport locally
└──────┬──────┘  3. Saves to localStorage
       │
       │ Client-side only
       │
┌──────▼──────┐
│  Passport   │  • Wallet commitment (hash)
│  Storage    │  • Rule verification results
│             │  • 30-day expiry
└─────────────┘
```

## Security Rules

The Privacy Passport evaluates 4 security rules:

### 1. NO_INFINITE_APPROVALS
- **Purpose**: Prove wallet has no unlimited token approvals
- **Check**: All ERC20 allowances are limited
- **Risk**: Unlimited approvals can drain entire token balance

### 2. NO_BLACKLISTED_SPENDERS
- **Purpose**: Prove no approvals to known malicious contracts
- **Check**: No approvals to addresses in BLACKLISTED_SPENDERS set
- **Risk**: Malicious contracts can steal tokens

### 3. APPROVAL_HYGIENE
- **Purpose**: Prove all approvals are recent (< 90 days)
- **Check**: All approval timestamps within last 90 days
- **Risk**: Old approvals may point to compromised/outdated contracts

### 4. LOW_APPROVAL_COUNT
- **Purpose**: Prove approval count is below risk threshold
- **Check**: Total approvals < 10
- **Risk**: High approval counts increase attack surface

## Components

### 1. Extension (background.js)
```javascript
// VERIFICATION ONLY - never generates proofs
checkPrivacyPassport(address, chainId) {
  // 1. Generate wallet commitment
  // 2. Query chrome.storage.local
  // 3. Check if passport exists and not expired
  // 4. Update badge to 🛡 if verified
}
```

**Responsibilities**:
- ✅ Verify passport existence
- ✅ Check expiry (30 days)
- ✅ Update badge status
- ❌ NEVER generate proofs
- ❌ NEVER access private keys

### 2. Web App (page.tsx)
```typescript
// GENERATION ONLY - client-side proof generation
handleGeneratePassport() {
  // 1. Fetch approvals via Alchemy
  // 2. Evaluate rules locally
  // 3. Generate wallet commitment (hides address)
  // 4. Create proof hash (MVP: hash-based)
  // 5. Save to localStorage
  // 6. Display verification status
}
```

**Responsibilities**:
- ✅ Generate Privacy Passport
- ✅ Evaluate security rules
- ✅ Create wallet commitments
- ✅ Store passports locally
- ❌ No server-side generation
- ❌ No address revelation

### 3. Passport Library (passport.ts)

**Key Functions**:
- `generatePrivacyPassport()` - Create new passport
- `evaluateRules()` - Check approval data against rules
- `generateWalletCommitment()` - Hash address (privacy layer)
- `getStoredPassport()` - Retrieve from localStorage
- `isPassportExpired()` - Check 30-day validity

**Data Flow**:
```typescript
Input: {
  address: string          // PRIVATE - never revealed
  approvals: Approval[]    // PRIVATE - evaluated locally
  rules: PassportRule[]    // PUBLIC
  chainId: number          // PUBLIC
}

Output: PrivacyPassport {
  walletHash: string       // PUBLIC - commitment to address
  rulesVerified: Rule[]    // PUBLIC - which rules passed
  rulesFailed: Rule[]      // PUBLIC - which rules failed
  proofHash: string        // PUBLIC - cryptographic proof
  expiresAt: number        // PUBLIC - 30 days from creation
}
```

## Privacy Properties

### What is Hidden
- ❌ Wallet address
- ❌ Token balances
- ❌ Specific approval amounts
- ❌ Transaction history
- ❌ Spender addresses

### What is Revealed
- ✅ Rule verification results (boolean)
- ✅ Wallet commitment (hash)
- ✅ Proof timestamp
- ✅ Chain ID
- ✅ Passport expiry

## User Experience

### Generation Flow
1. User connects wallet to web app
2. Scans approvals across chains (Ethereum, Arbitrum, Polygon, ApeChain)
3. Clicks "🛡️ Generate Privacy Passport"
4. Rules evaluated locally (no network calls)
5. Passport displayed with verified/failed rules
6. Valid for 30 days

### Extension Flow
1. Extension detects wallet connection
2. Checks for existing Privacy Passport
3. If found and not expired:
   - Badge shows 🛡 (blue)
   - Approval alerts mention passport status
4. If not found:
   - Badge shows standard risk assessment
   - Notifications suggest generating passport

### Approval Alerts with Passport
```
⚠️ CRITICAL Risk Approval
Unlimited ERC20 approval on example.com to unverified contract.
Generate a Privacy Passport to prove wallet safety.
```

vs.

```
⚠️ CRITICAL Risk Approval  
Unlimited ERC20 approval detected on example.com.
Consider generating updated Privacy Passport.
```

## Implementation Status

### ✅ Completed
- [x] Privacy Passport library (passport.ts)
- [x] Wallet commitment generation (hash-based)
- [x] Rule evaluation system (4 rules)
- [x] Extension verification hooks
- [x] PASSPORT badge state (🛡 blue)
- [x] Web app UI for passport generation
- [x] Passport status display (verified/failed rules)
- [x] 30-day expiry system
- [x] localStorage persistence

### 🔄 In Progress
- [ ] Web permissions monitoring (camera/mic/location)
- [ ] Extension content script permissions detection

### ⏳ Pending (Future)
- [ ] On-chain verifier contract
- [ ] Real ZK proof library integration (SnarkJS/Circom/Noir)
- [ ] Multi-wallet passport management
- [ ] Passport sharing/export
- [ ] Proof aggregation (cross-chain)

## Technical Details

### MVP Approach (Current)
```typescript
// Cryptographic commitment (not real ZK)
function generateWalletCommitment(address: string): string {
  return ethers.keccak256(
    ethers.toUtf8Bytes(`wallet:${address}:salt:${Date.now()}`)
  );
}
```

**Why MVP First?**
- Functional proof-of-concept
- No external dependencies (SnarkJS/Circom)
- Maintains all privacy properties
- Easy to upgrade to real ZK later

### Future: Real ZK Proofs
```circom
// Example Circom circuit
template ApprovalVerifier() {
  signal private input address;
  signal private input approvals[MAX];
  signal output walletHash;
  signal output noInfiniteApprovals;
  
  // Generate commitment
  walletHash <== Poseidon(address);
  
  // Verify no infinite approvals
  component checker = InfiniteApprovalChecker();
  checker.approvals <== approvals;
  noInfiniteApprovals <== checker.out;
}
```

## Storage

### Extension (chrome.storage.local)
```javascript
{
  "privacy_passports": [
    {
      "id": "passport-1234567890-abc",
      "walletHash": "0x1234...",
      "rules": ["NO_INFINITE_APPROVALS", ...],
      "rulesVerified": ["NO_INFINITE_APPROVALS", ...],
      "rulesFailed": [],
      "proofHash": "0xabcd...",
      "timestamp": 1704067200000,
      "expiresAt": 1706659200000,
      "chainId": 1,
      "verified": true
    }
  ]
}
```

### Web App (localStorage)
- Same schema as extension
- Per-chain passports
- Automatic expiry cleanup

## Security Considerations

### Chrome Web Store Compliance
✅ **Extension ONLY verifies**
- No private key access
- No transaction signing
- No proof generation
- Read-only storage access

✅ **Web app generates proofs**
- Client-side only
- No server uploads
- No third-party APIs
- User-controlled data

### Attack Vectors & Mitigations

1. **Passport Forgery**
   - Mitigation: On-chain verifier (future)
   - Current: Client-side validation only

2. **Replay Attacks**
   - Mitigation: 30-day expiry + timestamp
   - Mitigation: Per-chain passports

3. **Address Revelation**
   - Mitigation: Wallet commitment (one-way hash)
   - Mitigation: No address in proof data

4. **Side-Channel Leaks**
   - Mitigation: Local evaluation only
   - Mitigation: No network calls during generation

## Code Examples

### Generate Passport
```typescript
import { generatePrivacyPassport, PASSPORT_RULES } from '@/lib/passport';

const passport = await generatePrivacyPassport({
  address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  chainId: 1,
  rules: Object.keys(PASSPORT_RULES),
  approvals: [
    {
      token: "0x...",
      spender: "0x...",
      allowance: "1000000000000000000",
      isUnlimited: false,
      lastUpdated: Date.now()
    }
  ]
});

console.log(passport.rulesVerified); // ["NO_INFINITE_APPROVALS", ...]
console.log(passport.rulesFailed);   // []
```

### Verify Passport (Extension)
```javascript
async function checkPrivacyPassport(address, chainId) {
  const walletHash = simpleHash(address);
  
  const result = await chrome.storage.local.get('privacy_passports');
  const passports = result.privacy_passports || [];
  
  const passport = passports.find(
    p => p.walletHash === walletHash && 
         p.chainId === chainId &&
         Date.now() <= p.expiresAt
  );
  
  if (passport) {
    console.log('✅ Valid Privacy Passport found');
    return true;
  }
  
  console.log('❌ No valid passport');
  return false;
}
```

## UI Components

### Passport Status Card
- Active passport: Green badge, verified rules list
- Expired passport: Amber warning, regenerate button
- No passport: Blue CTA, rule explanation

### Badge States
- 🛡 (blue) - Valid passport verified
- ⚠️ (red) - Critical risk approval
- ⚠️ (amber) - High risk approval
- ✓ (green) - Approval detected
- 👁 (purple) - Wallet detected

## Documentation

See also:
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Full implementation details
- [SECURITY.md](SECURITY.md) - Security architecture
- [TESTING.md](TESTING.md) - Testing procedures
- [README.md](README.md) - Project overview

## Future Enhancements

1. **On-Chain Verification**
   - Deploy Verifier.sol contract
   - Integrate with passport generation
   - Show on-chain verification status

2. **Real ZK Proofs**
   - Integrate SnarkJS or Circom
   - Generate actual SNARK proofs
   - Smaller proof sizes

3. **Cross-Chain Aggregation**
   - Single passport for multiple chains
   - Merkle tree of chain passports
   - Reduced storage overhead

4. **Web Permissions**
   - Camera/microphone access detection
   - Location tracking alerts
   - Clipboard monitoring warnings

5. **Passport Sharing**
   - Export passport as QR code
   - Import passport to new device
   - Proof delegation (with limits)

## Contributing

When modifying the Privacy Passport system:

1. **Extension changes**: Only verification logic
2. **Web app changes**: Generation + UI
3. **Library changes**: Update both extension + web app
4. **New rules**: Add to PASSPORT_RULES + evaluateRules()
5. **Testing**: Test across all chains (ETH, ARB, MATIC, APE)

## License

MIT License - See LICENSE file
