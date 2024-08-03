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

import React, {useContext, useState} from "react";
import {Alert, ScrollView, Text, View} from "react-native";
import {Button, IconButton, Portal, TextInput} from "react-native-paper";
import DefaultCasdoorSdkConfig from "./DefaultCasdoorSdkConfig";
import CasdoorServerContext from "./CasdoorServerContext";
import PropTypes from "prop-types";

const EnterCasdoorSdkConfig = ({onClose, onWebviewClose}) => {
  EnterCasdoorSdkConfig.propTypes = {
    onClose: PropTypes.func.isRequired,
    onWebviewClose: PropTypes.func.isRequired,
  };

  const {setCasdoorServer} = useContext(CasdoorServerContext);
  const [CasdoorSdkConfig, setCasdoorSdkConfig] = useState({
    serverUrl: "",
    clientId: "",
    appName: "",
    organizationName: "",
    redirectPath: "http://casdoor-app",
    signinPath: "/api/signin",
  });

  const handleInputChange = (key, value) => {
    setCasdoorSdkConfig({...CasdoorSdkConfig, [key]: value});
  };

  const closeConfigPage = () => {
    onClose();
    onWebviewClose();
  };

  const handleSave = () => {
    if (
      !CasdoorSdkConfig.serverUrl ||
      !CasdoorSdkConfig.clientId ||
      !CasdoorSdkConfig.redirectPath
    ) {
      Alert.alert("Please fill in all the fields!");
      return;
    }
    setCasdoorServer(CasdoorSdkConfig);
    onClose();
  };

  const handleUseDefault = () => {
    setCasdoorServer(DefaultCasdoorSdkConfig);
    onClose();
  };

  const handleScanToLogin = () => {
    Alert.alert("Scan to Login functionality not implemented yet.");
  };

  return (
    <Portal>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Casdoor server</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={closeConfigPage}
              style={styles.closeButton}
            />
          </View>
          <TextInput
            label="Endpoint"
            value={CasdoorSdkConfig.serverUrl}
            onChangeText={(text) => handleInputChange("serverUrl", text)}
            autoCapitalize="none"
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Client ID"
            value={CasdoorSdkConfig.clientId}
            onChangeText={(text) => handleInputChange("clientId", text)}
            autoCapitalize="none"
            style={styles.input}
            mode="outlined"
          />
          <View style={styles.buttonRow}>
            <Button
              mode="contained"
              onPress={handleSave}
              style={[styles.button, styles.confirmButton]}
              labelStyle={styles.buttonLabel}
            >
                Confirm
            </Button>
            <Button
              mode="contained"
              onPress={handleScanToLogin}
              style={[styles.button, styles.scanButton]}
              labelStyle={styles.buttonLabel}
            >
                Scan to Login
            </Button>
          </View>
          <Button
            mode="outlined"
            onPress={handleUseDefault}
            style={[styles.button, styles.outlinedButton]}
            labelStyle={styles.outlinedButtonLabel}
          >
              Use Casdoor Demo Site
          </Button>
        </View>
      </ScrollView>
    </Portal>
  );
};

const styles = {
  scrollContainer: {
    flexGrow: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  content: {
    width: "95%",
    borderRadius: 10,
    padding: 20,
    backgroundColor: "#F5F5F5",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  input: {
    marginVertical: 10,
    fontSize: 16,
    backgroundColor: "white",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    borderRadius: 5,
    marginHorizontal: 5,
    paddingVertical: 5,
  },
  confirmButton: {
    backgroundColor: "#6200EE",
  },
  scanButton: {
    backgroundColor: "#03DAC6",
  },
  buttonLabel: {
    fontSize: 14,
    color: "white",
  },
  outlinedButton: {
    borderColor: "#6200EE",
    borderWidth: 1,
    marginTop: 20,
    paddingVertical: 10,
  },
  outlinedButtonLabel: {
    color: "#6200EE",
    fontSize: 16,
    textAlign: "center",
  },
  header: {
    position: "relative",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    right: 0,
    top: -8,
  },
};

export default EnterCasdoorSdkConfig;
