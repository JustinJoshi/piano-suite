// Opens the coach when the user clicks the toolbar button.
// Chrome shows a native side panel. Desktop Firefox opens the sidebar.
// Firefox for Android has neither, so the coach opens in a new tab.
if (typeof chrome !== "undefined" && chrome.sidePanel?.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error("sidePanel behavior failed:", err));
} else if (typeof browser !== "undefined" && browser.action?.onClicked) {
  browser.action.onClicked.addListener(() => {
    if (browser.sidebarAction?.open) {
      browser.sidebarAction.open().catch((err) => console.error("sidebarAction failed:", err));
    } else if (browser.tabs?.create) {
      browser.tabs.create({ url: "/extension/sidepanel.html" });
    }
  });
}
