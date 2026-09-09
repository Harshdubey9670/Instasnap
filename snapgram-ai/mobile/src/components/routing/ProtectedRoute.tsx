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

interface ProtectedRouteProps {
  adminOnly?: boolean;
}

export function ProtectedRoute({
  adminOnly = false,
}: ProtectedRouteProps) {
  const {
    isAuthenticated,
    user,
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

  if (!isAuthenticated) {
    return (
      <Redirect
        href="/auth/login"
      />
    );
  }

  if (
    adminOnly &&
    user?.role !== "admin"
  ) {
    return (
      <Redirect
        href="/app"
      />
    );
  }

  return <Slot />;
}