import {
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

import api from "../services/api";
import {
  getAuthToken,
  removeAuthToken,
} from "../utils/authStorage";

type AnyObject = Record<string, any>;

interface AuthState {
  user: AnyObject | null;
  isAuthenticated: boolean;
  loading: boolean;
  unreadNotificationsCount: number;
  settings: AnyObject | null;
  settingsLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,

  // SecureStore is asynchronous, so the mobile application starts
  // authentication initialization in a loading state.
  loading: true,

  unreadNotificationsCount: 0,
  settings: null,
  settingsLoading: false,
};

export const fetchSettings = createAsyncThunk<
  AnyObject,
  void,
  { rejectValue: string }
>(
  "auth/fetchSettings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/settings");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to fetch settings",
      );
    }
  },
);

export const loadUser = createAsyncThunk<
  AnyObject,
  void,
  { rejectValue: string }
>(
  "auth/loadUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/auth/me");
      return response.data.data;
    } catch (error: any) {
      await removeAuthToken();

      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to load user",
      );
    }
  },
);

export const updateSettings = createAsyncThunk<
  AnyObject,
  AnyObject,
  { rejectValue: string }
>(
  "auth/updateSettings",
  async (updates, { rejectWithValue }) => {
    try {
      const response = await api.put(
        "/api/settings",
        updates,
      );

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ||
          "Failed to update settings",
      );
    }
  },
);

export const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    loginStart: (state) => {
      state.loading = true;
    },

    loginSuccess: (
      state,
      action: PayloadAction<AnyObject>,
    ) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    },

    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.unreadNotificationsCount = 0;
      state.loading = false;
    },

    updateSavedPosts: (
      state,
      action: PayloadAction<any>,
    ) => {
      if (state.user) {
        state.user.savedPosts = action.payload;
      }
    },

    updateFollowing: (
      state,
      action: PayloadAction<any>,
    ) => {
      if (state.user) {
        state.user.following = action.payload;
      }
    },

    updateSentFollowRequests: (
      state,
      action: PayloadAction<any>,
    ) => {
      if (state.user) {
        state.user.sentFollowRequests =
          action.payload;
      }
    },

    updateBlockedUsers: (
      state,
      action: PayloadAction<any>,
    ) => {
      if (state.user) {
        state.user.blockedUsers = action.payload;
      }
    },

    updateMutedUsers: (
      state,
      action: PayloadAction<any>,
    ) => {
      if (state.user) {
        state.user.mutedUsers = action.payload;
      }
    },

    updateRestrictedUsers: (
      state,
      action: PayloadAction<any>,
    ) => {
      if (state.user) {
        state.user.restrictedUsers =
          action.payload;
      }
    },

    updateCloseFriends: (
      state,
      action: PayloadAction<any>,
    ) => {
      if (state.user) {
        state.user.closeFriends =
          action.payload;
      }
    },

    updateUserRelations: (
      state,
      action: PayloadAction<AnyObject>,
    ) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
        };
      }
    },

    setUnreadNotificationsCount: (
      state,
      action: PayloadAction<number>,
    ) => {
      state.unreadNotificationsCount =
        action.payload;
    },

    incrementUnreadCount: (state) => {
      state.unreadNotificationsCount += 1;
    },

    decrementUnreadCount: (state) => {
      state.unreadNotificationsCount =
        Math.max(
          0,
          state.unreadNotificationsCount - 1,
        );
    },

    clearUnreadCount: (state) => {
      state.unreadNotificationsCount = 0;
    },

    optimisticUpdateSetting: (
      state,
      action: PayloadAction<AnyObject>,
    ) => {
      if (!state.settings) {
        return;
      }

      const updates = action.payload;

      for (const category in updates) {
        const categoryValue =
          updates[category];

        if (
          typeof categoryValue === "object" &&
          categoryValue !== null &&
          !Array.isArray(categoryValue)
        ) {
          if (!state.settings[category]) {
            state.settings[category] = {};
          }

          for (const key in categoryValue) {
            state.settings[category][key] =
              categoryValue[key];
          }
        } else {
          state.settings[category] =
            categoryValue;
        }
      }
    },

    finishAuthInitialization: (state) => {
      state.loading = false;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(
        loadUser.pending,
        (state) => {
          state.loading = true;
        },
      )

      .addCase(
        loadUser.fulfilled,
        (state, action) => {
          state.loading = false;
          state.user = action.payload;
          state.isAuthenticated = true;
        },
      )

      .addCase(
        loadUser.rejected,
        (state) => {
          state.loading = false;
          state.user = null;
          state.isAuthenticated = false;
        },
      )

      .addCase(
        fetchSettings.pending,
        (state) => {
          state.settingsLoading = true;
        },
      )

      .addCase(
        fetchSettings.fulfilled,
        (state, action) => {
          state.settingsLoading = false;
          state.settings = action.payload;
        },
      )

      .addCase(
        fetchSettings.rejected,
        (state) => {
          state.settingsLoading = false;
        },
      )

      .addCase(
        updateSettings.fulfilled,
        (state, action) => {
          state.settings = action.payload;
        },
      );
  },
});

export const {
  loginStart,
  loginSuccess,
  logout,
  updateSavedPosts,
  updateFollowing,
  updateSentFollowRequests,
  updateBlockedUsers,
  updateMutedUsers,
  updateRestrictedUsers,
  updateCloseFriends,
  updateUserRelations,
  setUnreadNotificationsCount,
  incrementUnreadCount,
  decrementUnreadCount,
  clearUnreadCount,
  optimisticUpdateSetting,
  finishAuthInitialization,
} = authSlice.actions;

export default authSlice.reducer;