export function showToast({ message = '', type = 'success', duration = 4000 } = {}) {
  try {
    window.dispatchEvent(new CustomEvent('showToast', { detail: { message, type, duration } }));
  } catch (err) {
    // Fallback: console.log so nothing breaks if window isn't available
    // eslint-disable-next-line no-console
    console.log('Toast:', type, message);
  }
}

export default showToast;
