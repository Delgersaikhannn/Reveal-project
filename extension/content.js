/**
 * Selective Disclosure Wallet - Content Script
 *
 * Injects extension ID and handles Reveal option click directly (custom events
 * don't cross page/content-script boundary). Sends OPEN_POPUP to background
 * which opens the extension via chrome.tabs.create.
 */

(function () {
  "use strict";
  try {
    document.documentElement.setAttribute("data-reveal-extension-id", chrome.runtime.id);
  } catch (e) {}

  function handleRevealClick(e) {
    var target = e.target;
    while (target && target !== document.body) {
      if (target.getAttribute && target.getAttribute("data-wallet") === "reveal") {
        e.preventDefault();
        e.stopPropagation();
        var modal = document.querySelector(".modal-overlay.open, [id='modalOverlay']");
        if (modal) modal.classList.remove("open");
        var siteMeta = document.querySelector('meta[name="reveal-site-name"]');
        var proofMeta = document.querySelector('meta[name="reveal-required-proof"]');
        var siteName = (siteMeta && siteMeta.getAttribute("content")) || document.location.hostname || "This site";
        var requiredProof = (proofMeta && proofMeta.getAttribute("content")) || "proof";
        try {
          if (!chrome.runtime?.id) return;
          chrome.runtime.sendMessage({ type: "OPEN_POPUP", siteName: siteName, requiredProof: requiredProof }, function () {
            if (chrome.runtime.lastError) void 0;
          });
        } catch (err) {
          /* Extension context invalidated (e.g. extension reloaded) */
        }
        return;
      }
      target = target.parentElement;
    }
  }

  document.addEventListener("click", handleRevealClick, true);

  chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
    if (message.type === "REVEAL_PROOF_RECEIVED" && message.proof) {
      try {
        document.dispatchEvent(new CustomEvent("reveal-proof-received", { detail: message.proof }));
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false });
      }
    }
    return true;
  });
})();
