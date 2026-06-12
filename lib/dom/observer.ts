export function observeDOMChanges(
  onMutation: () => void,
): MutationObserver {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const observer = new MutationObserver(() => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(onMutation, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
}
