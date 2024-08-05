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
import {PaperProvider} from "react-native-paper";
import {NavigationContainer} from "@react-navigation/native";
import {RootSiblingParent} from "react-native-root-siblings";
import {SQLiteProvider} from "expo-sqlite";
import Header from "./Header";
import NavigationBar from "./NavigationBar";
import {UserProvider} from "./UserContext";
import {CasdoorServerProvider} from "./CasdoorServerContext";
import {migrateDb} from "./TotpDatabase";

const App = () => {

  const [userInfo, setUserInfo] = React.useState(null);
  const [token, setToken] = React.useState(null);
  const [casdoorServer, setCasdoorServer] = React.useState(null);

  return (
    <CasdoorServerProvider value={{casdoorServer, setCasdoorServer}} >
      <UserProvider value={{userInfo, setUserInfo, token, setToken}} >
        <SQLiteProvider databaseName="totp.db" onInit={migrateDb} enableChangeListener={true}>
          <RootSiblingParent>
            <NavigationContainer>
              <PaperProvider>
                <Header />
                <NavigationBar />
              </PaperProvider>
            </NavigationContainer>
          </RootSiblingParent>
        </SQLiteProvider>
      </UserProvider>
    </CasdoorServerProvider>
  );
};
export default App;
