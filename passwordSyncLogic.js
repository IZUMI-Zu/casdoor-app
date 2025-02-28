// Copyright 2024 The Casdoor Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {eq} from "drizzle-orm";
import i18next from "i18next";
import * as schema from "./db/schema";
import * as api from "./api";
import useStore from "./useStorage";

function handleTokenExpiration() {
  const {clearAll} = useStore.getState();
  clearAll();
}

function getLocalPasswords(db) {
  return db.select().from(schema.passwords).all();
}

function getPasswordKey(password) {
  return `${password.application}:${password.username}:${password.signinUrl ?? ""}`;
}

async function updateLocalPasswordDatabase(db, passwords) {
  return db.transaction(async(tx) => {
    for (const password of passwords) {
      if (password.id) {
        if (password.deletedAt === null || password.deletedAt === undefined) {
          // compare all fields
          const pwd = await tx.select().from(schema.passwords).where(eq(schema.passwords.id, password.id)).get();
          if (pwd.application === password.application &&
            pwd.username === password.username &&
            pwd.password === password.password &&
            pwd.signinUrl === password.signinUrl &&
            pwd.deletedAt === password.deletedAt &&
            pwd.origin === password.origin
          ) {
            continue;
          }
          await tx.update(schema.passwords).set({
            application: password.application,
            username: password.username,
            password: password.password,
            signinUrl: password.signinUrl,
            deletedAt: null,
            changedAt: new Date(),
            origin: password.origin,
          }).where(eq(schema.passwords.id, password.id));
        } else {
          await tx.delete(schema.passwords).where(eq(schema.passwords.id, password.id));
        }
      } else {
        await tx.insert(schema.passwords).values({
          application: password.application,
          username: password.username,
          password: password.password,
          signinUrl: password.signinUrl || null,
          origin: password.origin || null,
        });
      }
    }
  });
}

function mergePasswords(localPasswords, serverPasswords, serverUpdatedTime) {
  const mergedPasswords = [...localPasswords];
  const localPasswordMap = new Map();

  // Create a map of local passwords for easy lookup
  localPasswords.forEach(password => {
    const key = getPasswordKey(password);
    localPasswordMap.set(key, password);
  });

  // Process server passwords
  serverPasswords.forEach(serverPassword => {
    const key = getPasswordKey(serverPassword);
    const localPassword = localPasswordMap.get(key);

    if (!localPassword) {
      // Password exists on server but not locally, add it
      mergedPasswords.push({
        ...serverPassword,
        origin: serverPassword.origin || null,
      });
    } else {
      // Password exists both locally and on server
      // Use the most recently updated version
      const localChangedAt = localPassword.changedAt ? new Date(localPassword.changedAt) : new Date(0);
      const serverChangedAt = serverUpdatedTime ? new Date(serverUpdatedTime) : new Date(0);

      if (serverChangedAt > localChangedAt) {
        // Server version is newer
        Object.assign(localPassword, {
          application: serverPassword.application,
          username: serverPassword.username,
          password: serverPassword.password,
          signinUrl: serverPassword.signinUrl,
          origin: serverPassword.origin || localPassword.origin,
        });
      }
    }
  });

  return mergedPasswords;
}

export async function syncPasswordsWithCloud(db, userInfo, serverUrl, token) {
  const localPasswords = await getLocalPasswords(db);

  try {
    await api.validateToken(serverUrl, token);
  } catch (error) {
    handleTokenExpiration();
    throw error;
  }

  const {updatedTime, passwordAccounts: serverPasswords} = await api.getPasswordAccounts(
    serverUrl,
    userInfo.owner,
    userInfo.name,
    token
  );

  const mergedPasswords = mergePasswords(localPasswords, serverPasswords, updatedTime);

  await updateLocalPasswordDatabase(db, mergedPasswords);

  const passwordsToSync = mergedPasswords
    .filter(password => password.deletedAt === null || password.deletedAt === undefined)
    .map(password => {
      const {application, username, password: pwd, signinUrl, origin} = password;
      const passwordToSync = {application, username, password: pwd, signinUrl};
      if (origin !== null) {
        passwordToSync.origin = origin;
      }
      return passwordToSync;
    });

  const serverPasswordsStringified = serverPasswords.map(password => {
    const {application, username, password: pwd, signinUrl, origin} = password;
    const passwordStringified = {application, username, password: pwd, signinUrl};
    if (origin !== null) {
      passwordStringified.origin = origin;
    }
    return JSON.stringify(passwordStringified);
  });

  const passwordsToSyncStringified = passwordsToSync.map(password => JSON.stringify(password));

  if (JSON.stringify(passwordsToSyncStringified.sort()) !== JSON.stringify(serverPasswordsStringified.sort())) {
    const {status} = await api.updatePasswordAccounts(
      serverUrl,
      userInfo.owner,
      userInfo.name,
      passwordsToSync,
      token
    );

    if (status !== "ok") {
      throw new Error(i18next.t("syncLogic.Sync failed"));
    }
  }

  await db.update(schema.passwords).set({syncAt: new Date()}).run();
}
