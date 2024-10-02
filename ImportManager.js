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

import {useActionSheet} from "@expo/react-native-action-sheet";
import * as ImagePicker from "expo-image-picker";
import {scanFromURLAsync} from "expo-camera";

import useProtobufDecoder from "./useProtobufDecoder";

import {importFromMSAuth} from "./MSAuthImportLogic";

export const importFromGoogleAuthenticator = async(decoder) => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const scannedData = await scanFromURLAsync(result.assets[0].uri, ["qr", "pdf417"]);
      if (scannedData[0]) {
        const fileContent = decoder.decodeExportUri(scannedData[0].data);
        return fileContent.map(({accountName, issuer, totpSecret}) => ({accountName, issuer, secretKey: totpSecret}));
      }
    }
  } catch (error) {
    throw new Error(error);
  }
};

export const importFromAuthy = () => {
};

const importApps = [
  {name: "Authy", importFunction: importFromAuthy},
  {name: "Google Authenticator", importFunction: importFromGoogleAuthenticator},
  {name: "Microsoft Authenticator", importFunction: importFromMSAuth},
];

export const useImportManager = (onImportComplete, onError) => {
  const decoder = useProtobufDecoder(require("./google/google_auth.proto"));
  const {showActionSheetWithOptions} = useActionSheet();

  const showImportOptions = () => {
    const options = [...importApps.map(app => app.name), "Cancel"];
    const cancelButtonIndex = options.length - 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        title: "Select app to import from",
      },
      async(selectedIndex) => {
        if (selectedIndex !== cancelButtonIndex) {
          const selectedApp = importApps[selectedIndex];
          try {
            if (selectedApp.name === "Google Authenticator") {
              const fileContent = await selectedApp.importFunction(decoder);
              onImportComplete(fileContent);
            } else {
              const fileContent = await selectedApp.importFunction();
              onImportComplete(fileContent);
            }
          } catch (error) {
            onError(error);
          }
        }
      }
    );
  };

  return {showImportOptions};
};
