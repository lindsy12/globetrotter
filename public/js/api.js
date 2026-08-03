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
 * Reads the username out of the current JWT's payload (the "sub" claim
 * already set by src/auth.js) without a network round-trip or any new
 * stored data — just decoding the token we already have.
 */
function getUsernameFromToken() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.sub || null;
  } catch (err) {
    return null;
  }
}

/** Fills a topnav avatar element with the logged-in user's first initial. */
function renderAvatarInitial(el) {
  const username = getUsernameFromToken();
  el.textContent = username ? username.charAt(0).toUpperCase() : '?';
}

/**
 * Returns the photo-overlay tags for a destination. Unlike the old
 * single-badge system, these don't compete for one slot — a destination
 * can have zero, one, or both.
 */
function getDestinationTags(dest) {
  const tags = [];
  if (dest.community_verified === true) {
    tags.push({ type: 'verified', label: 'Verified' });
  }
  if (typeof dest.popularity === 'number' && dest.popularity > 70) {
    tags.push({ type: 'popular', label: 'Popular' });
  }
  return tags;
}

/**
 * Builds a destination card element (photo panel + body panel), wired up
 * with an "Add to Trip" button. Shared by index.html and destinations.html
 * so this markup and its click handler only exist in one place.
 */
function createDestinationCard(dest) {
  const card = document.createElement('div');
  card.className = 'destination-card';

  const badgeHtml = getDestinationTags(dest)
    .map((tag) => `<span class="badge ${tag.type}">${tag.label}</span>`)
    .join('');

  const location = dest.neighborhood || dest.country || dest.continent || '';
  const hasCoords = typeof dest.latitude === 'number' && typeof dest.longitude === 'number';
  const hasImage = typeof dest.image === 'string' && dest.image.trim() !== '';

  card.innerHTML = `
    <div class="destination-card-photo">
      ${hasImage ? `<img class="destination-card-img" src="${dest.image}" alt="${dest.name || ''}">` : ''}
      ${badgeHtml}
    </div>
    <div class="destination-card-body">
      <div class="name">${dest.name || ''}</div>
      <div class="location-row">
        <span class="country">${location}</span>
        ${hasCoords ? '<button type="button" class="pin-btn" aria-label="View on map">📍</button>' : ''}
      </div>
      <button type="button" class="add-to-trip-btn">+ Add to Trip</button>
    </div>
  `;

  card.addEventListener('click', () => {
    window.location.href = `/destination.html?id=${encodeURIComponent(dest.id || '')}`;
  });

  const pinBtn = card.querySelector('.pin-btn');
  if (pinBtn) {
    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openMapModal(dest.latitude, dest.longitude);
    });
  }

  card.querySelector('.add-to-trip-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.href = `/new-itinerary.html?destination=${encodeURIComponent(dest.name || '')}`;
  });

  return card;
}

function openGoogleMaps(lat, lng) {
  window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank', 'noopener');
}

function handleMapModalEscape(e) {
  if (e.key === 'Escape') closeMapModal();
}

function closeMapModal() {
  const existing = document.getElementById('map-modal-overlay');
  if (existing) existing.remove();
  document.removeEventListener('keydown', handleMapModalEscape);
}

/**
 * Shows a small in-page overlay with an embedded Google Maps iframe for the
 * given coordinates, using the no-API-key "output=embed" endpoint. Built
 * dynamically so any page can call it just by loading api.js.
 */
function openMapModal(lat, lng) {
  closeMapModal();

  const overlay = document.createElement('div');
  overlay.className = 'map-modal-overlay';
  overlay.id = 'map-modal-overlay';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeMapModal();
  });

  const modal = document.createElement('div');
  modal.className = 'map-modal';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'map-modal-close';
  closeBtn.setAttribute('aria-label', 'Close map');
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', closeMapModal);

  const iframe = document.createElement('iframe');
  iframe.className = 'map-modal-iframe';
  iframe.src = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  iframe.loading = 'lazy';
  iframe.title = 'Map';

  modal.appendChild(closeBtn);
  modal.appendChild(iframe);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.addEventListener('keydown', handleMapModalEscape);
}
