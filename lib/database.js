
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../database');

const FILES = {
  data: path.join(DATA_DIR, 'data.json'),
  users: path.join(DATA_DIR, 'users.json')
};

const defaults = {
  data: {
    users: {},
    sessions: {},
    settings: {
      mode: 'public',
      prefix: '.'
    },
    banned: [],
    warnings: {},
    createdAt: Date.now()
  },
  users: {
    telegram: {},
    whatsapp: {},
    pairingRequests: {},
    linkedAccounts: {}
  }
};

function ensureDatabase() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  for (const [name, file] of Object.entries(FILES)) {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(
        file,
        JSON.stringify(defaults[name], null, 2),
        'utf8'
      );
    }
  }
}

function read(name) {
  ensureDatabase();

  const file = FILES[name];

  if (!file) {
    throw new Error(`Unknown database: ${name}`);
  }

  try {
    const parsed = JSON.parse(
      fs.readFileSync(file, 'utf8')
    );

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      throw new Error('Invalid database structure.');
    }

    return {
      ...defaults[name],
      ...parsed
    };

  } catch (error) {
    console.error(
      `[DATABASE] ${name}.json read failed:`,
      error.message
    );

    // Preserve the damaged file for recovery.
    throw new Error(
      `${name}.json is corrupted. Restore a valid backup before starting.`
    );
  }
}

function write(name, data) {
  ensureDatabase();

  const file = FILES[name];

  if (!file) {
    throw new Error(`Unknown database: ${name}`);
  }

  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data)
  ) {
    throw new Error('Database data must be an object.');
  }

  const tempFile = `${file}.${process.pid}.tmp`;

  try {
    fs.writeFileSync(
      tempFile,
      JSON.stringify(data, null, 2),
      'utf8'
    );

    fs.renameSync(tempFile, file);
    return true;

  } catch (error) {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }

    throw error;
  }
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
