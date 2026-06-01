/* ═══════════════════════════════════════════════════════════
   AUTH MODULE — Google OAuth + Guest Mode
   Replace GOOGLE_CLIENT_ID with your Google OAuth 2.0 Client ID
   from https://console.cloud.google.com/
   ═══════════════════════════════════════════════════════════ */

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

const Auth = (() => {
  let _user = null;

  function _load() {
    try { const raw = localStorage.getItem('ht_auth_user'); if (raw) _user = JSON.parse(raw); } catch { _user = null; }
  }

  function _save(u) {
    _user = u;
    if (u) localStorage.setItem('ht_auth_user', JSON.stringify(u));
    else    localStorage.removeItem('ht_auth_user');
  }

  function _parseJwt(token) {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(
      atob(b64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    ));
  }

  function isConfigured() {
    return GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
  }

  function initGoogle(onSuccess, onError) {
    if (!isConfigured()) { if (onError) onError('not_configured'); return; }
    if (typeof google === 'undefined' || !google.accounts) { if (onError) onError('library_missing'); return; }
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: resp => {
        try {
          const p = _parseJwt(resp.credential);
          _save({ id: 'g_' + p.sub, name: p.name, email: p.email, picture: p.picture, provider: 'google' });
          if (onSuccess) onSuccess(_user);
        } catch (e) { if (onError) onError(e); }
      }
    });
  }

  function renderGoogleButton(elementId) {
    if (!isConfigured() || typeof google === 'undefined') return false;
    const el = document.getElementById(elementId);
    if (!el) return false;
    google.accounts.id.renderButton(el, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with', logo_alignment: 'left', width: 260 });
    google.accounts.id.prompt();
    return true;
  }

  function loginGuest() {
    _save({ id: 'guest', name: 'Guest', email: '', picture: null, provider: 'guest', isGuest: true });
    return _user;
  }

  function logout() {
    if (_user && _user.provider === 'google' && typeof google !== 'undefined') google.accounts.id.disableAutoSelect();
    _save(null);
  }

  function isLoggedIn()  { return _user !== null; }
  function getUser()     { return _user; }
  function getUserId()   { return _user ? _user.id : 'default'; }
  function storageKey(k) { return getUserId() + '_' + k; }

  _load();
  return { initGoogle, renderGoogleButton, loginGuest, logout, isLoggedIn, getUser, getUserId, storageKey, isConfigured };
})();
