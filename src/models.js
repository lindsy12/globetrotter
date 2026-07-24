/**
 * src/models.js
 *
 * Data models and file I/O helpers.
 *
 * All persistent data is stored in JSON files under /src/data:
 *   - users.json         – registered users
 *   - itineraries.json   – user itineraries
 *   - destinations.json  – static destination catalogue (seed data)
 *
 * This is the direct equivalent of the lecturer's app/models.py.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ITINERARIES_FILE = path.join(DATA_DIR, 'itineraries.json');
const DESTINATIONS_FILE = path.join(DATA_DIR, 'destinations.json');

// ---------------------------------------------------------------------------
// Generic file I/O helpers
// ---------------------------------------------------------------------------

/**
 * Read a JSON file and return its contents as an array.
 * Returns an empty array if the file doesn't exist or is empty —
 * mirrors his _read_json() exactly, including the "missing file is fine" behavior.
 */
function readJson(filepath) {
  if (!fs.existsSync(filepath)) {
    return [];
  }
  const content = fs.readFileSync(filepath, 'utf-8').trim();
  if (!content) {
    return [];
  }
  return JSON.parse(content);
}

/**
 * Write data to a JSON file, pretty-printed.
 * Creates the parent directory if it doesn't exist yet — mirrors his
 * os.makedirs(..., exist_ok=True) call.
 */
function writeJson(filepath, data) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// User helpers
// ---------------------------------------------------------------------------

function getAllUsers() {
  return readJson(USERS_FILE);
}

function getUserByUsername(username) {
  const users = getAllUsers();
  return users.find((u) => u.username === username) || null;
}

function saveUser(user) {
  const users = getAllUsers();
  users.push(user);
  writeJson(USERS_FILE, users);
}

// ---------------------------------------------------------------------------
// Destination helpers
// ---------------------------------------------------------------------------

function getAllDestinations() {
  return readJson(DESTINATIONS_FILE);
}

// ---------------------------------------------------------------------------
// Itinerary helpers
// ---------------------------------------------------------------------------

function getAllItineraries() {
  return readJson(ITINERARIES_FILE);
}

function getItinerariesForUser(username) {
  return getAllItineraries().filter((it) => it.username === username);
}

function saveItinerary(itinerary) {
  const itineraries = getAllItineraries();
  itineraries.push(itinerary);
  writeJson(ITINERARIES_FILE, itineraries);
}

module.exports = {
  getAllUsers,
  getUserByUsername,
  saveUser,
  getAllDestinations,
  getAllItineraries,
  getItinerariesForUser,
  saveItinerary,
};
