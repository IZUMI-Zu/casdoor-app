import React from "react";
import {createStackNavigator} from "@react-navigation/stack";
import PasswordManager from "./PasswordManager";
import Header from "./Header";

const Stack = createStackNavigator();

export default function PasswordStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        header: (props) => <Header {...props} />,
      }}
    >
      <Stack.Screen name="PasswordManager" component={PasswordManager} />
    </Stack.Navigator>
  );
}
