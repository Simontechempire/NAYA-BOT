const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../database');

const FILES = {
  data: path.join(DATA_DIR, 'data.json'),
  users: path.join(DATA_DIR, 'users.json')
};

function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  for (const file of Object.values(FILES)) {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, '{}', 'utf8');
    }
  }
}

function read(name) {
  ensureDatabase();

  const file = FILES[name];
  if (!file) throw new Error(`Unknown database: ${name}`);

  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    console.error(`Database read error (${name}):`, error.message);
    return {};
  }
}

function write(name, data) {
  ensureDatabase();

  const file = FILES[name];
  if (!file) throw new Error(`Unknown database: ${name}`);

  const tempFile = `${file}.tmp`;

  fs.writeFileSync(
    tempFile,
    JSON.stringify(data, null, 2),
    'utf8'
  );

  fs.renameSync(tempFile, file);
  return true;
}

function getData() {
  return read('data');
}

function saveData(data) {
  return write('data', data);
}

function getUsers() {
  return read('users');
}

function saveUsers(users) {
  return write('users', users);
}

ensureDatabase();

module.exports = {
  read,
  write,
  getData,
  saveData,
  getUsers,
  saveUsers,
  ensureDatabase
};
