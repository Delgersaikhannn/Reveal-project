/**
 * Selective Disclosure - Popup
 * Main: "What do you want to prove?" + proof list + Add new proof.
 * Add new proof: Step 1 = Connect or select wallet, Step 2 = What to prove (DAO Member / NFT Holder).
 */

const DUMMY_PROOFS = [
  { id: "1", claimType: "DAO Member", expiresAt: Date.now() + 2 * 60 * 60 * 1000, recentlySharedWith: ["app.uniswap.org", "vote.ens.domains"] },
  { id: "2", claimType: "NFT Holder", expiresAt: Date.now() + 24 * 60 * 60 * 1000, recentlySharedWith: ["opensea.io"] },
  { id: "3", claimType: "DAO Member", expiresAt: Date.now() + 30 * 60 * 1000, recentlySharedWith: [] },
];

function formatTTL(expiresAt) {
  const ms = expiresAt - Date.now();
  if (ms <= 0) return "Expired";
  const minutes = Math.floor(ms / (60 * 1000));
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days > 0) return `Expires in ${days}d`;
  if (hours > 0) return `Expires in ${hours}h`;
  return `Expires in ${minutes}m`;
}

function formatExpiresAt(expiresAt) {
  return new Date(expiresAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

function shortenAddress(address) {
  if (!address || address.length < 10) return address;
  return address.slice(0, 6) + "…" + address.slice(-4);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function renderProofs(proofs) {
  const list = document.getElementById("proofList");
  list.innerHTML = "";
  proofs.forEach((proof) => {
    const li = document.createElement("li");
    li.className = "proof-item";
    li.innerHTML = `
      <div class="proof-type">${proof.claimType}</div>
      <div class="proof-ttl">${formatTTL(proof.expiresAt)}</div>
      <div class="proof-detail" style="display: none;">
        <div class="proof-detail-row"><span class="proof-detail-label">TTL:</span> ${formatExpiresAt(proof.expiresAt)}</div>
        <div class="proof-detail-row"><span class="proof-detail-label">Recently shared with:</span></div>
        <div class="proof-detail-row">${proof.recentlySharedWith?.length ? proof.recentlySharedWith.join(", ") : "None"}</div>
      </div>
    `;
    const detailEl = li.querySelector(".proof-detail");
    li.addEventListener("click", () => {
      const open = detailEl.style.display !== "none";
      detailEl.style.display = open ? "none" : "block";
      li.classList.toggle("expanded", !open);
    });
    list.appendChild(li);
  });
}

// --- Add new proof: Step 1 (connect or select) ---
let selectedAddress = null;
let proofs = [...DUMMY_PROOFS];

function openAddStep1() {
  selectedAddress = null;
  showScreen("screenAddStep1");
  document.getElementById("step1Error").style.display = "none";
  document.getElementById("step1Error").textContent = "";
  chrome.runtime.sendMessage({ type: "GET_SAVED_ADDRESSES" }, (res) => {
    const list = document.getElementById("savedWalletList");
    list.innerHTML = "";
    const addresses = (res && res.addresses) || [];
    if (addresses.length === 0) {
      list.innerHTML = '<li class="wallet-item" style="cursor: default; color: #6b7280;">No saved wallets yet. Connect a wallet below.</li>';
    } else {
      addresses.forEach(({ address }) => {
        const li = document.createElement("li");
        li.className = "wallet-item";
        li.textContent = shortenAddress(address);
        li.dataset.address = address;
        li.addEventListener("click", () => selectSavedAddress(address));
        list.appendChild(li);
      });
    }
  });
}

function selectSavedAddress(address) {
  selectedAddress = address;
  document.getElementById("selectedAddressLabel").textContent = "Wallet: " + shortenAddress(address);
  showScreen("screenAddStep2");
}

function connectNewWallet() {
  const errEl = document.getElementById("step1Error");
  errEl.style.display = "none";
  errEl.textContent = "";
  const btn = document.getElementById("connectNewWallet");
  btn.disabled = true;
  btn.textContent = "Check MetaMask in the tab…";

  chrome.runtime.sendMessage({ type: "CONNECT_NEW_WALLET" }, (res) => {
    btn.disabled = false;
    btn.textContent = "Connect new wallet";
    if (!res) {
      errEl.textContent = "No response. Refresh the page and try again.";
      errEl.style.display = "block";
      return;
    }
    if (!res.ok) {
      errEl.textContent = res.error || "Connection failed.";
      errEl.style.display = "block";
      return;
    }
    const addresses = res.addresses || [];
    if (addresses.length === 0) {
      errEl.textContent = "No accounts returned.";
      errEl.style.display = "block";
      return;
    }
    const address = addresses[0];
    chrome.runtime.sendMessage({ type: "SAVE_ADDRESS", address }, () => {});
    selectedAddress = address;
    document.getElementById("selectedAddressLabel").textContent = "Wallet: " + shortenAddress(address);
    showScreen("screenAddStep2");
  });
}

// --- Step 2: What to prove ---
function onClaimSelected(claimType) {
  // For now: add a dummy proof and go back to main
  proofs.push({
    id: String(Date.now()),
    claimType,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    recentlySharedWith: [],
  });
  renderProofs(proofs);
  showScreen("screenMain");
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  renderProofs(proofs);

  document.getElementById("addNewProof").addEventListener("click", openAddStep1);

  document.getElementById("connectNewWallet").addEventListener("click", connectNewWallet);
  document.getElementById("backFromStep1").addEventListener("click", () => showScreen("screenMain"));

  document.getElementById("backFromStep2").addEventListener("click", () => openAddStep1());

  document.querySelectorAll(".claim-option").forEach((el) => {
    el.addEventListener("click", () => onClaimSelected(el.dataset.claim));
  });
});
