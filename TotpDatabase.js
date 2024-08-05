import totp from "totp-generator";

export async function migrateDb(db) {
  const DATABASE_VERSION = 1;
  const result = await db.getFirstAsync("PRAGMA user_version");
  let currentVersion = result?.user_version ?? 0;
  if (currentVersion === DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await db.execAsync(`
PRAGMA journal_mode = 'wal';

CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    issuer TEXT,
    account_name TEXT NOT NULL,
    secret TEXT NOT NULL,
    token TEXT,
    is_deleted INTEGER DEFAULT 0,
    last_change_time INTEGER DEFAULT (strftime('%s', 'now')),
    last_sync_time INTEGER DEFAULT NULL
);
`);
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    currentVersion = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

const generateToken = (secretKey) => {
  if (secretKey !== null && secretKey !== undefined && secretKey !== "") {
    try {
      const token = totp(secretKey);
      const tokenWithSpace = token.slice(0, 3) + " " + token.slice(3);
      return tokenWithSpace;
    } catch (error) {
      return "Secret Invalid";
    }
  } else {
    return "Secret Empty";
  }
};

export async function insertAccount(db, account) {
  const token = generateToken(account.secretKey);
  return await db.runAsync(
    "INSERT INTO accounts (issuer, account_name, secret, token, last_change_time) VALUES (?, ?, ?, ?, strftime('%s', 'now'))",
    account.issuer ?? "",
    account.accountName,
    account.secretKey,
    token ?? ""
  );
}

export async function updateAccountName(db, id, accountName) {
  return await db.runAsync("UPDATE accounts SET account_name = ? WHERE id = ?", accountName, id);
}

export async function updateAccount(db, account) {
  return await db.runAsync(
    "UPDATE accounts SET issuer = ?, account_name = ?, secret = ?, last_change_time = strftime('%s', 'now') WHERE id = ?",
    account.issuer,
    account.accountName,
    account.secretKey,
    account.id
  );
}

export async function deleteAccount(db, id) {
  await db.runAsync("UPDATE accounts SET is_deleted = 1, last_change_time = strftime('%s', 'now') WHERE id = ?", id);
}

export async function trueDeleteAccount(db, id) {
  return await db.runAsync("DELETE FROM accounts WHERE id = ?", id);
}

export function updateToken(db, id) {
  const result = db.getFirstSync("SELECT secret FROM accounts WHERE id = ?", id);
  if (result.secret === null) {
    return;
  }
  const token = generateToken(result.secret);
  return db.runSync("UPDATE accounts SET token = ? WHERE id = ?", token, id);
}

export async function getAllAccounts(db) {
  const accounts = await db.getAllAsync("SELECT * FROM accounts WHERE is_deleted = 0");
  return accounts.map(account => {
    return {
      ...account,
      accountName: account.account_name,
    };
  });
}

export async function getAccountsForSync(db) {
  const accounts = await db.getAllAsync("SELECT account_name, issuer, secret FROM accounts WHERE is_deleted = 0");
  return accounts.map(account => {
    return {
      ...account,
      accountName: account.account_name,
    };
  });
}

export function calculateCountdown() {
  const now = Math.floor(Date.now() / 1000);
  return 30 - (now % 30);
}
