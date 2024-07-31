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

import * as React from "react";
import {Platform, StyleSheet, View} from "react-native";
import {Appbar, Avatar, Menu, Text, TouchableRipple} from "react-native-paper";
import UserContext from "./UserContext";
import CasdoorLoginPage, {CasdoorLogout} from "./CasdoorLoginPage";

const Header = () => {
  const {userInfo, setUserInfo, setToken} = React.useContext(UserContext);
  const [showLoginPage, setShowLoginPage] = React.useState(false);
  const [menuVisible, setMenuVisible] = React.useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleMenuLogoutClicked = () => {
    handleCasdoorLogout();
    closeMenu();
  };

  const handleCasdoorLogin = () => {
    setShowLoginPage(true);
  };

  const handleCasdoorLogout = () => {
    CasdoorLogout();
    setUserInfo(null);
    setToken(null);
  };

  const handleHideLoginPage = () => {
    setShowLoginPage(false);
  };

  return (
    <View>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="Casdoor" style={styles.title} />
        <View style={styles.buttonWrapper}>
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            style={styles.menu}
            contentStyle={styles.menuContent}
            anchor={
              <TouchableRipple
                onPress={userInfo === null ? handleCasdoorLogin : openMenu}
                style={styles.buttonContainer}
                borderless={true}
                borderRadius={20}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>
                    {userInfo === null ? "Login" : userInfo.name}
                  </Text>
                  {userInfo !== null && (
                    <Avatar.Image
                      size={24}
                      source={{uri: userInfo.avatar}}
                      style={styles.avatar}
                    />
                  )}
                </View>
              </TouchableRipple>
            }
          >
            <Menu.Item onPress={handleMenuLogoutClicked} title="Logout" />
          </Menu>
        </View>
      </Appbar.Header>
      {showLoginPage && <CasdoorLoginPage onWebviewClose={handleHideLoginPage} />}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 40,
    justifyContent: "center",
  },
  title: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  buttonWrapper: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  buttonContainer: {
    borderRadius: 20,
    overflow: "hidden",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonText: {
    ...Platform.select({
      ios: {
        fontSize: 16,
      },
      android: {
        fontSize: 14,
      },
    }),
    marginRight: 8,
    fontWeight: "bold",
  },
  avatar: {
    backgroundColor: "transparent",
  },
  menu: {
    marginTop: 40,
  },
  menuContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});

export default Header;
