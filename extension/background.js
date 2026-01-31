/**
 * Selective Disclosure Wallet - Background
 *
 * - Store and retrieve saved wallet addresses
 * - On "Connect new wallet": run eth_requestAccounts in the PAGE context (where MetaMask lives)
 * - On claim selected: call our smart contract (eth_call) in the page context to verify the claim.
 */

const STORAGE_KEY_ADDRESSES = "selective_disclosure_saved_addresses";
const STORAGE_KEY_PROOFS = "selective_disclosure_proofs";

// ERC20DAOClaimModule: verify(address user, bytes calldata data) where data = abi.encode(token, minBalance)
const ERC20_CLAIM_MODULE = {
  address: "0xAc93B403c21e9c2fdfFdD760e85efaFaf532Aedf",
  verifySelector: "0x4a41d1ac",
};

chrome.runtime.onInstalled.addListener(() => {
  console.log("[SelectiveDisclosure] Extension installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_SAVED_ADDRESSES") {
    chrome.storage.local.get([STORAGE_KEY_ADDRESSES], (result) => {
      const list = result[STORAGE_KEY_ADDRESSES] || [];
      sendResponse({ addresses: list });
    });
    return true;
  }

  if (message.type === "GET_SAVED_PROOFS") {
    chrome.storage.local.get([STORAGE_KEY_PROOFS], (result) => {
      const list = result[STORAGE_KEY_PROOFS] || [];
      sendResponse({ proofs: list });
    });
    return true;
  }

  if (message.type === "SAVE_PROOFS") {
    const { proofs } = message;
    if (!Array.isArray(proofs)) {
      sendResponse({ ok: false });
      return false;
    }
    chrome.storage.local.set({ [STORAGE_KEY_PROOFS]: proofs });
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === "SAVE_ADDRESS") {
    const { address } = message;
    if (!address) {
      sendResponse({ ok: false });
      return false;
    }
    chrome.storage.local.get([STORAGE_KEY_ADDRESSES], (result) => {
      const list = result[STORAGE_KEY_ADDRESSES] || [];
      const lower = address.toLowerCase();
      if (!list.some((a) => a.address.toLowerCase() === lower)) {
        list.push({ address: lower, addedAt: Date.now() });
        chrome.storage.local.set({ [STORAGE_KEY_ADDRESSES]: list });
      }
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "CONNECT_NEW_WALLET") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id || !tab.url) {
        sendResponse({ ok: false, error: "No active tab." });
        return;
      }
      const url = tab.url;
      if (
        url.startsWith("chrome://") ||
        url.startsWith("edge://") ||
        url.startsWith("about:")
      ) {
        sendResponse({
          ok: false,
          error:
            "Open a normal website (e.g. google.com or any dApp), then try again.",
        });
        return;
      }

      // Run in the PAGE's JavaScript context (same as any webpage) so we see window.ethereum
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          world: "MAIN",
          func: requestAccountsInPage,
        },
        (results) => {
          if (chrome.runtime.lastError) {
            sendResponse({
              ok: false,
              error:
                chrome.runtime.lastError.message ||
                "Could not run on this page. Try a normal website (https://...) and refresh.",
            });
            return;
          }
          const r = results?.[0]?.result;
          if (r?.error) {
            sendResponse({ ok: false, error: r.error });
            return;
          }
          if (r?.addresses && r.addresses.length > 0) {
            sendResponse({ ok: true, addresses: r.addresses });
          } else {
            sendResponse({ ok: false, error: "No accounts returned." });
          }
        },
      );
    });
    return true;
  }

  if (message.type === "CHECK_CLAIM") {
    const { address, assetType, tokenAddress, minBalanceWei } = message;
    if (!address) {
      sendResponse({ ok: false, error: "Missing address." });
      return false;
    }
    const minWei = (minBalanceWei ?? "0").toString();

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id || !tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
        sendResponse({ ok: false, error: "Open a normal website and try again." });
        return;
      }
      let origin = null;
      try {
        if (tab.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://"))) {
          origin = new URL(tab.url).hostname;
        }
      } catch (_) {}

      if (assetType === "native") {
        // Native ETH: use eth_getBalance, no contract
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            world: "MAIN",
            func: checkNativeBalanceInPage,
            args: [address, minWei],
          },
          (results) => {
            if (chrome.runtime.lastError) {
              sendResponse({ ok: false, error: chrome.runtime.lastError.message || "Could not check balance." });
              return;
            }
            const r = results?.[0]?.result;
            if (r?.error) {
              sendResponse({ ok: false, error: r.error });
              return;
            }
            sendResponse({ ok: true, verified: !!r?.verified, origin });
          }
        );
        return;
      }

      // ERC20: use contract
      const token = (tokenAddress || "").trim();
      if (!token || token.length !== 42) {
        sendResponse({ ok: false, error: "Invalid token address." });
        return false;
      }
      const contractAddress = ERC20_CLAIM_MODULE.address;
      if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
        sendResponse({ ok: false, error: "ERC20 module not configured." });
        return false;
      }
      const calldata = buildVerifyCalldata(address, token, minWei);
      if (!calldata) {
        sendResponse({ ok: false, error: "Invalid address or token." });
        return false;
      }
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          world: "MAIN",
          func: buildAndCallVerifyInPage,
          args: [contractAddress, address, token, minWei, calldata],
        },
        (results) => {
          if (chrome.runtime.lastError) {
            sendResponse({ ok: false, error: chrome.runtime.lastError.message || "Could not call contract." });
            return;
          }
          const r = results?.[0]?.result;
          if (r?.error) {
            sendResponse({ ok: false, error: r.error });
            return;
          }
          sendResponse({ ok: true, verified: !!r?.verified, origin });
        }
      );
    });
    return true;
  }
});

/**
 * Build calldata for verify(address user, bytes data) where data = abi.encode(token, minBalance).
 * Returns hex string (no 0x prefix) or null if invalid.
 */
function buildVerifyCalldata(userAddress, tokenAddress, minBalanceWei) {
  const user = (userAddress || "").replace(/^0x/, "").toLowerCase();
  const token = (tokenAddress || "").replace(/^0x/, "").toLowerCase();
  if (user.length !== 40 || token.length !== 40) return null;
  const minHex = BigInt(minBalanceWei).toString(16).padStart(64, "0");
  const selector = (ERC20_CLAIM_MODULE.verifySelector || "").replace(/^0x/, "");
  if (selector.length !== 8) return null;
  
  const offset = "0000000000000000000000000000000000000000000000000000000000000040";
  const length = "0000000000000000000000000000000000000000000000000000000000000040";
  const tokenPadded = token.padStart(64, "0");
  return selector + user.padStart(64, "0") + offset + length + tokenPadded + minHex;
}

/**
 * Runs in the page context (world: MAIN). Checks native ETH balance via eth_getBalance.
 * args: [userAddress, minBalanceWei].
 */
function checkNativeBalanceInPage(userAddress, minBalanceWei) {
  return new Promise((resolve) => {
    const w = typeof window !== "undefined" ? window : null;
    if (!w || !w.ethereum) {
      resolve({ error: "No wallet on this page." });
      return;
    }
    const provider = Array.isArray(w.ethereum) ? w.ethereum[0] : w.ethereum;
    if (!provider || typeof provider.request !== "function") {
      resolve({ error: "Wallet not ready." });
      return;
    }
    provider
      .request({ method: "eth_getBalance", params: [userAddress, "latest"] })
      .then((balanceHex) => {
        const balance = BigInt(balanceHex || "0x0");
        const min = BigInt(minBalanceWei || "0");
        resolve({ verified: balance >= min });
      })
      .catch((err) => resolve({ error: err?.message || "Balance check failed." }));
  });
}

/**
 * Runs in the page context (world: MAIN). Builds verify calldata using the page's ethers
 * (same as contract test: AbiCoder.encode(["address","uint256"], [token, minBalance])), then eth_call.
 * Falls back to pre-built calldata if no ethers.
 * args: [contractAddress, userAddress, tokenAddress, minBalanceWei, fallbackCalldataHex].
 */
function buildAndCallVerifyInPage(contractAddress, userAddress, tokenAddress, minBalanceWei, fallbackCalldataHex) {
  return new Promise((resolve) => {
    const w = typeof window !== "undefined" ? window : null;
    if (!w || !w.ethereum) {
      resolve({ error: "No wallet on this page." });
      return;
    }
    const provider = Array.isArray(w.ethereum) ? w.ethereum[0] : w.ethereum;
    if (!provider || typeof provider.request !== "function") {
      resolve({ error: "Wallet not ready." });
      return;
    }
    let calldataHex = (fallbackCalldataHex || "").replace(/^0x/, "");
    const ethers = w.ethers;
    if (ethers) {
      try {
        // Match contract test exactly: ethers.AbiCoder.defaultAbiCoder().encode(["address","uint256"], [token, minBalance])
        const abiCoder = ethers.AbiCoder && typeof ethers.AbiCoder.defaultAbiCoder === "function"
          ? ethers.AbiCoder.defaultAbiCoder()
          : ethers.utils && ethers.utils.defaultAbiCoder
            ? ethers.utils.defaultAbiCoder
            : null;
        if (abiCoder) {
          const data = abiCoder.encode(
            ["address", "uint256"],
            [tokenAddress, minBalanceWei],
          );
          const dataHex = typeof data === "string" ? data.replace(/^0x/, "") : data;
          const iface = ethers.Interface
            ? new ethers.Interface(["function verify(address user, bytes data) view returns (bool)"])
            : ethers.utils && ethers.utils.Interface
              ? new ethers.utils.Interface(["function verify(address user, bytes data) view returns (bool)"])
              : null;
          if (iface && typeof iface.encodeFunctionData === "function") {
            const fullCalldata = iface.encodeFunctionData("verify", [userAddress, "0x" + dataHex]);
            calldataHex = (fullCalldata || "").replace(/^0x/, "");
          }
        }
      } catch (e) {
        console.warn("[SelectiveDisclosure] ethers encode failed, using fallback:", e);
      }
    }
    if (!calldataHex) {
      resolve({ error: "Could not build calldata (no ethers and no fallback)." });
      return;
    }
    const callParams = { to: contractAddress, data: "0x" + calldataHex };
    if (userAddress && /^0x?[0-9a-fA-F]{40}$/.test(String(userAddress).replace(/^0x/, ""))) {
      callParams.from = userAddress.startsWith("0x") ? userAddress : "0x" + userAddress;
    }
    provider
      .request({
        method: "eth_call",
        params: [callParams],
      })
      .then((result) => {
        if (result == null || result === "0x") {
          resolve({ verified: false });
          return;
        }
        const hex = String(result).replace(/^0x/, "").padStart(64, "0").slice(-64);
        const verified = hex.slice(-2) !== "00" && parseInt(hex.slice(-2), 16) !== 0;
        resolve({ verified });
      })
      .catch((err) => {
        const msg = err?.message || "Contract call failed.";
        const data = err?.data || err?.error?.data;
        const fullError = data ? `${msg} (revert data: ${data})` : msg;
        resolve({ error: fullError });
      });
  });
}

/**
 * Runs in the page context (world: MAIN). Calls contract with pre-built calldata (eth_call).
 * args: [contractAddress, calldataHex] – calldataHex is full data (no 0x prefix).
 */
function callContractInPage(contractAddress, calldataHex) {
  return new Promise((resolve) => {
    const w = typeof window !== "undefined" ? window : null;
    if (!w || !w.ethereum) {
      resolve({ error: "No wallet on this page." });
      return;
    }
    const provider = Array.isArray(w.ethereum) ? w.ethereum[0] : w.ethereum;
    if (!provider || typeof provider.request !== "function") {
      resolve({ error: "Wallet not ready." });
      return;
    }
    const data = (calldataHex || "").replace(/^0x/, "");
    if (!data) {
      resolve({ error: "Invalid calldata." });
      return;
    }
    provider
      .request({
        method: "eth_call",
        params: [{ to: contractAddress, data: "0x" + data }],
      })
      .then((result) => {
        if (result == null || result === "0x") {
          resolve({ verified: false });
          return;
        }
        const hex = String(result).replace(/^0x/, "").padStart(64, "0").slice(-64);
        const verified = hex.slice(-2) !== "00" && parseInt(hex.slice(-2), 16) !== 0;
        resolve({ verified });
      })
      .catch((err) => {
        const msg = err?.message || "Contract call failed.";
        const data = err?.data || err?.error?.data;
        const fullError = data ? `${msg} (revert data: ${data})` : msg;
        resolve({ error: fullError });
      });
  });
}

/**
 * Runs in the page context (world: MAIN). Must be a plain function, no closures.
 */
function requestAccountsInPage() {
  return new Promise((resolve) => {
    const w = typeof window !== "undefined" ? window : null;
    if (!w || !w.ethereum) {
      resolve({
        error:
          "No wallet on this page. Install MetaMask and refresh, or open a normal website.",
      });
      return;
    }
    const provider = Array.isArray(w.ethereum) ? w.ethereum[0] : w.ethereum;
    if (!provider || typeof provider.request !== "function") {
      resolve({
        error: "Wallet provider not ready. Refresh the page and try again.",
      });
      return;
    }
    provider
      .request({ method: "eth_requestAccounts" })
      .then((accounts) => resolve({ addresses: accounts || [] }))
      .catch((err) =>
        resolve({ error: err?.message || "Wallet request failed." }),
      );
  });
}
