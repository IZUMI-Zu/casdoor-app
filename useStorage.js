import {create} from "zustand";
import {createJSONStorage, persist} from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

const asyncStoragePersistConfig = {
  setItem: async(key, value) => await AsyncStorage.setItem(key, value),
  getItem: async(key) => await AsyncStorage.getItem(key),
  removeItem: async(key) => await AsyncStorage.removeItem(key),
};

const useStore = create(
  persist(
    (set) => ({
      serverUrl: "",
      clientId: "",
      redirectPath: "",
      appName: "",
      organizationName: "",
      userInfo: null,
      token: null,
      setServerUrl: (url) => set({serverUrl: url}),
      setClientId: (id) => set({clientId: id}),
      setRedirectPath: (path) => set({redirectPath: path}),
      setAppName: (name) => set({appName: name}),
      setOrganizationName: (name) => set({organizationName: name}),
      setUserInfo: (info) => set({userInfo: info}),
      setToken: (token) => set({token: token}),
      clearAll: () => set({userInfo: null, token: null}),
    }),
    {
      name: "casdoor-storage",
      storage: createJSONStorage(() => asyncStoragePersistConfig),
    }
  )
);

export default useStore;
