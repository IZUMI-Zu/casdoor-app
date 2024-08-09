// Copyright 2023 The Casdoor Authors. All Rights Reserved.
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

import React, {useEffect, useState} from "react";
import {WebView} from "react-native-webview";
import Toast from "react-native-toast-message";
import {Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity} from "react-native";
import {Portal} from "react-native-paper";
import SDK from "casdoor-react-native-sdk";
import PropTypes from "prop-types";

import useStore from "./useStorage";
import EnterCasdoorSdkConfig from "./EnterCasdoorSdkConfig";

let sdk = null;
const CasdoorLoginPage = ({onWebviewClose}) => {
  CasdoorLoginPage.propTypes = {
    onWebviewClose: PropTypes.func.isRequired,
  };

  const [casdoorLoginURL, setCasdoorLoginURL] = useState("");
  const [showConfigPage, setShowConfigPage] = useState(true);

  const {
    serverUrl,
    clientId,
    redirectPath,
    appName,
    organizationName,
    setUserInfo,
    setToken,
  } = useStore();

  useEffect(() => {
    if (serverUrl && clientId && redirectPath && appName && organizationName) {
      sdk = new SDK({serverUrl, clientId, redirectPath, appName, organizationName});
      getCasdoorSignInUrl();
    }
  }, [serverUrl, clientId, redirectPath, appName, organizationName]);

  const handleHideConfigPage = () => {
    setShowConfigPage(false);
  };

  const handleShowConfigPage = () => {
    setShowConfigPage(true);
  };

  const getCasdoorSignInUrl = async() => {
    const signinUrl = await sdk.getSigninUrl();
    setCasdoorLoginURL(signinUrl);
  };

  const onNavigationStateChange = async(navState) => {
    if (navState.url.startsWith(redirectPath)) {
      onWebviewClose();
      const token = await sdk.getAccessToken(navState.url);
      const userInfo = sdk.JwtDecode(token);
      setToken(token);
      setUserInfo(userInfo);
    }
  };

  const handleErrorResponse = (error) => {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: error.description,
      autoHide: true,
    });
    setShowConfigPage(true);
  };

  return (
    <Portal>
      <SafeAreaView style={styles.container}>
        {showConfigPage && (
          <EnterCasdoorSdkConfig
            onClose={handleHideConfigPage}
            onWebviewClose={onWebviewClose}
          />
        )}
        {!showConfigPage && casdoorLoginURL !== "" && (
          <>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleShowConfigPage}
            >
              <Text style={styles.backButtonText}>Back to Config</Text>
            </TouchableOpacity>
            <WebView
              source={{uri: casdoorLoginURL}}
              onNavigationStateChange={onNavigationStateChange}
              onError={(syntheticEvent) => {
                const {nativeEvent} = syntheticEvent;
                handleErrorResponse(nativeEvent);
              }}
              style={styles.webview}
              mixedContentMode="always"
              javaScriptEnabled={true}
            />
          </>
        )}
      </SafeAreaView >
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
  },
  backButton: {
    padding: 10,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  backButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export const CasdoorLogout = () => {
  const {clearAll} = useStore();
  clearAll();
  sdk.clearState();
};

export default CasdoorLoginPage;
