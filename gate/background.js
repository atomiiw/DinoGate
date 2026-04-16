const BLOCKED_SITES = [
  { id: 1, domain: "instagram.com", urlFilter: "||instagram.com" }
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ sessions: {} });
});

// Listen for messages from the gate page
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "unlock") {
    unlockSite(msg.domain, msg.seconds).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === "getSession") {
    getSession(msg.domain).then(session => sendResponse(session));
    return true;
  }
});

async function unlockSite(domain, seconds) {
  const site = BLOCKED_SITES.find(s => s.domain === domain);
  if (!site) return;

  const expiresAt = Date.now() + seconds * 1000;

  // Remove the blocking rule
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [site.id]
  });

  // Also disable the static rule
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    disableRulesetIds: ["blocked_sites"]
  });

  // Save session
  const { sessions } = await chrome.storage.local.get("sessions");
  sessions[domain] = { expiresAt };
  await chrome.storage.local.set({ sessions });

  // Schedule relock.
  // chrome.alarms has a ~1 min minimum, so use setTimeout for precision.
  // Keep alarm as backup in case the service worker restarts.
  chrome.alarms.create(`relock-${domain}`, {
    delayInMinutes: Math.max(seconds / 60, 0.5)
  });
  setTimeout(() => relockSite(domain), seconds * 1000);
}

async function relockSite(domain) {
  const site = BLOCKED_SITES.find(s => s.domain === domain);
  if (!site) return;

  // Check if session is actually expired (avoid double-relock)
  const { sessions } = await chrome.storage.local.get("sessions");
  const session = sessions?.[domain];
  if (!session) return; // already relocked

  if (Date.now() < session.expiresAt) return; // not expired yet (alarm fired early)

  // Re-enable the static ruleset
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: ["blocked_sites"]
  });

  // Clear session
  delete sessions[domain];
  await chrome.storage.local.set({ sessions });

  // Redirect any open tabs on this domain back to the gate
  const gateUrl = chrome.runtime.getURL("gate/dinogate.html");
  const tabs = await chrome.tabs.query({ url: `*://*.${domain}/*` });
  for (const tab of tabs) {
    chrome.tabs.update(tab.id, { url: gateUrl });
  }
}

async function getSession(domain) {
  const { sessions } = await chrome.storage.local.get("sessions");
  const session = sessions?.[domain];
  if (!session) return null;
  if (Date.now() >= session.expiresAt) {
    await relockSite(domain);
    return null;
  }
  return session;
}

// Handle alarm — relock when time expires
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name.startsWith("relock-")) {
    const domain = alarm.name.replace("relock-", "");
    relockSite(domain);
  }
});

// On startup, check for expired sessions
chrome.runtime.onStartup.addListener(async () => {
  const { sessions } = await chrome.storage.local.get("sessions");
  if (!sessions) return;
  for (const domain of Object.keys(sessions)) {
    if (Date.now() >= sessions[domain].expiresAt) {
      await relockSite(domain);
    }
  }
});
