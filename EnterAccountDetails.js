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

import React, {useState} from "react";
import {View} from "react-native";
import {Button, IconButton, Menu, TextInput} from "react-native-paper";
import Toast from "react-native-toast-message";
import PropTypes from "prop-types";

export default function EnterAccountDetails({onClose, onAdd, validateSecret}) {
  EnterAccountDetails.propTypes = {
    onClose: PropTypes.func.isRequired,
    onAdd: PropTypes.func.isRequired,
    validateSecret: PropTypes.func.isRequired,
  };

  const [accountName, setAccountName] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [secretError, setSecretError] = useState("");
  const [accountNameError, setAccountNameError] = useState("");

  const [visible, setVisible] = useState(false);
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);
  const [selectedItem, setSelectedItem] = useState("Time based");

  const handleMenuItemPress = (item) => {
    setSelectedItem(item);
    closeMenu();
  };

  const handleAddAccount = () => {
    if (accountName.trim() === "") {
      setAccountNameError("Account Name is required");
      return;
    }

    if (secretKey.trim() === "") {
      setSecretError("Secret Key is required");
      return;
    }

    if (secretError) {
      Toast.show({
        type: "error",
        text1: "Invalid Secret Key",
      });
      return;
    }

    onAdd({accountName, secretKey});
    setAccountName("");
    setSecretKey("");
    setAccountNameError("");
    setSecretError("");
  };

  const handleSecretKeyChange = (text) => {
    setSecretKey(text);
    if (validateSecret) {
      const isValid = validateSecret(text);
      setSecretError(isValid ? "" : "Invalid Secret Key");
    }
  };

  const handleAccountNameChange = (text) => {
    setAccountName(text);
    if (text.trim() !== "") {
      setAccountNameError("");
    }
  };

  return (
    <View style={{padding: 16, backgroundColor: "#f5f5f5", borderRadius: 8}}>
      <IconButton
        icon="close"
        size={24}
        onPress={onClose}
        style={{position: "absolute", top: 8, right: 8}}
      />

      <TextInput
        label="Account Name"
        value={accountName}
        onChangeText={handleAccountNameChange}
        error={!!accountNameError}
        errorText={accountNameError}
        style={{marginBottom: 16}}
      />

      <TextInput
        label="Secret Key"
        value={secretKey}
        onChangeText={handleSecretKeyChange}
        secureTextEntry
        error={!!secretError}
        errorText={secretError}
        style={{marginBottom: 16}}
      />

      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <Button onPress={openMenu} mode="outlined" icon="chevron-down" style={{marginBottom: 16}}>
            {selectedItem}
          </Button>
        }
      >
        <Menu.Item onPress={() => handleMenuItemPress("Time based")} title="Time based" />
        <Menu.Item onPress={() => handleMenuItemPress("Counter based")} title="Counter based" />
      </Menu>

      <Button
        mode="contained"
        onPress={handleAddAccount}
        style={{marginTop: 8}}
      >
        Add Account
      </Button>
    </View>
  );
}
