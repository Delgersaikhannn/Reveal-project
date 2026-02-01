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
  document.body.classList.toggle("site-request-active", id === "screenSiteRequest");
}

function renderProofs(proofs) {
  const list = document.getElementById("proofList");
  list.innerHTML = "";
  proofs.forEach((proof, index) => {
    const li = document.createElement("li");
    li.className = "proof-item";
    li.innerHTML = `
      <div class="proof-item-header">
        <div class="proof-item-content">
          <div class="proof-type">${proof.claimType}</div>
          <div class="proof-ttl">${formatTTL(proof.expiresAt)}</div>
        </div>
        <button class="proof-delete-icon" type="button" title="Delete proof">×</button>
      </div>
      <div class="proof-detail" style="display: none;">
        <div class="proof-detail-row"><span class="proof-detail-label">TTL:</span> ${formatExpiresAt(proof.expiresAt)}</div>
        <div class="proof-detail-row"><span class="proof-detail-label">Recently shared with:</span></div>
        <div class="proof-detail-row">${proof.recentlySharedWith?.length ? proof.recentlySharedWith.join(", ") : "Not shared yet"}</div>
        <button class="btn btn-primary proof-share-btn" type="button" style="margin-top: 10px;">Share with site</button>
      </div>
    `;
    const detailEl = li.querySelector(".proof-detail");
    const shareBtn = li.querySelector(".proof-share-btn");
    const deleteIcon = li.querySelector(".proof-delete-icon");
    shareBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      shareProof(proof);
    });
    deleteIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteProof(index);
    });
    li.addEventListener("click", (e) => {
      if (e.target.closest(".proof-share-btn") || e.target.closest(".proof-delete-icon")) return;
      const open = detailEl.style.display !== "none";
      detailEl.style.display = open ? "none" : "block";
      li.classList.toggle("expanded", !open);
    });
    list.appendChild(li);
  });
}

function shareProof(proof) {
  chrome.runtime.sendMessage(
    { type: "SHARE_PROOF", proof, origin: proof.recentlySharedWith?.[0] },
    (res) => {
      if (!res?.ok && res?.error) alert(res.error);
    },
  );
}

function deleteProof(index) {
  proofs.splice(index, 1);
  chrome.storage.local.set({ selective_disclosure_proofs: proofs });
  renderProofs(proofs);
}

// --- Site request (opened from gated page) ---
let pendingSiteRequest = null;

// --- Sign proof (after verification succeeds) ---
let pendingVerifiedClaim = null;

function showSiteRequest(siteName, requiredProof) {
  document.getElementById("siteRequestTitle").textContent = `${siteName} needs proof of ${requiredProof}.`;
  document.getElementById("siteRequestHint").textContent = "Connect wallet to continue.";
  showScreen("screenSiteRequest");
}

// --- Add new proof: Step 1 (connect or select) ---
let selectedAddress = null;
let proofs = [];

function openAddStep1() {
  selectedAddress = null;
  showScreen("screenAddStep1");
  document.getElementById("step1Error").style.display = "none";
  document.getElementById("step1Error").textContent = "";
  refreshWalletList();
}

function selectSavedAddress(address) {
  selectedAddress = address;
  document.getElementById("selectedAddressLabel").textContent = "Wallet: " + shortenAddress(address);
  const nft = pendingSiteRequest ? nftOptionForRequiredProof(pendingSiteRequest.requiredProof) : null;
  if (nft) {
    showScreen("screenAddStep2");
    runVerify({
      assetType: "nft",
      nftContractAddress: nft.nftContract,
      chainId: nft.chainId,
      proofLabel: `NFT Holder (${nft.name})`,
    });
  } else {
    showScreen("screenAddStep2");
  }
}

function deleteWallet(address, onDone) {
  chrome.runtime.sendMessage({ type: "DELETE_ADDRESS", address }, () => {
    if (onDone) onDone();
  });
}

function refreshWalletList() {
  chrome.runtime.sendMessage({ type: "GET_SAVED_ADDRESSES" }, (res) => {
    const list = document.getElementById("savedWalletList");
    list.innerHTML = "";
    const addresses = (res && res.addresses) || [];
    if (addresses.length === 0) {
      list.innerHTML = '<li style="cursor: default; color: #6b7280; padding: 10px 12px;">No saved wallets yet. Connect a wallet below.</li>';
    } else {
      addresses.forEach(({ address }) => {
        const li = document.createElement("li");
        li.className = "wallet-item";
        li.innerHTML = `<span class="wallet-item-address">${shortenAddress(address)}</span><button class="wallet-delete" type="button" aria-label="Remove wallet">Remove</button>`;
        li.dataset.address = address;
        const addrEl = li.querySelector(".wallet-item-address");
        const delBtn = li.querySelector(".wallet-delete");
        addrEl.addEventListener("click", () => {
          list.querySelectorAll(".wallet-item").forEach((el) => el.classList.remove("selected"));
          li.classList.add("selected");
          selectSavedAddress(address);
        });
        delBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteWallet(address, () => refreshWalletList());
        });
        list.appendChild(li);
      });
    }
  });
}

function connectNewWallet() {
  const errEl = document.getElementById("step1Error");
  errEl.style.display = "none";
  errEl.textContent = "";
  const btn = document.getElementById("connectNewWallet");
  btn.disabled = true;
  btn.textContent = "Approve in MetaMask…";

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
    const nft = pendingSiteRequest ? nftOptionForRequiredProof(pendingSiteRequest.requiredProof) : null;
    if (nft) {
      showScreen("screenAddStep2");
      runVerify({
        assetType: "nft",
        nftContractAddress: nft.nftContract,
        chainId: nft.chainId,
        proofLabel: `NFT Holder (${nft.name})`,
      });
  } else {
      showScreen("screenAddStep2");
    }
  });
}

// DAOs: gov token icon (optional iconUrl) + token address (Sepolia test: WETH; mainnet would use real gov token)
const DAO_OPTIONS = [
  { id: "moondao", name: "MoonDAO", token: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", iconUrl: "https://moondao.com/favicon.ico", fallback: "M" },
  { id: "uniswap", name: "Uniswap", token: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", iconUrl: "https://app.uniswap.org/favicon.ico", fallback: "U" },
  { id: "ens", name: "ENS", token: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", iconUrl: "https://ens.domains/favicon.ico", fallback: "E" },
];

// NFT collections. POAP contract same on Ethereum/Gnosis; user must be on Gnosis (100) for POAP.
const NFT_OPTIONS = [
  //TODO: tmp use test nft on sepolia
  { id: "eth-chiangmai-poap", name: "ETH Chiang Mai POAP", nftContract: "0xD5Babab921A9167ABBf7f093FD6969A86eA4EAa8", chainId: 11155111, fallback: "🎫" },
  // { id: "eth-chiangmai-poap", name: "ETH Chiang Mai POAP", nftContract: "0x22C1f6050E56d2876009903609a2cC3fEf83B415", chainId: 100, fallback: "🎫" },
  { id: "sepolia-nft", name: "Sepolia NFT (test)", nftContract: "0xd5babab921a9167abbf7f093fd6969a86ea4eaa8", chainId: 11155111, fallback: "🖼" },
];

function nftOptionForRequiredProof(requiredProof) {
  return NFT_OPTIONS.find((n) => n.name === requiredProof) || null;
}

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

function renderNftList() {
  const list = document.getElementById("nftList");
  list.innerHTML = "";
  NFT_OPTIONS.forEach((nft) => {
    const div = document.createElement("div");
    div.className = "dao-option";
    div.dataset.nftId = nft.id;
    div.innerHTML = `
      ${nft.iconUrl ? `<img class="dao-icon" src="${nft.iconUrl}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" /><span class="dao-icon-fallback" style="display: none;">${nft.fallback}</span>` : `<span class="dao-icon-fallback">${nft.fallback}</span>`}
      <span>${nft.name}</span>
    `;
    div.addEventListener("click", () => onNftSelected(nft));
    list.appendChild(div);
  });
}

function onNftSelected(nft) {
  runVerify({
    assetType: "nft",
    nftContractAddress: nft.nftContract,
    chainId: nft.chainId,
    proofLabel: `NFT Holder (${nft.name})`,
  });
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

function runVerify({ assetType, tokenAddress, nftContractAddress, chainId, proofLabel }) {
  const errEl = document.getElementById("step2Error");
  const hintEl = document.getElementById("step2Hint");
  const titleEl = document.getElementById("step2Title");
  const verifyingPanel = document.getElementById("step2PanelVerifying");
  const verifyingLabel = document.getElementById("step2VerifyingLabel");
  const choicePanel = document.getElementById("step2PanelChoice");
  errEl.style.display = "none";
  errEl.textContent = "";
  hintEl.style.display = "block";
  hintEl.textContent = "Checking…";
  if (pendingSiteRequest) {
    titleEl.textContent = "Verifying proof";
    verifyingLabel.textContent = `Verifying ${proofLabel}…`;
    const metaMaskHint = document.getElementById("step2VerifyingMetaMask");
    if (metaMaskHint) metaMaskHint.style.display = chainId ? "block" : "none";
    document.querySelectorAll("#screenAddStep2 .step2-panel").forEach((p) => p.classList.remove("active"));
    verifyingPanel.classList.add("active");
  } else {
    titleEl.textContent = "What to prove?";
    document.querySelectorAll("#screenAddStep2 .step2-panel").forEach((p) => p.classList.remove("active"));
    if (choicePanel) choicePanel.classList.add("active");
  }

  const payload = {
    type: "CHECK_CLAIM",
    address: selectedAddress,
    assetType,
    minBalanceWei: "1",
    assetLabel: proofLabel,
  };
  if (assetType === "erc20") payload.tokenAddress = tokenAddress;
  if (assetType === "nft") {
    payload.nftContractAddress = nftContractAddress;
    if (chainId) payload.chainId = chainId;
  }

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
      pendingVerifiedClaim = { proofLabel, origin: res.origin };
      showSignProof(proofLabel);
    }
  );
}

function showSignProof(proofLabel) {
  document.getElementById("signProofClaim").textContent = `You have ${proofLabel}.`;
  document.getElementById("signProofHint").textContent = "Sign to generate proof that you can share with the site.";
  document.getElementById("signProofError").style.display = "none";
  document.getElementById("signProofError").textContent = "";
  const imgWrap = document.getElementById("signProofImageWrap");
  const img = document.getElementById("signProofImage");
  if (proofLabel && /eth\s*chiang\s*mai|chiang\s*mai\s*poap/i.test(proofLabel)) {
    img.src = chrome.runtime.getURL("assets/ethcmpoap.png");
    img.alt = "ETH Chiang Mai POAP";
    imgWrap.style.display = "block";
  } else {
    imgWrap.style.display = "none";
  }
  showScreen("screenSignProof");
}

function signProof() {
  if (!pendingVerifiedClaim || !selectedAddress) return;
  const btn = document.getElementById("signProofBtn");
  const errEl = document.getElementById("signProofError");
  btn.disabled = true;
  btn.textContent = "Sign in MetaMask…";
  errEl.style.display = "none";
  errEl.textContent = "";
  chrome.runtime.sendMessage(
    { type: "SIGN_PROOF", address: selectedAddress, proofLabel: pendingVerifiedClaim.proofLabel },
    (res) => {
      btn.disabled = false;
      btn.textContent = "Sign proof";
      if (!res || !res.ok) {
        errEl.textContent = res?.error || "Signing failed.";
        errEl.style.display = "block";
        return;
      }
      const sharedWith = pendingVerifiedClaim.origin ? [pendingVerifiedClaim.origin] : [];
      proofs.push({
        id: String(Date.now()),
        claimType: pendingVerifiedClaim.proofLabel,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        recentlySharedWith: sharedWith,
      });
      chrome.storage.local.set({ selective_disclosure_proofs: proofs });
      if (pendingSiteRequest) {
        pendingSiteRequest = null;
        chrome.runtime.sendMessage({ type: "CLEAR_PENDING_SITE" });
      }
      pendingVerifiedClaim = null;
      renderProofs(proofs);
      showScreen("screenMain");
    },
  );
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ type: "GET_PENDING_SITE" }, (res) => {
    const pending = res && res.pending;
    if (pending && pending.siteName && pending.requiredProof) {
      pendingSiteRequest = pending;
      showSiteRequest(pending.siteName, pending.requiredProof);
      } else {
      showScreen("screenMain");
    }
  });

  chrome.storage.local.get(["selective_disclosure_proofs"], (result) => {
    proofs = result.selective_disclosure_proofs || [];
    renderProofs(proofs);
  });

  document.getElementById("siteRequestConnect").addEventListener("click", () => {
    openAddStep1();
  });

  document.getElementById("siteRequestCancel").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "CLEAR_PENDING_SITE" });
    pendingSiteRequest = null;
    showScreen("screenMain");
  });

  document.getElementById("addNewProof").addEventListener("click", openAddStep1);

  document.getElementById("signProofBtn").addEventListener("click", signProof);
  document.getElementById("signProofCancel").addEventListener("click", () => {
    pendingVerifiedClaim = null;
    showScreen("screenMain");
  });

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
