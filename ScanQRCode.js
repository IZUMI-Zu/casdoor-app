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
import {SafeAreaView, Text} from "react-native";
import {IconButton, Portal} from "react-native-paper";
import {Camera, CameraView} from "expo-camera";
import PropTypes from "prop-types";

const ScanQRCode = ({onClose, showScanner, onAdd}) => {
  ScanQRCode.propTypes = {
    onClose: PropTypes.func.isRequired,
    onAdd: PropTypes.func.isRequired,
    showScanner: PropTypes.bool.isRequired,
  };

  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    const getCameraPermissions = async() => {
      const {status} = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

  const closeOptions = () => {
    onClose();
  };

  const handleBarCodeScanned = ({type, data}) => {
    // type org.iso.QRCode
    // data otpauth://totp/casdoor:built-in/admin?algorithm=SHA1&digits=6&issuer=casdoor&period=30&secret=DL5XI33M772GSGU73GJPCOIBNJE7TG3J
    // console.log(`Bar code with type ${type} and data ${data} has been scanned!`);
    const accountName = data.match(/otpauth:\/\/totp\/([^?]+)/); // accountName casdoor:built-in/admin
    const secretKey = data.match(/secret=([^&]+)/); // secretKey II5UO7HIA3SPVXAB6KPAIXZ33AQP7C3R
    const issuer = data.match(/issuer=([^&]+)/);
    if (accountName && secretKey) {
      onAdd({accountName: accountName[1], issuer: issuer[1], secretKey: secretKey[1]});
    }

    closeOptions();
  };

  return (
    <SafeAreaView style={{flex: 1}} >
      <Portal>
        {hasPermission === null ? (
          <Text style={{marginLeft: "20%", marginRight: "20%"}}>Requesting for camera permission</Text>
        ) : hasPermission === false ? (
          <Text style={{marginLeft: "20%", marginRight: "20%"}}>No access to camera</Text>
        ) : (
          <CameraView
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "pdf417"],
            }}
            style={{flex: 1}}
          />
        )}
        <IconButton icon={"close"} size={40} onPress={onClose} style={{position: "absolute", top: 30, right: 5}} />
      </Portal>
    </SafeAreaView>
  );
};

export default ScanQRCode;
