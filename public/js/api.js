/**
 * public/js/api.js
 *
 * Shared token storage and fetch helper used by every page.
 */
const TOKEN_KEY = 'globetrotter_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function requireAuthOrRedirect() {
  if (!getToken()) {
    window.location.href = '/login.html';
  }
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = Object.assign({}, options.headers, {
    'Content-Type': 'application/json',
  });
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(path, Object.assign({}, options, { headers }));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

function logout() {
  clearToken();
  window.location.href = '/discover.html';
}

/**
 * Maps the real destination fields (locally_owned_score, community_verified,
 * est_footprint) to the one photo-overlay badge to show, if any.
 */
function getBadgeInfo(dest) {
  const footprint = String(dest.est_footprint || '').toLowerCase();

  if (footprint === 'high') {
    return { type: 'high-impact', label: 'High Impact' };
  }
  if (dest.community_verified === true) {
    return { type: 'eco', label: 'Community Verified' };
  }
  if (typeof dest.locally_owned_score === 'number' && dest.locally_owned_score >= 0.6) {
    return { type: 'eco', label: 'Locally Owned' };
  }
  if (footprint === 'low') {
    return { type: 'eco', label: 'Low Impact' };
  }
  return null;
}
