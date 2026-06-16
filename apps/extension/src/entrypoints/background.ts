export default defineBackground(() => {
  browser.commands.onCommand.addListener((command: string) => {
    if (command !== 'toggle-dictation') return;

    // Forward the toggle to the active tab's content script.
    // The content script owns the recording state — background just forwards.
    void browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;

      browser.tabs.sendMessage(tab.id, { type: 'toggle-dictation' }).catch(() => {
        // Content script may not be injected on this tab — silently ignore
      });
    });
  });
});
