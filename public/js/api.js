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
 * Builds a destination card element, wired up with its own map-pin and
 * three-dot-menu click handlers. Shared by index.html and destinations.html
 * so those event handlers only exist in one place.
 */
function createDestinationCard(dest) {
  const card = document.createElement('div');
  card.className = 'destination-card';

  const badgeHtml = getDestinationTags(dest)
    .map((tag) => `<span class="badge ${tag.type}">${tag.label}</span>`)
    .join('');

  const location = dest.neighborhood || dest.country || dest.continent || '';
  const hasCoords = typeof dest.latitude === 'number' && typeof dest.longitude === 'number';

  card.innerHTML = `
    ${badgeHtml}
    <div class="overlay">
      <div class="overlay-main">
        <div class="name">${dest.name || ''}</div>
        <div class="location-row">
          <span class="country">${location}</span>
          ${hasCoords ? '<button type="button" class="pin-btn" aria-label="View on map">📍</button>' : ''}
        </div>
      </div>
      <div class="menu-wrap">
        <button type="button" class="dots-btn" aria-label="More options">⋮</button>
        <div class="dots-menu hidden">
          <button type="button" class="dots-menu-item">Add to itinerary</button>
        </div>
      </div>
    </div>
  `;

  const pinBtn = card.querySelector('.pin-btn');
  if (pinBtn) {
    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openGoogleMaps(dest.latitude, dest.longitude);
    });
  }

  const dotsBtn = card.querySelector('.dots-btn');
  const dotsMenu = card.querySelector('.dots-menu');
  dotsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.dots-menu').forEach((menu) => {
      if (menu !== dotsMenu) menu.classList.add('hidden');
    });
    dotsMenu.classList.toggle('hidden');
  });

  card.querySelector('.dots-menu-item').addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.href = `/new-itinerary.html?destination=${encodeURIComponent(dest.name || '')}`;
  });

  return card;
}

document.addEventListener('click', () => {
  document.querySelectorAll('.dots-menu').forEach((menu) => menu.classList.add('hidden'));
});

function openGoogleMaps(lat, lng) {
  window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank', 'noopener');
}
