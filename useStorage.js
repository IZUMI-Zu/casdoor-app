import {create} from "zustand";
import {createJSONStorage, persist} from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

const useStore = create(
  persist(
    (set) => ({
      serverUrl: "",
      clientId: "",
      redirectPath: "",
      userInfo: null,
      token: null,
      setServerUrl: (url) => set({serverUrl: url}),
      setClientId: (id) => set({clientId: id}),
      setRedirectPath: (path) => set({redirectPath: path}),
      setUserInfo: (info) => set({userInfo: info}),
      setToken: (token) => set({token: token}),
      clearAll: () => set({userInfo: null, token: null}),
    }),
    {
      name: "casdoor-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useStore;
