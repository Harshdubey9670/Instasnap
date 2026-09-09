import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  AppState,
  Platform,
  type AppStateStatus,
} from "react-native";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";

import type { RootState } from "../store/store";
import {
  getAuthToken,
} from "../utils/authStorage";

interface SocketContextValue {
  socket: Socket | null;
  onlineUsers: string[];
}

const SocketContext =
  createContext<
    SocketContextValue | undefined
  >(undefined);

export function SocketContextProvider({
  children,
}: PropsWithChildren) {
  const [
    socket,
    setSocket,
  ] = useState<Socket | null>(null);

  const [
    onlineUsers,
    setOnlineUsers,
  ] = useState<string[]>([]);

  const socketRef =
    useRef<Socket | null>(null);

  const user = useSelector(
    (state: RootState) =>
      state.auth.user,
  );

  useEffect(() => {
    let cancelled = false;

    const setupSocket =
      async () => {
        const token =
          await getAuthToken();

        if (
          cancelled ||
          !user ||
          !token
        ) {
          if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
            setSocket(null);
          }

          setOnlineUsers([]);
          return;
        }

        if (
          socketRef.current &&
          socketRef.current.connected
        ) {
          return;
        }

        const socketInstance =
          io(
            process.env
              .EXPO_PUBLIC_API_URL ||
              (Platform.OS === "android"
                ? "http://10.0.2.2:5001"
                : "http://localhost:5001"),
            {
              auth: {
                token,
              },
              transports: [
                "websocket",
              ],
              autoConnect: true,
            },
          );

        socketRef.current =
          socketInstance;

        setSocket(
          socketInstance,
        );

        socketInstance.on(
          "getOnlineUsers",
          (users: string[]) => {
            setOnlineUsers(
              users || [],
            );
          },
        );

        socketInstance.on(
          "newMessage",
          (msg: any) => {
            if (
              msg?.sender?._id &&
              user?._id &&
              msg.sender._id !==
                user._id
            ) {
              socketInstance.emit(
                "markDelivered",
                {
                  messageId:
                    msg._id,
                  senderId:
                    msg.sender._id,
                },
              );
            }
          },
        );

        socketInstance.on(
          "connect_error",
          (error) => {
            console.error(
              "Socket connection error:",
              error,
            );
          },
        );
      };

    setupSocket();

    return () => {
      cancelled = true;

      const existingSocket =
        socketRef.current;

      if (existingSocket) {
        existingSocket.close();
        socketRef.current =
          null;
        setSocket(null);
      }

      setOnlineUsers([]);
    };
  }, [user]);

  useEffect(() => {
    const handleAppStateChange =
      (
        nextState: AppStateStatus,
      ) => {
        const currentSocket =
          socketRef.current;

        if (!currentSocket) {
          return;
        }

        // React Native may suspend a socket while
        // the application is backgrounded. When the
        // application becomes active again, explicitly
        // reconnect if necessary.
        if (
          nextState === "active" &&
          !currentSocket.connected
        ) {
          currentSocket.connect();
        }
      };

    const subscription =
      AppState.addEventListener(
        "change",
        handleAppStateChange,
      );

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context =
    useContext(
      SocketContext,
    );

  if (!context) {
    throw new Error(
      "useSocketContext must be used within a SocketContextProvider",
    );
  }

  return context;
}

export const useSocket =
  useSocketContext;