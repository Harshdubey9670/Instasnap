import { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const useSocket = useSocketContext;

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const rawToken = localStorage.getItem('token');
    const token = rawToken?.startsWith('Bearer ') ? rawToken.slice(7).trim() : rawToken;
    
    if (user && token) {
      const socketInstance = io(import.meta.env.VITE_API_URL || "http://localhost:5001", {
        auth: {
          token: token,
        },
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Handle connection errors gracefully without infinite loop
      socketInstance.on("connect_error", (err) => {
        if (err?.message?.includes("Authentication error")) {
          console.warn("[Socket] Auth error received from server. Disconnecting socket:", err.message);
          socketInstance.disconnect();
        }
      });

      socketInstance.on("disconnect", (reason) => {
        if (reason === "io server disconnect") {
          // Disconnected by the server, auth rejected
          socketInstance.disconnect();
        }
      });

      // Handle Back-Forward Cache (BFCache) restores
      const onPageShow = (event) => {
        if (event.persisted && socketInstance) {
          socketInstance.connect();
        }
      };
      window.addEventListener("pageshow", onPageShow);

      setSocket(socketInstance);

      socketInstance.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      socketInstance.on("newMessage", (msg) => {
        // If we receive a message that isn't ours, mark it as delivered
        if (msg?.sender?._id && msg.sender._id !== user._id) {
          socketInstance.emit("markDelivered", { 
            messageId: msg._id, 
            senderId: msg.sender._id 
          });
        }
      });

      return () => {
        window.removeEventListener("pageshow", onPageShow);
        socketInstance.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
