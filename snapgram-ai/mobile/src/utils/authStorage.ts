import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "token";
const SAVED_ACCOUNTS_KEY = "saved_accounts_list";

export interface SavedAccount {
  _id: string;
  username: string;
  fullName?: string;
  avatar?: string;
  token: string;
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error("Failed to read authentication token:", error);
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to save authentication token:", error);
    throw error;
  }
}

export async function removeAuthToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error("Failed to remove authentication token:", error);
  }
}

export async function getSavedAccounts(): Promise<SavedAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to read saved accounts:", error);
    return [];
  }
}

export async function saveAccount(account: SavedAccount): Promise<void> {
  try {
    const accounts = await getSavedAccounts();
    const existingIndex = accounts.findIndex((a) => a._id === account._id);
    if (existingIndex >= 0) {
      accounts[existingIndex] = { ...accounts[existingIndex], ...account };
    } else {
      accounts.push(account);
    }
    await AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error("Failed to save account to storage:", error);
  }
}

export async function removeSavedAccount(id: string): Promise<void> {
  try {
    const accounts = await getSavedAccounts();
    const filtered = accounts.filter((a) => a._id !== id);
    await AsyncStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove saved account:", error);
  }
}

export async function switchAccount(id: string): Promise<SavedAccount | null> {
  try {
    const accounts = await getSavedAccounts();
    const target = accounts.find((a) => a._id === id);
    if (!target) return null;
    await setAuthToken(target.token);
    return target;
  } catch (error) {
    console.error("Failed to switch account:", error);
    return null;
  }
}