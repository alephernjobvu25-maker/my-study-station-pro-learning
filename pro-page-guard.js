/* Require a verified active Pro membership before showing legacy Pro resource pages. */
document.addEventListener('DOMContentLoaded', async () => {
  const result = await window.MSS?.requireArea('pro');
  if (!result) return;
  if (!result.membership?.active && !result.privileged) {
    const status = document.getElementById('pro-access-status') || document.createElement('p');
    status.id = 'pro-access-status';
    status.className = 'status error';
    status.textContent = result.error?.message || 'We could not verify your Pro membership. Please refresh or sign in again.';
    if (!status.isConnected) document.body.prepend(status);
    return;
  }
  document.documentElement.classList.remove('mss-pro-checking');
});
