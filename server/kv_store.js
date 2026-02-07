const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "db.json");

let store = {};

// Load DB
try {
  if (fs.existsSync(DB_FILE)) {
    store = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  }
} catch (e) {
  console.error("Failed to load DB", e);
}

function save() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
  } catch (e) {
    console.error("Failed to save DB", e);
  }
}

exports.set = async (key, value) => {
  store[key] = value;
  save();
};

exports.get = async (key) => {
  return store[key];
};

exports.del = async (key) => {
  delete store[key];
  save();
};

exports.getByPrefix = async (prefix) => {
  return Object.keys(store)
    .filter((k) => k.startsWith(prefix))
    .map((k) => store[k]);
};

exports.mset = async (keys, values) => {
  keys.forEach((k, i) => (store[k] = values[i]));
  save();
};

exports.mget = async (keys) => {
  return keys.map((k) => store[k]);
};

exports.mdel = async (keys) => {
  keys.forEach((k) => delete store[k]);
  save();
};
