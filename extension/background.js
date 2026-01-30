/**
 * Selective Disclosure Wallet - Background
 *
 * - Store and retrieve saved wallet addresses
 * - On "Connect new wallet": run eth_requestAccounts in the PAGE context (where MetaMask lives)
 *   via chrome.scripting.executeScript with world: "MAIN", so we don't rely on content script.
 */

const STORAGE_KEY_ADDRESSES = "selective_disclosure_saved_addresses";

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
      if (url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:")) {
        sendResponse({ ok: false, error: "Open a normal website (e.g. google.com or any dApp), then try again." });
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
              error: chrome.runtime.lastError.message || "Could not run on this page. Try a normal website (https://...) and refresh.",
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
        }
      );
    });
    return true;
  }
});

/**
 * Runs in the page context (world: MAIN). Must be a plain function, no closures.
 */
function requestAccountsInPage() {
  return new Promise((resolve) => {
    const w = typeof window !== "undefined" ? window : null;
    if (!w || !w.ethereum) {
      resolve({ error: "No wallet on this page. Install MetaMask and refresh, or open a normal website." });
      return;
    }
    const provider = Array.isArray(w.ethereum) ? w.ethereum[0] : w.ethereum;
    if (!provider || typeof provider.request !== "function") {
      resolve({ error: "Wallet provider not ready. Refresh the page and try again." });
      return;
    }
    provider
      .request({ method: "eth_requestAccounts" })
      .then((accounts) => resolve({ addresses: accounts || [] }))
      .catch((err) => resolve({ error: err?.message || "Wallet request failed." }));
  });
}
