// Popup UI logic
const WEB_APP_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  const scanButton = document.getElementById("scanButton");
  const walletIndicator = document.getElementById("walletIndicator");
  const walletStatus = document.getElementById("walletStatus");
  const addressRow = document.getElementById("addressRow");
  const walletAddress = document.getElementById("walletAddress");

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Get tab state from background
  const response = await chrome.runtime.sendMessage({
    type: "GET_TAB_STATE",
    tabId: tab.id,
  });

  // Update UI based on state
  if (response && response.walletDetected) {
    walletIndicator.classList.add("green");
    walletStatus.textContent = "Wallet detected on this page";

    if (response.address) {
      addressRow.style.display = "flex";
      walletAddress.textContent = formatAddress(response.address);
      scanButton.disabled = false;
    } else {
      walletStatus.textContent = "Wallet detected (not connected)";
      scanButton.disabled = false;
    }
  } else {
    walletIndicator.classList.add("gray");
    walletStatus.textContent = "No wallet detected";
    scanButton.textContent = "Open Web App";
    scanButton.disabled = false;
  }

  // Handle scan button click
  scanButton.addEventListener("click", () => {
    openWebApp(tab, response);
  });
});

// Open web app with context
function openWebApp(tab, state = {}) {
  const params = new URLSearchParams();

  if (state.address) {
    params.set("address", state.address);
  }
  if (state.chainId) {
    params.set("chainId", state.chainId);
  }
  if (tab.url) {
    try {
      const domain = new URL(tab.url).hostname;
      params.set("domain", domain);
    } catch (e) {
      // Invalid URL
    }
  }

  const url = `${WEB_APP_URL}?${params.toString()}`;
  chrome.tabs.create({ url });
}

// Format address for display
function formatAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Add listener for GET_TAB_STATE in background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_TAB_STATE") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        const state = getTabState(tabId);
        sendResponse(state);
      } else {
        sendResponse({});
      }
    });
    return true; // Keep channel open for async response
  }
});
