import React from "react";
import {
  Redirect,
  Slot,
} from "expo-router";
import {
  useSelector,
} from "react-redux";

import type { RootState } from "../../store/store";
import { GlobalLoadingOverlay } from "../ui/GlobalLoadingOverlay";

export function GuestRoute() {
  const {
    isAuthenticated,
    loading,
  } = useSelector(
    (state: RootState) =>
      state.auth,
  );

  if (loading) {
    return (
      <GlobalLoadingOverlay />
    );
  }

  if (isAuthenticated) {
    return (
      <Redirect
        href="/app"
      />
    );
  }

  return <Slot />;
}