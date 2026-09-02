const fs = require('fs');
const path = require('path');

// On Railway, set DATA_DIR to your mounted volume's path (e.g. /data) so this
// file survives redeploys. Locally, it just defaults to this folder.
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DATA_FILE = path.join(DATA_DIR, 'data.json');

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return { creators: {} };
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed to read data.json, starting fresh:', err);
    return { creators: {} };
  }
}

function saveData(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getCreator(key) {
  const data = loadData();
  return data.creators[key];
}

// Shallow-merges `patch` into the existing creator record (creating it if needed).
function upsertCreator(key, patch) {
  const data = loadData();
  data.creators[key] = { ...(data.creators[key] || {}), ...patch, key };
  saveData(data);
  return data.creators[key];
}

function deleteCreator(key) {
  const data = loadData();
  delete data.creators[key];
  saveData(data);
}

module.exports = { getCreator, upsertCreator, deleteCreator, loadData, saveData };
