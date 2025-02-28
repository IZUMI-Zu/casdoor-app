import {and, eq, isNull} from "drizzle-orm";
import {useLiveQuery} from "drizzle-orm/expo-sqlite";
import {create} from "zustand";
import {db} from "./db/client";
import * as schema from "./db/schema";
import {syncPasswordsWithCloud} from "./passwordSyncLogic";

export const usePasswords = () => {
  const {data: passwords} = useLiveQuery(
    db.select().from(schema.passwords).where(isNull(schema.passwords.deletedAt))
  );

  return {
    passwords: passwords || [],
  };
};

const usePasswordStore = create((set, get) => ({
  isInitialized: false,
  currentPassword: {
    id: undefined,
    application: undefined,
    username: undefined,
    password: undefined,
    sign: undefined,
  },

  setCurrentPassword: (password) => {
    set({currentPassword: password});
  },

  addPassword: async(passwordData) => {
    try {
      await db.insert(schema.passwords).values({
        application: passwordData.application,
        username: passwordData.username,
        password: passwordData.password,
        signinUrl: passwordData.signinUrl || null,
      });

      return true;
    } catch (error) {
      return false;
    }
  },

  updatePassword: async(id, passwordData) => {
    try {
      const updateData = {};
      if (passwordData.application) {
        updateData.application = passwordData.application;
      }
      if (passwordData.username) {
        updateData.username = passwordData.username;
      }
      if (passwordData.password) {
        updateData.password = passwordData.password;
      }
      if (passwordData.signinUrl !== undefined) {
        updateData.signinUrl = passwordData.signinUrl;
      }
      await db.update(schema.passwords)
        .set({...updateData, changedAt: new Date()})
        .where(eq(schema.passwords.id, id));

      return true;
    } catch (error) {
      return false;
    }
  },

  deletePassword: async(id) => {
    try {
      await db.update(schema.passwords)
        .set({deletedAt: new Date()})
        .where(eq(schema.passwords.id, id));
      return true;
    } catch (error) {
      return false;
    }
  },

  getPassword: async(id) => {
    try {
      const password = await db.select()
        .from(schema.passwords)
        .where(
          and(
            eq(schema.passwords.id, id),
            isNull(schema.passwords.deletedAt)
          )
        )
        .get();

      if (!password) {
        return null;
      }

      return password;
    } catch (error) {
      return null;
    }
  },
}));

const usePasswordSyncStore = create((set, get) => ({
  isSyncing: false,
  syncError: null,
  startSync: async(userInfo, serverUrl, token) => {
    if (get().isSyncing) {return;}

    set({isSyncing: true, syncError: null});
    try {
      await syncPasswordsWithCloud(db, userInfo, serverUrl, token);
    } catch (error) {
      set({syncError: error.message});
    } finally {
      set({isSyncing: false});
    }
    return get().syncError;
  },
  clearSyncError: () => set({syncError: null}),
}));

export const usePasswordSync = () => usePasswordSyncStore(state => ({
  isSyncing: state.isSyncing,
  syncError: state.syncError,
  startSync: state.startSync,
  clearSyncError: state.clearSyncError,
}));

export default usePasswordStore;
