/**
 * Background Service Worker - Privacy-First Approval Monitor + Privacy Passport
 *
 * RESPONSIBILITIES:
 * - Badge state management (visual feedback)
 * - Context menu integration
 * - Risk assessment (rule-based, no external calls)
 * - Privacy Passport verification (CHECK ONLY - never generates)
 * - Web app routing with context
 *
 * SECURITY:
 * - No private keys or signing
 * - No transaction modification
 * - Local risk scoring only
 * - NO ZK PROOF GENERATION (extension only verifies)
 * - Minimal state storage
 */

const WEB_APP_URL = "http://localhost:3000"; // Update for production

// Badge states with visual hierarchy
const BADGE_STATES = {
  NONE: { text: "", color: "#666666" },
  DETECTED: { text: "●", color: "#10b981" }, // Green - wallet found
  APPROVAL: { text: "!", color: "#f59e0b" }, // Yellow - approval detected
  RISK: { text: "⚠", color: "#ef4444" }, // Red - risky approval
  CRITICAL: { text: "🚨", color: "#dc2626" }, // Dark red - critical risk
  PASSPORT: { text: "🛡", color: "#3b82f6" }, // Blue - Privacy Passport active
};

// Track state per tab
const tabStates = new Map();

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log("[ApprovalGuard] Extension installed");

  // Create context menu
  chrome.contextMenus.create({
    id: "scanWallet",
    title: "Scan Wallet Approvals",
    contexts: ["all"],
  });
});

// Listen to messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Popup requests tab state explicitly
  if (message.type === "GET_TAB_STATE") {
    const targetTabId = message.tabId || sender.tab?.id;
    if (targetTabId) {
      sendResponse(getTabState(targetTabId));
    } else {
      sendResponse({});
    }
    return; // keep channel closed
  }

  const tabId = sender.tab?.id || message.tabId;
  if (!tabId) return;

  handleContentMessage(message, tabId);
  sendResponse({ received: true });
});

// Handle messages from content script
function handleContentMessage(message, tabId) {
  const { type } = message;

  switch (type) {
    case "WALLET_DETECTED":
      updateTabState(tabId, { walletDetected: true });
      setBadge(tabId, BADGE_STATES.DETECTED);
      break;

    case "WALLET_CONNECTED":
      updateTabState(tabId, {
        walletDetected: true,
        address: message.address,
      });
      setBadge(tabId, BADGE_STATES.DETECTED);
      // Check for Privacy Passport
      checkPrivacyPassport(tabId, message.address);
      break;

    case "CHAIN_CHANGED":
      updateTabState(tabId, { chainId: message.chainId });
      break;

    case "CONNECTION_REQUESTED":
      // User is connecting wallet
      break;

    case "APPROVAL_DETECTED":
      handleApprovalDetected(message, tabId);
      break;

    case "PERMIT_DETECTED":
      // Permit signature (gasless approval)
      setBadge(tabId, BADGE_STATES.APPROVAL);
      updateTabState(tabId, { lastApprovalTime: Date.now() });
      break;

    case "CHECK_PASSPORT":
      // Content script requesting passport status
      checkPrivacyPassport(tabId, message.address);
      break;
  }
}

// Handle approval detection with risk assessment
function handleApprovalDetected(message, tabId) {
  const { tokenType, unlimited, domain, token, spender, operator } = message;

  // Update state
  updateTabState(tabId, {
    lastApprovalTime: Date.now(),
    lastApprovalType: tokenType,
    lastApprovalUnlimited: unlimited,
    lastApprovalDomain: domain,
  });

  // Calculate risk level
  const riskLevel = assessApprovalRisk({
    tokenType,
    unlimited,
    spender: spender || operator,
    token,
  });

  // Check if user has Privacy Passport
  const state = tabStates.get(tabId);
  const hasValidPassport =
    state?.hasPassport && state?.privacyPassport?.verified;

  // Set badge based on risk + passport status
  let badgeState;
  let notificationTitle;
  let notificationMessage;

  const approvalSummary = {
    type: "APPROVAL_WARNING",
    riskLevel,
    tokenType,
    unlimited,
    domain,
    token,
    spender: spender || operator,
  };

  chrome.tabs.sendMessage(tabId, approvalSummary, () => {
    if (chrome.runtime.lastError) {
      console.debug(
        "[ApprovalGuard] Could not send warning to tab:",
        chrome.runtime.lastError.message,
      );
    }
  });

  const baseMessage = `${domain || "This site"} requested ${
    unlimited ? "UNLIMITED " : ""
  }${tokenType} approval${spender || operator ? ` to ${formatAddress(spender || operator)}` : ""}`;

  if (riskLevel === "CRITICAL") {
    badgeState = BADGE_STATES.CRITICAL;
    notificationTitle = "⚠️ CRITICAL Risk Approval";
    notificationMessage = hasValidPassport
      ? `Unlimited ${tokenType} approval detected on ${domain}. Consider generating updated Privacy Passport.`
      : `Unlimited ${tokenType} approval on ${domain} to unverified contract. Generate a Privacy Passport to prove wallet safety.`;

    showNotification({
      title: notificationTitle,
      message: notificationMessage,
    });
  } else if (riskLevel === "HIGH") {
    badgeState = BADGE_STATES.RISK;
    notificationTitle = "⚠️ High Risk Approval";
    notificationMessage = hasValidPassport
      ? `Unlimited ${tokenType} approval on ${domain}`
      : `Generate a Privacy Passport to prove your wallet hygiene without revealing addresses.`;

    showNotification({
      title: notificationTitle,
      message: notificationMessage,
    });
  } else if (riskLevel === "MEDIUM") {
    badgeState = BADGE_STATES.APPROVAL;
    notificationTitle = "Approval detected";
    notificationMessage = baseMessage;
    showNotification({
      title: notificationTitle,
      message: `${notificationMessage}. Review before signing.`,
    });
  } else if (state?.hasPassport) {
    badgeState = BADGE_STATES.PASSPORT;
    notificationTitle = "Approval detected";
    notificationMessage = baseMessage;
    showNotification({
      title: notificationTitle,
      message: `${notificationMessage}.`,
    });
  } else {
    badgeState = state?.walletDetected
      ? BADGE_STATES.DETECTED
      : BADGE_STATES.NONE;
    notificationTitle = "Approval detected";
    notificationMessage = baseMessage;
    showNotification({
      title: notificationTitle,
      message: `${notificationMessage}.`,
    });
  }

  setBadge(tabId, badgeState);

  // Clear badge after 5 minutes
  setTimeout(
    () => {
      const state = tabStates.get(tabId);
      if (state && state.lastApprovalTime === message.timestamp) {
        setBadge(
          tabId,
          state.walletDetected ? BADGE_STATES.DETECTED : BADGE_STATES.NONE,
        );
      }
    },
    5 * 60 * 1000,
  );
}

/**
 * Assess approval risk level (LOCAL ONLY - no external calls)
 * Returns: LOW, MEDIUM, HIGH, CRITICAL
 */
function assessApprovalRisk({ tokenType, unlimited, spender, token }) {
  // NFT approvals are inherently higher risk
  const isNFT =
    tokenType === "NFT" ||
    tokenType.includes("721") ||
    tokenType.includes("1155");

  // Check if spender is a known safe protocol
  const isKnown = isKnownProtocol(spender);

  if (unlimited && !isKnown && isNFT) {
    return "CRITICAL"; // Unlimited NFT approval to unknown = highest risk
  } else if (unlimited && !isKnown) {
    return "HIGH"; // Unlimited ERC20 to unknown
  } else if (unlimited && isKnown) {
    return "MEDIUM"; // Unlimited but to known protocol
  } else if (!unlimited && !isKnown) {
    return "MEDIUM"; // Limited but to unknown
  } else {
    return "LOW"; // Known protocol or limited approval
  }
}

function formatAddress(address) {
  if (!address || address.length < 10) return "unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Set badge for tab
function setBadge(tabId, state) {
  chrome.action.setBadgeText({ tabId, text: state.text });
  chrome.action.setBadgeBackgroundColor({ tabId, color: state.color });
}

// Update tab state
function updateTabState(tabId, updates) {
  const current = tabStates.get(tabId) || {};
  tabStates.set(tabId, { ...current, ...updates });
}

// Get tab state
function getTabState(tabId) {
  return tabStates.get(tabId) || {};
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "scanWallet") {
    openWebApp(tab.id);
  }
});

// Extension icon click handler
chrome.action.onClicked.addListener((tab) => {
  openWebApp(tab.id);
});

// Open web app with context
function openWebApp(tabId) {
  chrome.tabs.get(tabId, (tab) => {
    const state = getTabState(tabId);

    // Build URL with query params
    const params = new URLSearchParams();
    if (state.address) params.set("address", state.address);
    if (state.chainId) params.set("chainId", state.chainId);
    if (tab.url) {
      const domain = new URL(tab.url).hostname;
      params.set("domain", domain);
    }

    const url = `${WEB_APP_URL}?${params.toString()}`;
    chrome.tabs.create({ url });
  });
}

// Check if contract is a known safe protocol (LOCAL ONLY)
function isKnownProtocol(address) {
  if (!address) return false;

  // Known safe protocols across major chains
  // This list should be maintained and expanded
  const knownContracts = new Set([
    // Ethereum Mainnet
    "0x7a250d5630b4cf539739df2c5dacb4c659f2488d", // Uniswap V2 Router
    "0xe592427a0aece92de3edee1f18e0157c05861564", // Uniswap V3 Router
    "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45", // Uniswap Universal Router
    "0xef1c6e67703c7bd7107eed8303fbe6ec2554bf6b", // Uniswap Universal Router v2
    "0x1111111254fb6c44bac0bed2854e76f90643097d", // 1inch v5 Router
    "0x11111112542d85b3ef69ae05771c2dccff4faa26", // 1inch Limit Order Protocol
    "0xdef1c0ded9bec7f1a1670819833240f027b25eff", // 0x Exchange Proxy
    "0x00000000006c3852cbef3e08e8df289169ede581", // OpenSea Seaport 1.1
    "0x00000000000001ad428e4906ae43d8f9852d0dd6", // OpenSea Seaport 1.4
    "0x000000000000ad05ccc4f10045630fb830b95127", // Blur Exchange
    "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad", // Uniswap Universal Router v1.2
  ]);

  return knownContracts.has(address.toLowerCase());
}

// Show browser notification
function showNotification({ title, message }) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "assets/icon128.png",
    title,
    message,
    priority: 2,
  });
}

/**
 * Check for Privacy Passport (VERIFICATION ONLY)
 * Extension NEVER generates proofs - only checks existence
 */
async function checkPrivacyPassport(tabId, address) {
  if (!address) return;

  try {
    // Generate wallet hash (same algorithm as web app)
    const walletHash = simpleHash(address.toLowerCase());

    // Check local storage for passport
    chrome.storage.local.get(["privacy_passports"], (result) => {
      const passports = result.privacy_passports || [];

      const valid = passports.find(
        (p) => p.walletHash === walletHash && Date.now() <= p.expiresAt,
      );

      updateTabState(tabId, {
        privacyPassport: valid || null,
        hasPassport: !!valid,
      });

      // Update badge if passport is verified
      if (valid && valid.verified) {
        const state = getTabState(tabId);
        // Only show passport badge if no active alerts
        if (
          !state.lastApprovalTime ||
          Date.now() - state.lastApprovalTime > 5 * 60 * 1000
        ) {
          setBadge(tabId, BADGE_STATES.PASSPORT);
        }
      }
    });
  } catch (err) {
    console.error("[ApprovalGuard] Passport check failed:", err);
  }
}

/**
 * Simple hash function (matches web app implementation)
 * For production: use proper cryptographic commitment
 */
function simpleHash(data) {
  return `0x${Array.from(data)
    .reduce((hash, char) => {
      const chr = char.charCodeAt(0);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
      return hash;
    }, 0)
    .toString(16)
    .padStart(64, "0")}`;
}

// Cleanup on tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  tabStates.delete(tabId);
});
