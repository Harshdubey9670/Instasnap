import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Check, Plus, Trash2, X } from "lucide-react-native";
import { router } from "expo-router";
import { useDispatch, useSelector } from "react-redux";

import { useTheme } from "../../contexts/ThemeContext";
import {
  getSavedAccounts,
  removeSavedAccount,
  switchAccount,
  SavedAccount,
} from "../../utils/authStorage";
import { loadUser } from "../../store/authSlice";
import { Avatar } from "../ui/Avatar";
import { AppDispatch, RootState } from "../../store/store";

interface AccountSwitcherDrawerProps {
  visible: boolean;
  onClose: () => void;
  currentUserId?: string;
}

export const AccountSwitcherDrawer: React.FC<AccountSwitcherDrawerProps> = ({
  visible,
  onClose,
  currentUserId,
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === "dark";
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchAccounts = async () => {
    const list = await getSavedAccounts();
    setAccounts(list);
  };

  useEffect(() => {
    if (visible) {
      void fetchAccounts();
    }
  }, [visible]);

  const handleSwitch = async (account: SavedAccount) => {
    if (account._id === currentUserId) {
      onClose();
      return;
    }
    try {
      setLoadingId(account._id);
      await switchAccount(account._id);
      await dispatch(loadUser()).unwrap();
      onClose();
    } catch (error) {
      console.error("Failed to switch account", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (account: SavedAccount) => {
    await removeSavedAccount(account._id);
    await fetchAccounts();
  };

  const handleAddAccount = () => {
    onClose();
    router.push("/auth/login" as any);
  };

  const bgColor = isDark ? "#120a1c" : "#ffffff";
  const overlayBg = "rgba(0, 0, 0, 0.65)";
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subtitleColor = isDark ? "#94a3b8" : "#64748b";
  const borderColor = isDark ? "#281838" : "#f1f5f9";
  const activeBg = isDark ? "rgba(168, 85, 247, 0.14)" : "rgba(168, 85, 247, 0.08)";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheetContainer, { backgroundColor: bgColor }]}>
          {/* Top Grab Indicator */}
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.grabHandle,
                { backgroundColor: isDark ? "#3b264d" : "#e2e8f0" },
              ]}
            />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <Text style={[styles.title, { color: textColor }]}>Accounts</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeButton}
            >
              <X size={20} color={subtitleColor} />
            </TouchableOpacity>
          </View>

          {/* Account list */}
          <FlatList
            data={accounts}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isActive = item._id === currentUserId;
              const isSwitching = loadingId === item._id;

              return (
                <View
                  style={[
                    styles.accountRow,
                    isActive && { backgroundColor: activeBg },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.accountPressable}
                    onPress={() => handleSwitch(item)}
                    disabled={isSwitching}
                    activeOpacity={0.7}
                  >
                    <View style={styles.avatarContainer}>
                      <Avatar
                        src={item.avatar}
                        alt={item.username}
                        size="md"
                        style={styles.accountAvatar}
                      />
                    </View>
                    <View style={styles.accountDetails}>
                      <Text
                        style={[
                          styles.accountUsername,
                          { color: textColor },
                          isActive && styles.activeUsername,
                        ]}
                        numberOfLines={1}
                      >
                        {item.username}
                      </Text>
                      {item.fullName ? (
                        <Text
                          style={[styles.accountFullName, { color: subtitleColor }]}
                          numberOfLines={1}
                        >
                          {item.fullName}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>

                  <View style={styles.actionSection}>
                    {isSwitching ? (
                      <ActivityIndicator size="small" color="#a855f7" />
                    ) : isActive ? (
                      <View style={styles.checkCircle}>
                        <Check size={16} color="#ffffff" strokeWidth={3} />
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleRemove(item)}
                        style={styles.deleteButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={18} color={isDark ? "#ef4444" : "#dc2626"} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
            ListFooterComponent={
              <TouchableOpacity
                style={[
                  styles.addAccountButton,
                  { borderTopColor: borderColor },
                ]}
                onPress={handleAddAccount}
                activeOpacity={0.7}
              >
                <View style={styles.addIconCircle}>
                  <Plus size={20} color="#a855f7" strokeWidth={2.5} />
                </View>
                <Text style={styles.addAccountText}>Add Instagram account</Text>
              </TouchableOpacity>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: "65%",
    minHeight: 260,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 6,
  },
  grabHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: "relative",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  closeButton: {
    position: "absolute",
    right: 18,
    padding: 4,
  },
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginVertical: 4,
  },
  accountPressable: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  accountAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 0,
  },
  accountDetails: {
    marginLeft: 14,
    flex: 1,
  },
  accountUsername: {
    fontSize: 15,
    fontWeight: "600",
  },
  activeUsername: {
    fontWeight: "700",
    color: "#a855f7",
  },
  accountFullName: {
    fontSize: 12,
    marginTop: 2,
  },
  actionSection: {
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#a855f7",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    padding: 6,
  },
  addAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#a855f7",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addAccountText: {
    marginLeft: 14,
    fontSize: 15,
    fontWeight: "600",
    color: "#a855f7",
  },
});

export default AccountSwitcherDrawer;
