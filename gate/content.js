// DinoGate content script — injected into blocked-site pages.
// Reads session expiry from storage and shows a countdown when time is almost up.

const COUNTDOWN_SECONDS = 10;

// On load, check if there's an active session and schedule the countdown.
chrome.storage.local.get("sessions", ({ sessions }) => {
  if (!sessions) return;

  // Find the session for the current domain
  const hostname = location.hostname.replace(/^www\./, "");
  let expiresAt = null;
  for (const domain of Object.keys(sessions)) {
    if (hostname === domain || hostname.endsWith("." + domain)) {
      expiresAt = sessions[domain].expiresAt;
      break;
    }
  }
  if (!expiresAt) return;

  const msUntilExpiry = expiresAt - Date.now();
  if (msUntilExpiry <= 0) return; // already expired, background will redirect

  const msUntilCountdown = msUntilExpiry - COUNTDOWN_SECONDS * 1000;

  if (msUntilCountdown <= 0) {
    // Less than 10 seconds left — show countdown immediately with remaining time
    showCountdown(Math.max(1, Math.ceil(msUntilExpiry / 1000)));
  } else {
    setTimeout(() => {
      showCountdown(COUNTDOWN_SECONDS);
    }, msUntilCountdown);
  }
});

function showCountdown(seconds) {
  if (document.getElementById("dinogate-countdown")) return;

  const overlay = document.createElement("div");
  overlay.id = "dinogate-countdown";
  Object.assign(overlay.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    background: "rgba(255, 255, 255, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "2147483647",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "rgb(32, 33, 36)",
    flexDirection: "column",
    gap: "16px",
    pointerEvents: "none",
  });

  const number = document.createElement("div");
  Object.assign(number.style, {
    fontSize: "160px",
    fontWeight: "200",
    fontVariantNumeric: "tabular-nums",
    lineHeight: "1",
    color: "rgb(32, 33, 36)",
    transition: "color 0.3s ease",
  });
  number.textContent = seconds;

  const label = document.createElement("div");
  Object.assign(label.style, {
    fontSize: "14px",
    fontWeight: "400",
    color: "rgb(95, 99, 104)",
    letterSpacing: "0.01em",
  });
  label.textContent = "session ending";

  overlay.appendChild(number);
  overlay.appendChild(label);
  document.body.appendChild(overlay);

  let remaining = seconds;
  const interval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(interval);
      number.textContent = "0";
      number.style.color = "rgb(217, 48, 37)";
      return;
    }
    number.textContent = remaining;

    if (remaining <= 3) {
      number.style.color = "rgb(217, 48, 37)";
    }
  }, 1000);
}
