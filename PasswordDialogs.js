import React, {useEffect, useRef, useState} from "react";
import {ScrollView, StyleSheet, TouchableOpacity, View} from "react-native";
import {
  Button,
  Divider,
  IconButton,
  Menu,
  Modal,
  Text,
  TextInput
} from "react-native-paper";
import * as Clipboard from "expo-clipboard";
import {useTranslation} from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as api from "./api";
import useStore from "./useStorage";

const BaseDialog = ({visible, onDismiss, title, children, height = "40%"}) => {
  const styles = useStyles();

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={{
        ...styles.modalBase,
        height,
      }}
    >
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <IconButton
            icon="close"
            size={24}
            onPress={onDismiss}
            style={styles.closeButton}
          />
        </View>
        {children}
      </View>
    </Modal>
  );
};

export const PasswordViewDialog = ({password, visible, onDismiss}) => {
  const {t} = useTranslation();
  const styles = useStyles();
  const [copiedFields, setCopiedFields] = React.useState({});
  const [passwordVisible, setPasswordVisible] = useState(false);

  const copyToClipboard = async(text, fieldName) => {
    await Clipboard.setStringAsync(text);
    setCopiedFields(prev => ({...prev, [fieldName]: true}));
    setTimeout(() => {
      setCopiedFields(prev => ({...prev, [fieldName]: false}));
    }, 2000);
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const Field = ({label, value, fieldName, isPassword = false}) => (
    <TouchableOpacity
      style={styles.fieldContainer}
      onPress={() => value && copyToClipboard(value, fieldName)}
    >
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldContent}>
        {isPassword && !passwordVisible ? (
          <Text style={styles.fieldValue} numberOfLines={2}>
            {"•".repeat(value?.length || 0)}
          </Text>
        ) : (
          <Text style={styles.fieldValue} numberOfLines={2}>{value || "—"}</Text>
        )}
        <View style={styles.fieldActions}>
          {isPassword && (
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.iconButton}>
              <Icon
                name={passwordVisible ? "eye-off" : "eye"}
                size={20}
                color="#007AFF"
              />
            </TouchableOpacity>
          )}
          {value && (
            <Icon
              name={copiedFields[fieldName] ? "check" : "content-copy"}
              size={20}
              color="#007AFF"
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <BaseDialog
      visible={visible}
      onDismiss={onDismiss}
      title={t("password.details")}
      height="60%"
    >
      <View style={styles.dialogContent}>
        <ScrollView style={styles.scrollView}>
          <Field
            label={t("password.application")}
            value={password?.application}
            fieldName="application"
          />
          <Field
            label={t("password.url")}
            value={password?.signinUrl}
            fieldName="signinUrl"
          />
          <Field
            label={t("password.username")}
            value={password?.username}
            fieldName="username"
          />
          <Field
            label={t("password.password")}
            value={password?.password}
            fieldName="password"
            isPassword={true}
          />
        </ScrollView>

        <Button
          mode="outlined"
          onPress={onDismiss}
          style={styles.button}
          labelStyle={styles.buttonLabel}
        >
          {t("common.close")}
        </Button>
      </View>
    </BaseDialog>
  );
};

export const PasswordFormDialog = ({
  visible,
  onDismiss,
  title,
  data,
  onChangeData,
  onSubmit,
  onError,
  submitLabel,
}) => {
  const {t} = useTranslation();
  const styles = useStyles();
  const {userInfo, serverUrl, token} = useStore();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const appSelectorRef = useRef();

  useEffect(() => {
    const fetchApplications = async() => {
      if (visible && serverUrl && userInfo?.owner && token) {
        setLoading(true);
        setFetchError("");
        try {
          const apps = await api.getApplication(serverUrl, userInfo?.owner, token);
          setApplications(apps || []);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchApplications();
  }, [visible, serverUrl, userInfo?.owner, token, t]);

  const handleSubmit = async() => {
    // Validate URL format if provided
    if (data.signinUrl) {
      if (!isValidUrl(data.signinUrl)) {
        setUrlError(t("password.invalidUrl"));
        return;
      }

      // Format the URL with https:// if it doesn't have a protocol
      if (!data.signinUrl.match(/^[a-zA-Z]+:\/\//)) {
        onChangeData({...data, signinUrl: "https://" + data.signinUrl});
      }
    }

    try {
      await onSubmit();
    } catch (err) {
      onError?.(err);
    }
  };

  const isValidUrl = (signinUrl) => {
    try {
      // If URL doesn't have a protocol, add https:// prefix for validation
      if (signinUrl && !signinUrl.match(/^[a-zA-Z]+:\/\//)) {
        signinUrl = "https://" + signinUrl;
      }
      new URL(signinUrl);
      return true;
    } catch (e) {
      return false;
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const selectApplication = (appName) => {
    onChangeData({...data, application: appName});
    closeMenu();
  };

  return (
    <BaseDialog
      visible={visible}
      onDismiss={onDismiss}
      title={title}
      height="55%"
    >
      <ScrollView style={styles.scrollView}>
        <View>
          <Text style={styles.inputLabel}>{t("password.application")}</Text>

          {/* Application Selector */}
          <View style={styles.menuAnchor}>
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={<TouchableOpacity
                onPress={openMenu}
                activeOpacity={0.7}
                style={styles.applicationSelector}
                ref={appSelectorRef}
              >
                <Icon name="application" size={20} color="#666" style={styles.appIcon} />
                <Text style={styles.appSelectorText}>
                  {data.application || t("password.selectApplication")}
                </Text>
                <Icon name="menu-down" size={20} color="#666" />
              </TouchableOpacity>}
              style={styles.menu}
              contentStyle={styles.menuContent}
            >
              <ScrollView style={{maxHeight: 300, maxWidth: "100%"}}>
                {loading ? (
                  <Menu.Item
                    title={t("common.loading")}
                    leadingIcon="loading"
                    disabled
                  />
                ) : applications.length > 0 ? (
                  applications.map((app, index) => (
                    <React.Fragment key={app.name || index}>
                      <Menu.Item
                        title={app.name}
                        leadingIcon="application"
                        onPress={() => selectApplication(app.name)}
                        style={styles.menuItem}
                      />
                      {index < applications.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                ) : (
                  <Menu.Item
                    title={t("password.noApplications")}
                    leadingIcon="alert-circle-outline"
                    disabled
                    style={styles.menuItem}
                  />
                )}
              </ScrollView>
            </Menu>
          </View>

          {fetchError ? <Text style={styles.errorText}>{fetchError}</Text> : null}

          <TextInput
            mode="outlined"
            label={t("password.url")}
            value={data.signinUrl}
            onChangeText={(text) => {
              setUrlError("");
              onChangeData({...data, signinUrl: text});
            }}
            placeholder="https://example.com"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            error={!!urlError}
            style={styles.input}
            returnKeyType="next"
          />
          {urlError ? <Text style={styles.errorText}>{urlError}</Text> : null}

          <TextInput
            mode="outlined"
            label={t("password.username")}
            value={data.username}
            onChangeText={(text) => onChangeData({...data, username: text})}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            returnKeyType="next"
          />

          <TextInput
            mode="outlined"
            label={t("password.password")}
            value={data.password}
            onChangeText={(text) => onChangeData({...data, password: text})}
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            returnKeyType="done"
            right={
              <TextInput.Icon
                icon={passwordVisible ? "eye-off" : "eye"}
                onPress={togglePasswordVisibility}
              />
            }
          />
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={onDismiss}
          style={[styles.button]}
          labelStyle={styles.buttonLabel}
        >
          {t("common.cancel")}
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={[styles.button, styles.primaryButton]}
          labelStyle={[styles.buttonLabel, {color: "white"}]}
        >
          {submitLabel}
        </Button>
      </View>
    </BaseDialog>
  );
};

const useStyles = () => StyleSheet.create({
  modalBase: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 8,
    padding: 20,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    margin: -8,
  },
  input: {
    marginBottom: 6,
    backgroundColor: "white",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    gap: 16,
    width: "100%",
  },
  button: {
    flex: 1,
    borderRadius: 999,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginLeft: 8,
    marginTop: -4,
    marginBottom: 6,
  },
  scrollView: {
    flex: 1,
    minHeight: 280,
    marginTop: 10,
  },
  fieldContainer: {
    marginBottom: 8,
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  fieldLabel: {
    color: "#6c757d",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldValue: {
    fontSize: 16,
    color: "#2c3e50",
    flex: 1,
    paddingRight: 12,
    lineHeight: 22,
  },
  fieldActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 4,
    marginLeft: 8,
  },
  applicationSelector: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 6,
    backgroundColor: "white",
    elevation: 1,
    width: "100%",
  },
  appIcon: {
    marginRight: 10,
  },
  appSelectorText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  dropdownModal: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 8,
    padding: 0,
    maxHeight: "80%",
  },
  dropdownContainer: {
    flex: 1,
    padding: 0,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  dropdownScrollView: {
    flex: 1,
    maxHeight: 400,
  },
  listItem: {
    paddingVertical: 4,
  },
  emptyListText: {
    color: "#666",
    fontStyle: "italic",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingText: {
    marginLeft: 10,
    color: "#666",
  },
  menuAnchor: {
    marginTop: 10,
    width: "100%",
  },
  menu: {
    width: "80%",
    marginTop: 45,
  },
  menuContent: {
    backgroundColor: "white",
    borderRadius: 8,
    maxHeight: 300,
  },
  menuItem: {
    height: 50,
  },
  dialogContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
});
