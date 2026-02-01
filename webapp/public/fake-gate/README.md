# Fake Gate – Sign in with Ethereum

Gated content page for testing the Reveal extension. Served at **http://localhost:3000/fake-gate/** when the webapp is running.

## Run

From the `webapp` directory:

```bash
npm run dev
```

Then open **http://localhost:3000/fake-gate/** in your browser.

## Flow

1. Click **Connect wallet** → modal opens
2. Click **Reveal** → opens the extension (via content script injection)
3. (Planned) Extension sends proofs back to the page → page verifies → navigate to gated content
