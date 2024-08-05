import {create} from "zustand";
import {drizzle, useLiveQuery} from "drizzle-orm/expo-sqlite";
import {eq, sql} from "drizzle-orm";
import {openDatabaseSync} from "expo-sqlite/next";
import totp from "totp-generator";
import * as schema from "./schema";
import * as api from "./api";

const expo = openDatabaseSync("totp.db", {enableChangeListener: true});
const db = drizzle(expo);

const generateToken = (secretKey) => {
  if (secretKey !== null && secretKey !== undefined && secretKey !== "") {
    const token = totp(this.secretKey);
    const tokenWithSpace = token.slice(0, 3) + " " + token.slice(3);
    return tokenWithSpace;
  }
};

const applySync = (serverAccountList, updatedTime, localAccountList) => {
  if (!serverAccountList) {return localAccountList;}

  const mergedAccounts = [];
  const serverMap = new Map(serverAccountList.map(account => [`${account.issuer}:${account.accountName}`, account]));
  const localMap = new Map(localAccountList.map(account => [`${account.issuer}:${account.accountName}`, account]));

  const isNewer = (date1, date2) => new Date(date1) > new Date(date2);

  // Process all local accounts
  for (const [key, localAccount] of localMap) {
    const serverAccount = serverMap.get(key);

    if (!serverAccount) {
      // Local new or local not deleted
      if (!localAccount.is_deleted) {
        mergedAccounts.push(localAccount);
      }
    } else {
      // Both local and server have the account
      if (localAccount.is_deleted) {
        // Local deleted
        if (isNewer(localAccount.last_change_time, updatedTime)) {
          // Local delete is newer, keep it deleted
          continue;
        } else {
          // Server change is newer, keep the server version
          mergedAccounts.push(serverAccount);
        }
      } else {
        // Compare changes
        if (isNewer(localAccount.last_change_time, updatedTime)) {
          // Local change is newer
          mergedAccounts.push(localAccount);
        } else {
          // Server change is newer
          mergedAccounts.push(serverAccount);
        }
      }
    }

    // Remove processed account from serverMap
    serverMap.delete(key);
  }

  // Add remaining server accounts (new on server or not in local)
  for (const serverAccount of serverMap.values()) {
    mergedAccounts.push(serverAccount);
  }

  return mergedAccounts;
};

const useTotpStore = create((set, get) => ({
  isLoading: false,
  error: null,

  setLoading: (isLoading) => set({isLoading}),
  setError: (error) => set({error}),

  useAccounts: () => {
    useLiveQuery(db.select().from(schema.accountTable).where(sql`is_deleted = false`));
  },

  createAccount: async({secret, accountName, issuer}) => {
    const {setLoading, setError} = get();
    setLoading(true);
    try {
      await db.insert(schema.accountTable).values({
        issuer,
        account_name: accountName,
        secret,
        token: generateToken(secret),
        last_change_time: new Date(),
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  },

  deleteAccount: async(id) => {
    const {setLoading, setError} = get();
    setLoading(true);
    try {
      await db.update(schema.accountTable)
        .set({is_deleted: true, last_change_time: new Date()})
        .where(eq(schema.accountTable.id, id));
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  },

  updateAccount: async(id, {newSecret, newAccountName, newIssuer}) => {
    const {setLoading, setError} = get();
    setLoading(true);
    try {
      await db.update(schema.accountTable)
        .set({
          secret: newSecret,
          account_name: newAccountName,
          issuer: newIssuer,
          last_change_time: new Date(),
        }).where(eq(schema.accountTable.id, id));
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  },

  updateToken: async(id) => {
    const {setError} = get();
    try {
      await db.update(schema.accountTable)
        .set({token: generateToken(schema.accountTable.secret)})
        .where(eq(schema.accountTable.id, id));
    } catch (error) {
      setError(error.message);
    }
  },

  calculateCountdown: () => {
    const currentTime = Math.floor(Date.now() / 1000);
    return 30 - (currentTime % 30);
  },

  getAccountsForSync: async() => {
    try {
      return await db.select({
        accountName: schema.accountTable.account_name,
        issuer: schema.accountTable.issuer,
        secretKey: schema.accountTable.secret,
      })
        .from(schema.accountTable)
        .where(sql`last_change_time > last_sync_time OR last_sync_time IS NULL`);
    } catch (error) {
      return [];
    }
  },

  updateLastSyncTime: async() => {
    const {setError} = get();
    const currentTime = new Date();
    try {
      await db.update(schema.accountTable)
        .set({last_sync_time: currentTime})
        .where(sql`last_change_time <= ${currentTime}`);
    } catch (error) {
      setError(error.message);
    }
  },

  applyServerChanges: async(serverAccountList) => {
    for (const account of serverAccountList) {
      const existingAccount = await db.select()
        .from(schema.accountTable)
        .where(sql`account_name = ${account.accountName} AND issuer = ${account.issuer}`)
        .limit(1);

      if (existingAccount.length === 0) {
        // New account from server, insert it
        await db.insert(schema.accountTable).values({
          account_name: account.accountName,
          issuer: account.issuer,
          secret: account.secretKey,
          last_sync_time: new Date(),
        });
      } else {
        // Update existing account
        await db.update(schema.accountTable)
          .set({
            secret: account.secretKey,
            is_deleted: false,
            last_sync_time: new Date(),
          })
          .where(sql`account_name = ${account.accountName} AND issuer = ${account.issuer}`);
      }
    }
  },

  syncWithCloud: async(userInfo, casdoorServer, token) => {
    const {setLoading, setError, getAccountsForSync, updateLastSyncTime, applyServerChanges, isLoading} = get();
    if (!isLoading) {
      return;
    }
    setLoading(true);
    try {
      const accountsToSync = await getAccountsForSync();
      const {updatedTime, mfaAccounts: serverAccountList} = await api.getMfaAccounts(
        casdoorServer.serverUrl,
        userInfo.owner,
        userInfo.name,
        token
      );

      const updatedServerAccountList = applySync(serverAccountList ?? [], updatedTime, accountsToSync);

      const {status} = await api.updateMfaAccounts(
        casdoorServer.serverUrl,
        userInfo.owner,
        userInfo.name,
        updatedServerAccountList.map(account => ({
          accountName: account.accountName,
          issuer: account.issuer,
          secretKey: account.secretKey,
        })),
        token
      );

      await applyServerChanges(updatedServerAccountList);

      if (status) {
        await updateLastSyncTime();
      } else {
        throw new Error("Sync failed");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  },
}));

export default useTotpStore;
