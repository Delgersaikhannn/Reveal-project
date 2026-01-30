/**
 * Content Script - Privacy-First Approval Monitor
 *
 * SECURITY POLICY:
 * - READ-ONLY: Never modifies transactions
 * - NO SIGNING: Never accesses private keys or signatures
 * - OBSERVES ONLY: Monitors ethereum.request calls without interference
 * - FORWARDS ALL: All wallet calls pass through unchanged
 *
 * Chrome Web Store Compliant: Manifest v3, strict CSP
 */

(function () {
  "use strict";

  console.log("[ApprovalGuard] Content script loaded - READ ONLY MODE");

  // State
  let detectedWallet = null;
  let lastChainId = null;

  // Function signatures for approval detection
  const SIGNATURES = {
    // ERC20
    APPROVE: "0x095ea7b3", // approve(address,uint256)
    INCREASE_ALLOWANCE: "0x39509351", // increaseAllowance(address,uint256)
    DECREASE_ALLOWANCE: "0xa457c2d7", // decreaseAllowance(address,uint256)

    // ERC721/ERC1155
    SET_APPROVAL_FOR_ALL: "0xa22cb465", // setApprovalForAll(address,bool)

    // ERC721 specific
    APPROVE_NFT: "0x095ea7b3", // approve(address,uint256) - same as ERC20 but for NFT

    // Common permit patterns (EIP-2612)
    PERMIT: "0xd505accf", // permit(address,address,uint256,uint256,uint8,bytes32,bytes32)
  };

  /**
   * Detect wallet provider injection
   */
  function detectWalletProvider() {
    if (window.ethereum) {
      console.log("[ApprovalGuard] Wallet provider detected");
      notifyBackground({ type: "WALLET_DETECTED", provider: "ethereum" });
      setupWalletObserver();
      return true;
    }
    return false;
  }

  /**
   * Setup observer for wallet interactions
   * Monkey-patch ethereum.request to observe calls (forward unchanged)
   */
  function setupWalletObserver() {
    if (!window.ethereum || window.ethereum._approvalGuardPatched) {
      return;
    }

    const originalRequest = window.ethereum.request.bind(window.ethereum);

    window.ethereum.request = async function (args) {
      // Observe the call
      observeWalletCall(args);

      // CRITICAL: Always forward unchanged
      return originalRequest(args);
    };

    window.ethereum._approvalGuardPatched = true;
    console.log("[ApprovalGuard] Wallet observer active");

    // Listen for account changes
    if (window.ethereum.on) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          detectedWallet = accounts[0];
          notifyBackground({
            type: "WALLET_CONNECTED",
            address: accounts[0],
          });
        }
      });

      window.ethereum.on("chainChanged", (chainId) => {
        lastChainId = chainId;
        notifyBackground({
          type: "CHAIN_CHANGED",
          chainId,
        });
      });
    }
  }

  /**
   * Observe wallet calls and detect approval patterns
   * CRITICAL: This function ONLY observes - never blocks or modifies
   */
  function observeWalletCall(args) {
    const { method, params } = args;

    switch (method) {
      case "eth_requestAccounts":
        console.log("[ApprovalGuard] Account connection requested");
        notifyBackground({ type: "CONNECTION_REQUESTED" });
        break;

      case "eth_sendTransaction":
      case "eth_signTransaction":
        if (params && params[0]) {
          analyzeTransaction(params[0]);
        }
        break;

      case "eth_signTypedData":
      case "eth_signTypedData_v3":
      case "eth_signTypedData_v4":
        // Detect permit signatures (gasless approvals)
        analyzeTypedData(method, params);
        break;

      case "personal_sign":
      case "eth_sign":
        // Log for awareness but likely not approval-related
        console.log("[ApprovalGuard] Signature request detected");
        break;
    }
  }

  /**
   * Analyze transaction data for approval calls
   */
  function analyzeTransaction(tx) {
    if (!tx.data || tx.data.length < 10) return;

    const data = tx.data.toLowerCase();
    const signature = data.slice(0, 10);

    if (
      signature === SIGNATURES.APPROVE ||
      signature === SIGNATURES.INCREASE_ALLOWANCE
    ) {
      // ERC20 approve(address spender, uint256 amount)
      const spender = "0x" + data.slice(34, 74);
      const amount = data.slice(74, 138);
      const isUnlimited = isUnlimitedApproval(amount);

      console.log("[ApprovalGuard] ERC20 approval detected", {
        spender,
        unlimited: isUnlimited,
        method:
          signature === SIGNATURES.APPROVE ? "approve" : "increaseAllowance",
      });

      notifyBackground({
        type: "APPROVAL_DETECTED",
        tokenType: "ERC20",
        token: tx.to,
        spender,
        unlimited: isUnlimited,
        amount: "0x" + amount,
        domain: window.location.hostname,
      });
    } else if (signature === SIGNATURES.SET_APPROVAL_FOR_ALL) {
      // ERC721/1155 setApprovalForAll(address operator, bool approved)
      const operator = "0x" + data.slice(34, 74);
      const approved = data.slice(74, 138);

      // Only notify if approving (not revoking)
      if (parseInt(approved, 16) === 1) {
        console.log("[ApprovalGuard] NFT approval detected", { operator });

        notifyBackground({
          type: "APPROVAL_DETECTED",
          tokenType: "NFT",
          token: tx.to,
          operator,
          unlimited: true, // setApprovalForAll grants access to ALL tokens
          domain: window.location.hostname,
        });
      }
    } else if (signature === SIGNATURES.PERMIT) {
      // Direct permit call
      console.log("[ApprovalGuard] Permit approval detected");
      notifyBackground({
        type: "APPROVAL_DETECTED",
        tokenType: "ERC20_PERMIT",
        token: tx.to,
        domain: window.location.hostname,
      });
    }
  }

  /**
   * Analyze typed data for Permit signatures (EIP-2612, EIP-4494)
   */
  function analyzeTypedData(method, params) {
    try {
      if (!params || params.length < 2) return;

      const dataStr = params[1];
      const data = typeof dataStr === "string" ? JSON.parse(dataStr) : dataStr;

      // Check if this is a Permit signature
      if (
        data.primaryType === "Permit" ||
        (data.types && data.types.Permit) ||
        (data.domain && data.domain.name && data.message)
      ) {
        console.log(
          "[ApprovalGuard] Permit signature detected (gasless approval)",
        );

        notifyBackground({
          type: "PERMIT_DETECTED",
          tokenType: "PERMIT",
          domain: window.location.hostname,
          permitType: data.primaryType,
        });
      }
    } catch (err) {
      // Silently ignore parse errors
      console.debug("[ApprovalGuard] Could not parse typed data");
    }
  }

  /**
   * Check if approval amount is unlimited (common pattern)
   */
  function isUnlimitedApproval(amountHex) {
    // Check for max uint256 or very large values
    const bigValue = BigInt("0x" + amountHex);
    const threshold = BigInt("0xffffffffffffffffffffffffffffffff"); // 2^128 - 1
    return bigValue >= threshold;
  }

  /**
   * Send message to background script
   */
  function notifyBackground(message) {
    chrome.runtime
      .sendMessage({
        ...message,
        timestamp: Date.now(),
        url: window.location.href,
        domain: window.location.hostname,
      })
      .catch((err) => {
        console.warn("[ApprovalGuard] Failed to notify background:", err);
      });
  }

  function showInlineApprovalWarning(payload) {
    try {
      const { riskLevel, tokenType, unlimited, domain, spender } = payload;
      const containerId = "approval-guard-banner";
      const existing = document.getElementById(containerId);
      if (existing) existing.remove();

      const banner = document.createElement("div");
      banner.id = containerId;
      banner.textContent = `${domain || "This site"} requested ${
        unlimited ? "UNLIMITED " : ""
      }${tokenType} approval${spender ? ` to ${formatAddress(spender)}` : ""}`;
      banner.style.position = "fixed";
      banner.style.top = "16px";
      banner.style.right = "16px";
      banner.style.zIndex = "2147483647";
      banner.style.padding = "12px 14px";
      banner.style.borderRadius = "10px";
      banner.style.fontSize = "14px";
      banner.style.fontFamily = "Inter, system-ui, -apple-system, sans-serif";
      banner.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)";
      banner.style.color = "#0f172a";
      banner.style.background =
        riskLevel === "CRITICAL"
          ? "#fee2e2"
          : riskLevel === "HIGH"
            ? "#fef9c3"
            : "#e0f2fe";
      banner.style.border =
        riskLevel === "CRITICAL"
          ? "1px solid #ef4444"
          : riskLevel === "HIGH"
            ? "1px solid #f59e0b"
            : "1px solid #38bdf8";

      document.body.appendChild(banner);
      setTimeout(() => banner.remove(), 6000);
    } catch (err) {
      console.debug("[ApprovalGuard] Could not render inline warning", err);
    }
  }

  function formatAddress(address) {
    if (!address || address.length < 10) return "unknown";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "APPROVAL_WARNING") {
      showInlineApprovalWarning(message);
    }
  });

  // Initialize detection
  // Try immediately and retry (some wallets inject asynchronously)
  if (!detectWalletProvider()) {
    setTimeout(detectWalletProvider, 1000);
    setTimeout(detectWalletProvider, 3000);
  }
})();
