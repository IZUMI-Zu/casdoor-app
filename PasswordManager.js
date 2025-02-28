import React, {useRef, useState} from "react";
import {RefreshControl, TouchableOpacity, View} from "react-native";
import {
  Divider,
  IconButton,
  List,
  Portal,
  Text
} from "react-native-paper";
import {useTranslation} from "react-i18next";
import usePasswordStore, {usePasswordSync, usePasswords} from "./usePasswordStore";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import {FlashList} from "@shopify/flash-list";
import Animated, {
  useAnimatedStyle,
  withTiming
} from "react-native-reanimated";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import {useNotifications} from "react-native-notificated";
import SearchBar from "./SearchBar";
import {PasswordFormDialog, PasswordViewDialog} from "./PasswordDialogs";
import useStore from "./useStorage";

const EMPTY_PASSWORD = {
  application: "",
  username: "",
  password: "",
  signinUrl: "",
};

const PasswordManager = () => {
  const {t} = useTranslation();
  const {passwords} = usePasswords();
  const swipeableRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState(EMPTY_PASSWORD);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPassword, setEditingPassword] = useState(EMPTY_PASSWORD);
  const [refreshing, setRefreshing] = useState(false);

  const {
    addPassword,
    updatePassword,
    deletePassword,
    getPassword,
  } = usePasswordStore();

  const {notify} = useNotifications();

  const {userInfo, token, serverUrl} = useStore();
  const {startSync} = usePasswordSync();

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredPasswords = passwords.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.application.toLowerCase().includes(searchLower) ||
      item.username.toLowerCase().includes(searchLower) ||
      (item.signinUrl && item.signinUrl.toLowerCase().includes(searchLower))
    );
  });

  const handlePasswordAction = async(action, id = null) => {
    if (id) {
      const passwordData = await getPassword(id);
      if (!passwordData) {return;}

      switch (action) {
      case "view":
        setSelectedPassword(passwordData);
        setShowPasswordDialog(true);
        break;
      case "edit":
        setEditingPassword(passwordData);
        setShowEditDialog(true);
        break;
      case "delete":
        await deletePassword(id);
        break;
      }
    }
    closeSwipeableMenu();
  };

  const handleSubmit = async(type) => {
    const data = type === "add" ? newPassword : editingPassword;
    if (!data.signinUrl || !data.username || !data.password) {
      notify("error", {
        params: {
          title: t("common.error"),
          description: t("password.requiredFields"),
        },
      });
      return;
    }

    const success = type === "add"
      ? await addPassword(data)
      : await updatePassword(data.id, data);

    if (success) {
      if (type === "add") {
        setShowAddDialog(false);
        setNewPassword(EMPTY_PASSWORD);
      } else {
        setShowEditDialog(false);
        setEditingPassword(EMPTY_PASSWORD);
      }
    } else {
      notify("error", {
        params: {
          title: t("common.error"),
          description: t(`password.${type}Failed`),
        },
      });
    }
  };

  const closeSwipeableMenu = () => {
    if (swipeableRef.current) {
      swipeableRef.current.close();
    }
  };

  const renderRightActions = (progress, dragX, password) => {
    const styleAnimation = useAnimatedStyle(() => {
      return {
        transform: [{translateX: dragX.value + 160}],
      };
    });

    return (
      <Animated.View style={[{width: 160, flexDirection: "row"}, styleAnimation]}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "#E6DFF3",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => {
            dragX.value = withTiming(0);
            handlePasswordAction("edit", password.id);
          }}
        >
          <MaterialCommunityIcons name="pencil" size={24} color="#666" />
          <Text style={{marginTop: 4, color: "#666"}}>
            {t("common.edit")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "#FF6B6B",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => {
            dragX.value = withTiming(0);
            handlePasswordAction("delete", password.id);
          }}
        >
          <MaterialCommunityIcons name="trash-can" size={24} color="#FFF" />
          <Text style={{marginTop: 4, color: "#FFF"}}>
            {t("common.delete")}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const ListItem = ({item}) => {
    return (
      <GestureHandlerRootView>
        <Swipeable
          ref={swipeableRef}
          renderRightActions={(progress, dragX) =>
            renderRightActions(progress, dragX, item)
          }
          rightThreshold={40}
          overshootRight={false}
          friction={2}
          enableTrackpadTwoFingerGesture
          onSwipeableOpen={() => {
            if (swipeableRef.current) {
              swipeableRef.current.close();
            }
          }}
        >
          <List.Item
            style={{
              height: 80,
              paddingVertical: 6,
              paddingHorizontal: 16,
              justifyContent: "center",
            }}
            title={
              <View style={{justifyContent: "center", paddingLeft: 0, paddingTop: 6}}>
                <Text variant="titleMedium" numberOfLines={1}>
                  {item.application + " - " + item.signinUrl}
                </Text>
              </View>
            }
            description={
              <Text variant="titleMedium">
                {item.username}
              </Text>
            }
            left={(props) => (
              <List.Icon {...props} icon="key-variant" size={40} />
            )}
            right={(props) => (
              <IconButton
                {...props}
                icon="chevron-right"
                onPress={() => handlePasswordAction("view", item.id)}
              />
            )}
            onPress={() => handlePasswordAction("view", item.id)}
          />
        </Swipeable>
      </GestureHandlerRootView>
    );
  };

  const handleCloseDialogs = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    setShowPasswordDialog(false);
    setNewPassword(EMPTY_PASSWORD);
    setEditingPassword(EMPTY_PASSWORD);
  };

  const handleSync = async() => {
    if (!userInfo || !token || !serverUrl) {
      notify("error", {
        params: {
          title: t("common.error"),
          description: t("password.loginRequired"),
        },
      });
      return;
    }

    const error = await startSync(userInfo, serverUrl, token);
    if (error) {
      notify("error", {
        params: {
          title: t("common.error"),
          description: error,
        },
      });
    } else if (!error) {
      notify("success", {
        params: {
          title: t("common.success"),
          description: t("password.syncSuccess"),
        },
      });
    }
  };

  const onRefresh = async() => {
    setRefreshing(true);
    if (userInfo && token && serverUrl) {
      await handleSync();
    }
    setRefreshing(false);
  };

  return (
    <View style={{flex: 1}}>
      <SearchBar onSearch={handleSearch} />
      <FlashList
        data={searchQuery.trim() !== "" ? filteredPasswords : passwords}
        keyExtractor={(item) => `${item.id}`}
        estimatedItemSize={80}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({item}) => (
          <ListItem item={item} />
        )}
        ItemSeparatorComponent={() => <Divider />}
      />

      <View style={{position: "absolute", bottom: 30, right: 30}}>
        <TouchableOpacity
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: "#E6DFF3",
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => {
            setNewPassword(EMPTY_PASSWORD);
            setShowAddDialog(true);
          }}
        >
          <IconButton icon="plus" size={40} color={"white"} />
        </TouchableOpacity>
      </View>

      <Portal>
        <PasswordFormDialog
          visible={showAddDialog}
          onDismiss={handleCloseDialogs}
          title={t("password.addNewPassword")}
          data={newPassword}
          onChangeData={setNewPassword}
          onSubmit={() => handleSubmit("add")}
          submitLabel={t("common.add")}
        />
        <PasswordFormDialog
          visible={showEditDialog}
          onDismiss={handleCloseDialogs}
          title={t("password.editPassword")}
          data={editingPassword}
          onChangeData={setEditingPassword}
          onSubmit={() => handleSubmit("edit")}
          submitLabel={t("common.save")}
        />
        <PasswordViewDialog
          password={selectedPassword}
          visible={showPasswordDialog}
          onDismiss={handleCloseDialogs}
        />
      </Portal>
    </View>
  );
};

export default PasswordManager;
