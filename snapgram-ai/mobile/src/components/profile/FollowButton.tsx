import React, {
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  DeviceEventEmitter,
  StyleSheet,
} from "react-native";
import {
  useDispatch,
  useSelector,
} from "react-redux";

import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import api from "../../services/api";
import type { RootState } from "../../store/store";
import {
  updateFollowing,
  updateSentFollowRequests,
} from "../../store/authSlice";

interface FollowButtonProps {
  userId: string;
  targetUser?: unknown;
  onToggle?: (status: {
    isFollowing: boolean;
    isRequested: boolean;
  }) => void;
  className?: string;
}

export const FollowButton = ({
  userId,
  targetUser: _targetUser,
  onToggle,
}: FollowButtonProps) => {
  const {
    user: authUser,
  } = useSelector(
    (state: RootState) =>
      state.auth,
  );

  const dispatch =
    useDispatch();

  const {
    toast,
  } = useToast();

  const [
    isFollowing,
    setIsFollowing,
  ] = useState(false);

  const [
    isRequested,
    setIsRequested,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  useEffect(() => {
    if (
      authUser?.following &&
      userId
    ) {
      const targetId =
        String(userId);

      setIsFollowing(
        authUser.following.some(
          (id: any) =>
            String(
              typeof id ===
                "string"
                ? id
                : id?._id ||
                  id,
            ) ===
            targetId,
        ),
      );
    } else {
      setIsFollowing(
        false,
      );
    }

    if (
      authUser?.sentFollowRequests &&
      userId
    ) {
      const targetId =
        String(userId);

      setIsRequested(
        authUser.sentFollowRequests.some(
          (id: any) =>
            String(
              typeof id ===
                "string"
                ? id
                : id?._id ||
                  id,
            ) ===
            targetId,
        ),
      );
    } else {
      setIsRequested(
        false,
      );
    }
  }, [
    authUser?.following,
    authUser?.sentFollowRequests,
    userId,
  ]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "user_follow_updated",
      (event: { userId: string; isFollowing: boolean; isRequested: boolean }) => {
        if (String(event.userId) === String(userId)) {
          setIsFollowing(event.isFollowing);
          setIsRequested(event.isRequested);
          onToggle?.({ isFollowing: event.isFollowing, isRequested: event.isRequested });
        }
      },
    );
    return () => sub.remove();
  }, [userId, onToggle]);

  const handleToggleFollow =
    async () => {
      if (isLoading) {
        return;
      }

      setIsLoading(
        true,
      );

      const wasFollowing =
        isFollowing;

      const wasRequested =
        isRequested;

      if (isFollowing) {
        setIsFollowing(
          false,
        );
      } else if (
        isRequested
      ) {
        setIsRequested(
          false,
        );
      } else {
        setIsFollowing(
          true,
        );
      }

      try {
        let response;

        if (wasFollowing) {
          response =
            await api.delete(
              `/api/users/${userId}/follow`,
            );
        } else if (
          wasRequested
        ) {
          response =
            await api.delete(
              `/api/users/follow-requests/${userId}/cancel`,
            );
        } else {
          response =
            await api.post(
              `/api/users/${userId}/follow`,
            );
        }

        if (
          response?.data
            ?.success
        ) {
          const nextStatus =
            response.data
              .status;

          if (
            nextStatus ===
            "requested"
          ) {
            setIsRequested(
              true,
            );
            setIsFollowing(
              false,
            );

            const updatedSentRequests =
              [
                ...(authUser
                  ?.sentFollowRequests ||
                  []),
                userId,
              ];

            dispatch(
              updateSentFollowRequests(
                updatedSentRequests,
              ),
            );

            DeviceEventEmitter.emit("user_follow_updated", {
              userId,
              isFollowing: false,
              isRequested: true,
            });
          } else if (
            nextStatus ===
            "following"
          ) {
            setIsFollowing(
              true,
            );
            setIsRequested(
              false,
            );

            if (
              response.data
                .data
            ) {
              dispatch(
                updateFollowing(
                  response.data
                    .data,
                ),
              );
            }

            DeviceEventEmitter.emit("user_follow_updated", {
              userId,
              isFollowing: true,
              isRequested: false,
            });
          } else {
            setIsFollowing(
              false,
            );
            setIsRequested(
              false,
            );

            if (
              response.data
                .data
            ) {
              dispatch(
                updateFollowing(
                  response.data
                    .data,
                ),
              );
            }

            if (
              wasRequested
            ) {
              const updatedSentRequests =
                (
                  authUser
                    ?.sentFollowRequests ||
                  []
                ).filter(
                  (
                    reqId: any,
                  ) =>
                    String(
                      reqId,
                    ) !==
                    String(
                      userId,
                    ),
                );

              dispatch(
                updateSentFollowRequests(
                  updatedSentRequests,
                ),
              );
            }

            DeviceEventEmitter.emit("user_follow_updated", {
              userId,
              isFollowing: false,
              isRequested: false,
            });
          }

          onToggle?.({
            isFollowing:
              nextStatus ===
              "following",
            isRequested:
              nextStatus ===
              "requested",
          });
        }
      } catch (
        error: any
      ) {
        setIsFollowing(
          wasFollowing,
        );

        setIsRequested(
          wasRequested,
        );

        toast({
          variant:
            "error",
          title:
            "Action Failed",
          description:
            error?.response
              ?.data
              ?.message ||
            "Could not update follow status.",
        });
      } finally {
        setIsLoading(
          false,
        );
      }
    };

  if (
    !authUser ||
    String(
      authUser._id,
    ) ===
      String(userId)
  ) {
    return null;
  }

  return (
    <Button
      variant={
        isFollowing ||
        isRequested
          ? "glass"
          : "primary"
      }
      onPress={() =>
        void handleToggleFollow()
      }
      disabled={
        isLoading
      }
      style={
        styles.button
      }
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={
            isFollowing ||
            isRequested
              ? "#0f172a"
              : "#ffffff"
          }
        />
      ) : isFollowing ? (
        "Following"
      ) : isRequested ? (
        "Requested"
      ) : (
        "Follow"
      )}
    </Button>
  );
};

const styles =
  StyleSheet.create({
    button: {
      minWidth: 100,
      minHeight: 36,
      paddingHorizontal: 16,
    },
  });