/**
 * Selective Disclosure Wallet - Background
 *
 * - Store and retrieve saved wallet addresses
 * - On "Connect new wallet": run eth_requestAccounts in the PAGE context (where MetaMask lives)
 * - On claim selected: call our smart contract (eth_call) in the page context to verify the claim.
 */

const STORAGE_KEY_ADDRESSES = "selective_disclosure_saved_addresses";
const STORAGE_KEY_PROOFS = "selective_disclosure_proofs";
const STORAGE_KEY_PENDING_SITE = "reveal_pending_site_request";

// ERC20DAOClaimModule: verify(address user, bytes calldata data) where data = abi.encode(token, minBalance)
const ERC20_CLAIM_MODULE = {
  address: "0xAc93B403c21e9c2fdfFdD760e85efaFaf532Aedf",
  verifySelector: "0x4a41d1ac",
};

// ERC721ClaimModule per chain. Deploy to Gnosis (100) for POAP verification.
const ERC721_CLAIM_MODULES = {
  11155111: "0x5867eaF2a28034124bC05583EB6Ee20323e01EE3", // Sepolia
  100: "0x0000000000000000000000000000000000000000", // Gnosis – deploy ERC721ClaimModule for POAP
};

chrome.runtime.onInstalled.addListener(() => {
  console.log("[SelectiveDisclosure] Extension installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPEN_POPUP") {
    const { siteName, requiredProof } = message;
    const tabId = sender?.tab?.id ?? null;
    const pending = { siteName: siteName || "This site", requiredProof: requiredProof || "proof", tabId, at: Date.now() };
    chrome.storage.local.set({ [STORAGE_KEY_PENDING_SITE]: pending });
    chrome.action
      .openPopup()
      .then(() => sendResponse({ ok: true }))
      .catch(() => {
        chrome.tabs.create({ url: chrome.runtime.getURL("popup/popup.html") });
        sendResponse({ ok: true });
      });
    return true;
  }

  if (message.type === "GET_PENDING_SITE") {
    chrome.storage.local.get([STORAGE_KEY_PENDING_SITE], (r) => {
      sendResponse({ pending: r[STORAGE_KEY_PENDING_SITE] || null });
    });
    return true;
  }

  if (message.type === "CLEAR_PENDING_SITE") {
    chrome.storage.local.remove(STORAGE_KEY_PENDING_SITE);
    sendResponse({ ok: true });
    return false;
  }

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

  if (message.type === "SIGN_PROOF") {
    const { address, proofLabel, claimSignData } = message;
    if (!address || !proofLabel) {
      sendResponse({ ok: false, error: "Missing address or proof label." });
      return false;
    }
    chrome.storage.local.get([STORAGE_KEY_PENDING_SITE], (storage) => {
      const pending = storage[STORAGE_KEY_PENDING_SITE];
      const preferredTabId = pending?.tabId ?? null;
      const resolveTab = (cb) => {
        if (preferredTabId) {
          chrome.tabs.get(preferredTabId, (tab) => {
            if (!chrome.runtime.lastError && tab?.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://"))) {
              cb(tab);
            } else {
              chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => cb(tabs[0]));
            }
          });
        } else {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => cb(tabs[0]));
        }
      };
      resolveTab((tab) => {
        if (!tab?.id || !tab.url || tab.url.startsWith("chrome-extension://")) {
          sendResponse({ ok: false, error: "Keep the site that requested proof open and try again." });
          return;
        }
        const args = [
          address,
          proofLabel,
          claimSignData && typeof claimSignData === "object"
            ? {
                chainId: Number(claimSignData.chainId),
                claimType: String(claimSignData.claimType || ""),
                module: String(claimSignData.module || ""),
                data: String(claimSignData.data || ""),
              }
            : null,
        ];
        chrome.scripting.executeScript(
          { target: { tabId: tab.id }, world: "MAIN", func: signProofInPage, args },
          (results) => {
            if (chrome.runtime.lastError) {
              sendResponse({ ok: false, error: chrome.runtime.lastError.message || "Could not sign." });
              return;
            }
            const r = results?.[0]?.result;
            if (r?.error) sendResponse({ ok: false, error: r.error });
            else sendResponse({ ok: true });
          },
        );
      });
    });
    return true;
  }

  if (message.type === "SHARE_PROOF") {
    const { proof, origin } = message;
    if (!proof) {
      sendResponse({ ok: false, error: "No proof to share." });
      return false;
    }
    function trySend(tab, done) {
      if (!tab?.id || !tab.url || tab.url.startsWith("chrome-extension://")) {
        done(false);
        return;
      }
      chrome.tabs.sendMessage(tab.id, { type: "REVEAL_PROOF_RECEIVED", proof }, () => {
        if (!chrome.runtime.lastError) {
          done(true);
          return;
        }
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            world: "MAIN",
            func: (data) => {
              document.dispatchEvent(new CustomEvent("reveal-proof-received", { detail: data }));
            },
            args: [proof],
          },
    () => {
            const err = chrome.runtime.lastError;
            done(!err);
          },
        );
      });
    }
    chrome.tabs.query({}, (tabs) => {
      const httpTabs = tabs.filter(
        (t) => t.url && (t.url.startsWith("http://") || t.url.startsWith("https://"))
      );
      const byOrigin = origin
        ? httpTabs.filter((t) => {
            try {
              const u = new URL(t.url);
              const h = u.hostname;
              const hp = u.port ? h + ":" + u.port : h;
              return h === origin || hp === origin || (origin === "localhost" && h === "127.0.0.1") || (origin === "127.0.0.1" && h === "localhost");
            } catch (_) {
              return false;
            }
          })
        : [];
      const activeTab = httpTabs.find((t) => t.active);
      const toTry = byOrigin.length ? byOrigin : activeTab ? [activeTab] : httpTabs.slice(0, 5);
      let i = 0;
      function next() {
        if (i >= toTry.length) {
          sendResponse({ ok: false, error: "Could not send proof. Keep the fake-gate page open, refresh it, then try again." });
          return;
        }
        const tab = toTry[i];
        chrome.tabs.update(tab.id, { active: true });
        chrome.windows.update(tab.windowId, { focused: true });
        trySend(tab, (ok) => {
          if (ok) {
            sendResponse({ ok: true });
          } else {
            i++;
            next();
          }
        });
      }
      next();
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

  if (message.type === "DELETE_ADDRESS") {
    const { address } = message;
    if (!address) {
      sendResponse({ ok: false });
      return false;
    }
    chrome.storage.local.get([STORAGE_KEY_ADDRESSES], (result) => {
      const list = result[STORAGE_KEY_ADDRESSES] || [];
      const lower = address.toLowerCase();
      const filtered = list.filter((a) => a.address.toLowerCase() !== lower);
      chrome.storage.local.set({ [STORAGE_KEY_ADDRESSES]: filtered });
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "CONNECT_NEW_WALLET") {
    chrome.storage.local.get([STORAGE_KEY_PENDING_SITE], (storage) => {
      const pending = storage[STORAGE_KEY_PENDING_SITE];
      const preferredTabId = pending?.tabId ?? null;

      const resolveTab = (cb) => {
        if (preferredTabId) {
          chrome.tabs.get(preferredTabId, (tab) => {
            if (!chrome.runtime.lastError && tab?.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://"))) {
              cb(tab);
            } else {
              chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => cb(tabs[0]));
            }
          });
        } else {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => cb(tabs[0]));
        }
      };

      resolveTab((tab) => {
        if (!tab?.id || !tab.url) {
          sendResponse({ ok: false, error: "No active tab." });
          return;
        }
        const url = tab.url;
        if (
          url.startsWith("chrome://") ||
          url.startsWith("edge://") ||
          url.startsWith("about:") ||
          url.startsWith("chrome-extension://")
        ) {
          sendResponse({
            ok: false,
            error:
              "Keep the site that requested proof (e.g. localhost) open and try again.",
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
    });
    return true;
  }

  if (message.type === "CHECK_CLAIM") {
    const { address, assetType, tokenAddress, nftContractAddress, minBalanceWei } = message;
    if (!address) {
      sendResponse({ ok: false, error: "Missing address." });
      return false;
    }
    const minWei = (minBalanceWei ?? "0").toString();

    chrome.storage.local.get([STORAGE_KEY_PENDING_SITE], (storage) => {
      const pending = storage[STORAGE_KEY_PENDING_SITE];
      const preferredTabId = pending?.tabId ?? null;

      const resolveTab = (cb) => {
        if (preferredTabId) {
          chrome.tabs.get(preferredTabId, (tab) => {
            if (!chrome.runtime.lastError && tab?.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://"))) {
              cb(tab);
            } else {
              chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                cb(tabs[0]);
              });
            }
          });
        } else {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            cb(tabs[0]);
          });
        }
      };

      resolveTab((tab) => {
        if (!tab?.id || !tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:") || tab.url.startsWith("chrome-extension://")) {
          sendResponse({ ok: false, error: "Open the site that requested proof (e.g. localhost) and try again." });
          return;
        }
      let origin = null;
      try {
        if (tab.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://"))) {
          origin = new URL(tab.url).hostname;
        }
      } catch (_) {}

      if (assetType === "nft") {
        const nftContract = (nftContractAddress || "").trim();
        const chainId = message.chainId ? parseInt(String(message.chainId), 10) : null;
        if (!nftContract || nftContract.length !== 42) {
          sendResponse({ ok: false, error: "Invalid NFT contract address." });
          return false;
        }
        const moduleAddress = (chainId && ERC721_CLAIM_MODULES[chainId]) || ERC721_CLAIM_MODULES[11155111];
        if (!moduleAddress || moduleAddress === "0x0000000000000000000000000000000000000000") {
          sendResponse({
            ok: false,
            error: chainId === 100
              ? "ERC721 module not deployed on Gnosis. Deploy ERC721ClaimModule to Gnosis for POAP verification."
              : "ERC721 module not configured.",
          });
          return false;
        }
        const calldata = buildVerifyCalldataForNFT(address, nftContract);
        if (!calldata) {
          sendResponse({ ok: false, error: "Invalid address or NFT contract." });
          return false;
        }
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            world: "MAIN",
            func: chainId ? switchChainAndCallContractInPage : callContractInPage,
            args: chainId ? [chainId, moduleAddress, calldata] : [moduleAddress, calldata],
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
            const chainIdRes = chainId || 11155111;
            const nftHex = nftContract.replace(/^0x/, "").toLowerCase().padStart(64, "0");
            const dataHex = "0x" + "0".repeat(24) + nftHex.slice(-40);
            const claimSignData = {
              chainId: chainIdRes,
              claimType: "NFT_OWNERSHIP",
              module: moduleAddress,
              data: dataHex,
            };
            sendResponse({ ok: true, verified: !!r?.verified, origin, claimSignData });
          }
        );
        return;
      }

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
            const tokenHex = token.replace(/^0x/, "").toLowerCase().padStart(64, "0");
            const minHex = BigInt(minWei).toString(16).padStart(64, "0");
            const dataHex = "0x" + tokenHex + minHex;
            const claimSignData = {
              chainId: 11155111,
              claimType: "DAO_MEMBERSHIP",
              module: contractAddress,
              data: dataHex,
            };
          sendResponse({ ok: true, verified: !!r?.verified, origin, claimSignData });
        }
      );
      });
    });
    return true;
  }
});

/**
 * Build calldata for ERC721 module: verify(address user, bytes data) where data = abi.encode(nftContract).
 * Returns hex string (no 0x prefix) or null if invalid.
 */
function buildVerifyCalldataForNFT(userAddress, nftContractAddress) {
  const user = (userAddress || "").replace(/^0x/, "").toLowerCase();
  const nft = (nftContractAddress || "").replace(/^0x/, "").toLowerCase();
  if (user.length !== 40 || nft.length !== 40) return null;
  const selector = (ERC20_CLAIM_MODULE.verifySelector || "").replace(/^0x/, "");
  if (selector.length !== 8) return null;
  const offset = "0000000000000000000000000000000000000000000000000000000000000040";
  const length = "0000000000000000000000000000000000000000000000000000000000000020";
  const nftPadded = nft.padStart(64, "0");
  return selector + user.padStart(64, "0") + offset + length + nftPadded;
}

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
 * Runs in the page context. Switches to chainId, then calls contract. For POAP on Gnosis / NFT on Sepolia.
 * args: [chainId, contractAddress, calldataHex].
 * Inlined eth_call logic – injected functions cannot reference other background functions.
 */
function switchChainAndCallContractInPage(chainId, contractAddress, calldataHex) {
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
    const doCall = () => {
      const data = (calldataHex || "").replace(/^0x/, "");
      if (!data) return Promise.resolve({ error: "Invalid calldata." });
      return provider
        .request({ method: "eth_call", params: [{ to: contractAddress, data: "0x" + data }] })
        .then((result) => {
          if (result == null || result === "0x") return { verified: false };
          const hex = String(result).replace(/^0x/, "").padStart(64, "0").slice(-64);
          const verified = hex.slice(-2) !== "00" && parseInt(hex.slice(-2), 16) !== 0;
          return { verified };
        })
        .catch((err) => {
          const msg = err?.message || "Contract call failed.";
          const data = err?.data || err?.error?.data;
          return { error: data ? `${msg} (revert data: ${data})` : msg };
        });
    };
    const chainIdHex = "0x" + parseInt(chainId, 10).toString(16);
    provider
      .request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] })
      .then(doCall)
      .then((r) => resolve(r))
      .catch((err) => {
        if (err?.code === 4902) {
          resolve({ error: "Please add this network to your wallet first." });
        } else {
          resolve({ error: err?.message || "Chain switch or call failed." });
        }
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
 * Runs in the page context (world: MAIN). Signs a proof message.
 * If claimSignData is provided, uses eth_signTypedData_v4 (EIP-712) for structured display in MetaMask.
 * Otherwise falls back to personal_sign.
 * args: [address, proofLabel, claimSignData?].
 */
function signProofInPage(address, proofLabel, claimSignData) {
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
    if (claimSignData && claimSignData.chainId && claimSignData.claimType && claimSignData.module && claimSignData.data) {
      const timestamp = Math.floor(Date.now() / 1000);
      const expiresAt = timestamp + 3600;
      const nonceBytes = new Uint8Array(32);
      if (typeof crypto !== "undefined" && crypto.getRandomValues) {
        crypto.getRandomValues(nonceBytes);
      }
      const nonceHex = "0x" + Array.from(nonceBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
      const typedData = {
        domain: {
          name: "Reveal",
          version: "1",
          chainId: claimSignData.chainId,
        },
        types: {
          Claim: [
            { name: "ClaimType", type: "string" },
            { name: "Module", type: "address" },
            { name: "Data", type: "bytes" },
            { name: "Timestamp", type: "uint256" },
            { name: "ExpiresAt", type: "uint256" },
            { name: "Nonce", type: "bytes32" },
          ],
        },
        primaryType: "Claim",
        message: {
          ClaimType: claimSignData.claimType,
          Module: claimSignData.module,
          Data: claimSignData.data,
          Timestamp: String(timestamp),
          ExpiresAt: String(expiresAt),
          Nonce: nonceHex,
        },
      };
      provider
        .request({
          method: "eth_signTypedData_v4",
          params: [address, JSON.stringify(typedData)],
        })
        .then(() => resolve({ ok: true }))
        .catch((err) => resolve({ error: err?.message || "Signature rejected." }));
    } else {
      const msg = `Proof: I hold ${proofLabel}.\nFor selective disclosure.\nTimestamp: ${Date.now()}`;
      const hexMsg = "0x" + Array.from(new TextEncoder().encode(msg)).map((b) => b.toString(16).padStart(2, "0")).join("");
      provider
        .request({ method: "personal_sign", params: [hexMsg, address] })
        .then(() => resolve({ ok: true }))
        .catch((err) => resolve({ error: err?.message || "Signature rejected." }));
    }
  });
}

/**
 * Runs in the page context (world: MAIN). Requests accounts via eth_requestAccounts,
 * then proves control by having the user sign a message (personal_sign). Both steps
 * require user interaction with MetaMask.
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
      .then((accounts) => {
        const addr = accounts && accounts[0];
        if (!addr) {
          resolve({ error: "No accounts returned." });
          return;
        }
        const msg = "Sign to prove you control this wallet for Selective Disclosure.\n\n" + Date.now();
        const hexMsg = "0x" + Array.from(new TextEncoder().encode(msg)).map((b) => b.toString(16).padStart(2, "0")).join("");
        return provider.request({
          method: "personal_sign",
          params: [hexMsg, addr],
        }).then(() => resolve({ addresses: [addr] })).catch((err) =>
          resolve({ error: err?.message || "Signature rejected or failed." }),
        );
      })
      .catch((err) =>
        resolve({ error: err?.message || "Wallet request failed." }),
      );
  });
}
