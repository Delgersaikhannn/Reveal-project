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
        chrome.runtime.sendMessage({ type: "OPEN_POPUP" });
        return;
      }
      target = target.parentElement;
    }
  }

  document.addEventListener("click", handleRevealClick, true);
})();
