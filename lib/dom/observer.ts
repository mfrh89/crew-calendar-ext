const OWN_IDS = new Set(['crew-calendar-strip', 'crew-calendar-banner', 'crew-calendar-modal-overlay']);

function isOwnMutation(mutation: MutationRecord): boolean {
  const target = mutation.target as HTMLElement;
  if (target.id && OWN_IDS.has(target.id)) return true;
  if (target.closest?.('#crew-calendar-strip, #crew-calendar-banner, #crew-calendar-modal-overlay')) return true;

  for (const node of mutation.addedNodes) {
    if (node instanceof HTMLElement && node.id && OWN_IDS.has(node.id)) return true;
  }
  for (const node of mutation.removedNodes) {
    if (node instanceof HTMLElement && node.id && OWN_IDS.has(node.id)) return true;
  }
  return false;
}

export function observeDOMChanges(
  onMutation: () => void,
): MutationObserver {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const observer = new MutationObserver((mutations) => {
    if (mutations.every(isOwnMutation)) return;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(onMutation, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
}
