/**
 * Selective Disclosure - Popup
 * Main: "What do you want to prove?" + proof list + Add new proof.
 * Add new proof: Step 1 = Connect or select wallet, Step 2 = What to prove (DAO Member / NFT Holder).
 */

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
let proofs = [];

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

// DAOs: gov token icon (optional iconUrl) + token address (Sepolia test: WETH; mainnet would use real gov token)
const DAO_OPTIONS = [
  { id: "moondao", name: "MoonDAO", token: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", iconUrl: "https://moondao.com/favicon.ico", fallback: "M" },
  { id: "uniswap", name: "Uniswap", token: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", iconUrl: "https://app.uniswap.org/favicon.ico", fallback: "U" },
  { id: "ens", name: "ENS", token: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", iconUrl: "https://ens.domains/favicon.ico", fallback: "E" },
];

// NFT collections: Sepolia (user-provided contract 0x5867...)
const NFT_OPTIONS = [
  { id: "sepolia-nft", name: "Sepolia NFT", nftContract: "0x5867eaF2a28034124bC05583EB6Ee20323e01EE3", iconUrl: null, fallback: "🖼" },
];

// Token Holder asset options
const ASSET_OPTIONS = {
  "weth-sepolia": { type: "erc20", tokenAddress: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", label: "WETH" },
  "eth-native": { type: "native", label: "Sepolia ETH" },
  custom: { type: "erc20", tokenAddress: "", label: "Custom ERC20" },
};

// --- Step 2: Claim type selection ---
function showStep2Panel(panelId) {
  document.querySelectorAll("#screenAddStep2 .step2-panel").forEach((p) => p.classList.remove("active"));
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add("active");
  document.getElementById("step2Error").style.display = "none";
  document.getElementById("step2Error").textContent = "";
}

function renderDaoList() {
  const list = document.getElementById("daoList");
  list.innerHTML = "";
  DAO_OPTIONS.forEach((dao) => {
    const div = document.createElement("div");
    div.className = "dao-option";
    div.dataset.daoId = dao.id;
    div.innerHTML = `
      ${dao.iconUrl ? `<img class="dao-icon" src="${dao.iconUrl}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><span class="dao-icon-fallback" style="display: none;">${dao.fallback}</span>` : `<span class="dao-icon-fallback">${dao.fallback}</span>`}
      <span>${dao.name}</span>
    `;
    div.addEventListener("click", () => onDaoSelected(dao));
    list.appendChild(div);
  });
}

function onDaoSelected(dao) {
  runVerify({ assetType: "erc20", tokenAddress: dao.token, proofLabel: `${dao.name} Member` });
}

// --- Step 2: Token Holder ---
function onAssetSelectChange() {
  const sel = document.getElementById("assetSelect");
  const wrap = document.getElementById("customTokenWrap");
  wrap.style.display = sel.value === "custom" ? "block" : "none";
}

function onVerifyToken() {
  const assetId = document.getElementById("assetSelect").value;
  const customAddr = document.getElementById("customTokenInput").value.trim();
  const opt = ASSET_OPTIONS[assetId] || ASSET_OPTIONS.custom;
  let tokenAddress = opt.tokenAddress;
  if (assetId === "custom") {
    tokenAddress = customAddr.replace(/^0x/, "") ? (customAddr.startsWith("0x") ? customAddr : "0x" + customAddr) : "";
    if (!tokenAddress || tokenAddress.length !== 42) {
      document.getElementById("step2Error").textContent = "Enter a valid ERC20 token address (0x…).";
      document.getElementById("step2Error").style.display = "block";
      return;
    }
  }
  const assetLabel = opt.label || (assetId === "custom" ? "Custom" : "Token");
  runVerify({ assetType: opt.type, tokenAddress: opt.type === "erc20" ? tokenAddress : undefined, proofLabel: `Hold ${assetLabel}` });
}

function runVerify({ assetType, tokenAddress, nftContractAddress, proofLabel }) {
  const errEl = document.getElementById("step2Error");
  const hintEl = document.getElementById("step2Hint");
  errEl.style.display = "none";
  errEl.textContent = "";
  hintEl.style.display = "block";
  hintEl.textContent = "Checking…";

  const payload = {
    type: "CHECK_CLAIM",
    address: selectedAddress,
    assetType,
    minBalanceWei: "1",
    assetLabel: proofLabel,
  };
  if (assetType === "erc20") payload.tokenAddress = tokenAddress;
  if (assetType === "nft") payload.nftContractAddress = nftContractAddress;

  chrome.runtime.sendMessage(
    payload,
    (res) => {
      hintEl.textContent = "";
      hintEl.style.display = "none";
      if (!res) {
        errEl.textContent = "No response. Open a normal website and try again.";
        errEl.style.display = "block";
        return;
      }
      if (!res.ok) {
        errEl.textContent = res.error || "Check failed.";
        errEl.style.display = "block";
        return;
      }
      if (!res.verified) {
        errEl.textContent = "You don't satisfy this claim.";
        errEl.style.display = "block";
        return;
      }
      const sharedWith = res.origin ? [res.origin] : [];
      proofs.push({
        id: String(Date.now()),
        claimType: proofLabel,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        recentlySharedWith: sharedWith,
      });
      chrome.storage.local.set({ selective_disclosure_proofs: proofs });
      renderProofs(proofs);
      showScreen("screenMain");
    }
  );
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["selective_disclosure_proofs"], (result) => {
    proofs = result.selective_disclosure_proofs || [];
    renderProofs(proofs);
  });

  document.getElementById("addNewProof").addEventListener("click", openAddStep1);

  document.getElementById("connectNewWallet").addEventListener("click", connectNewWallet);
  document.getElementById("backFromStep1").addEventListener("click", () => showScreen("screenMain"));

  document.getElementById("backFromStep2").addEventListener("click", () => openAddStep1());

  // Claim type selection
  document.querySelectorAll(".claim-type-option[data-claim-type]").forEach((el) => {
    el.addEventListener("click", () => {
      const type = el.dataset.claimType;
      if (type === "dao") {
        renderDaoList();
        showStep2Panel("step2PanelDao");
      } else if (type === "nft") {
        renderNftList();
        showStep2Panel("step2PanelNft");
      } else if (type === "token") {
        showStep2Panel("step2PanelToken");
      }
    });
  });

  document.getElementById("step2BackFromDao").addEventListener("click", () => showStep2Panel("step2PanelChoice"));
  document.getElementById("step2BackFromNft").addEventListener("click", () => showStep2Panel("step2PanelChoice"));
  document.getElementById("step2BackFromToken").addEventListener("click", () => showStep2Panel("step2PanelChoice"));

  document.getElementById("assetSelect").addEventListener("change", onAssetSelectChange);
  document.getElementById("verifyTokenBtn").addEventListener("click", onVerifyToken);
});
