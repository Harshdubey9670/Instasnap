import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setUnreadNotificationsCount, incrementUnreadCount, fetchSettings, updateUserRelations } from "../store/authSlice";
import { useTheme } from "../contexts/ThemeContext";
import { useSocketContext } from "../contexts/SocketContext";
import api from "../services/api";
import { Navbar } from "../components/navigation/Navbar";
import { SpatialNavRail } from "../components/ui/spatial/SpatialNavRail";
import { MobileNav } from "../components/navigation/MobileNav";
import { CreateMenuModal } from "../components/navigation/CreateMenuModal";
import { useNavigate } from "react-router-dom";
import { useEdgeSwipe } from "../hooks/useEdgeSwipe";
import { Suspense, useRef } from "react";
import { Loader2 } from "lucide-react";
import { AiAssistantDrawer } from "../components/ai/AiAssistantDrawer";

export const UserLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocketContext();
  const { user: authUser } = useSelector((state) => state.auth);

  const scrollRef = useRef(null);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  // Fetch initial unread notification count on mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get("/api/notifications/unread");
        if (res.data.success) {
          dispatch(setUnreadNotificationsCount(res.data.count));
        }
      } catch (err) {
        console.error("Failed to fetch unread notifications count", err);
      }
    };
    fetchUnreadCount();
    dispatch(fetchSettings());
  }, [dispatch]);

  // Real-time socket event listeners for relationship notifications
  useEffect(() => {
    if (!socket || !authUser) return;

    const handleNotificationCountUpdate = ({ delta }) => {
      if (delta > 0) {
        dispatch(incrementUnreadCount());
      }
    };

    const handleFollowRequest = (data) => {
      // Increment unread notification badge
      dispatch(incrementUnreadCount());
    };

    const handleFollowAccepted = (data) => {
      // Increment unread notification badge
      dispatch(incrementUnreadCount());
    };

    const handleNewNotification = (data) => {
      dispatch(incrementUnreadCount());
    };

    const handleRelationshipUpdated = (data) => {
      // Silently handled — UI reflects current auth state after each API call
      console.info('[Socket] Relationship updated:', data.type, 'by:', data.byUserId);
    };

    socket.on('notification_count_update', handleNotificationCountUpdate);
    socket.on('follow_request', handleFollowRequest);
    socket.on('follow_accepted', handleFollowAccepted);
    socket.on('new_notification', handleNewNotification);
    socket.on('relationship_updated', handleRelationshipUpdated);

    return () => {
      socket.off('notification_count_update', handleNotificationCountUpdate);
      socket.off('follow_request', handleFollowRequest);
      socket.off('follow_accepted', handleFollowAccepted);
      socket.off('new_notification', handleNewNotification);
      socket.off('relationship_updated', handleRelationshipUpdated);
    };
  }, [socket, authUser, dispatch]);

  // Handle Edge Swiping for Camera Navigation & Pull-to-Refresh
  useEdgeSwipe({
    onSwipeRight: () => {
      // Navigate to camera if on home page
      if (location.pathname === '/app' || location.pathname === '/app/') {
        navigate('/app/camera');
      } 
      // Navigate back to home if on chat page
      else if (location.pathname.startsWith('/app/chat')) {
        navigate('/app');
      }
    },
    onSwipeLeft: () => {
      // Navigate to chat if we are on the home page
      if (location.pathname === '/app' || location.pathname === '/app/') {
        navigate('/app/chat');
      }
      // Navigate back to home if on camera page
      else if (location.pathname.startsWith('/app/camera')) {
        navigate('/app');
      }
    },
    onSwipeDown: () => {
      // Trigger a hard refresh to update feeds/reels with latest data
      window.location.reload();
    }
  });

  // Handle Global Theme Application
  const { settings } = useSelector((state) => state.auth);
  const { setTheme } = useTheme();
  
  useEffect(() => {
    if (settings?.accessibility?.theme) {
      if (settings.accessibility.theme === 'dark') {
        setTheme('dark');
      } else if (settings.accessibility.theme === 'light') {
        setTheme('light');
      } else {
        // System preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setTheme('dark');
        } else {
          setTheme('light');
        }
      }
    }
  }, [settings?.accessibility?.theme, setTheme]);

  // Handle Global Font Size Application
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    if (settings?.accessibility?.fontSize) {
      if (settings.accessibility.fontSize === 'small') {
        root.style.fontSize = '14px';
      } else if (settings.accessibility.fontSize === 'large') {
        root.style.fontSize = '18px';
      } else {
        root.style.fontSize = '16px';
      }
    } else {
      root.style.fontSize = '16px';
    }
  }, [settings?.accessibility?.fontSize]);

  // Handle Global Language Application
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings?.language?.preferred) {
      root.lang = settings.language.preferred;
    }
  }, [settings?.language?.preferred]);
  
  // Pages that should take full available width (no padding, no max-width)
  const isFullWidthPage = location.pathname.includes('/chat')
    || location.pathname.includes('/settings')
    || location.pathname.includes('/camera')
    || location.pathname.includes('/reels')
    || location.pathname.includes('/spotlight');

  // Pages where the feed/main area uses overflow-hidden (e.g. reels use their own scroll)
  const isOwnScrollPage = location.pathname.includes('/reels')
    || location.pathname.includes('/spotlight')
    || location.pathname.includes('/camera');

  const isDesktopHome = location.pathname === '/app' || location.pathname === '/app/';

  return (
    <div className="h-dvh w-screen overflow-hidden bg-bg-base text-text-primary flex flex-col relative selection:bg-primary-500/20 selection:text-primary-500">
      {/* Warm cream environment lighting (fixed, pointer-events-none) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden spatial-env-bg">
        <div className="absolute -top-40 -left-40 w-[28rem] h-[28rem] sm:w-[40rem] sm:h-[40rem] rounded-full bg-[#FF6B35]/6 dark:bg-primary-400/25 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 w-[28rem] h-[28rem] sm:w-[40rem] sm:h-[40rem] rounded-full bg-[#FFB347]/5 dark:bg-secondary-500/20 blur-[160px]" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-[#FF8C5A]/4 dark:bg-primary-700/25 blur-[120px]" />
      </div>

      {/* ── Fixed floating top Navbar (hidden on desktop for desktop homepage) ── */}
      <div className={`relative z-40 flex-shrink-0 ${isDesktopHome ? 'lg:hidden' : ''}`}>
        <Navbar scrollContainerRef={scrollRef} onOpenCreate={() => setIsCreateMenuOpen(true)} />
      </div>

      {/* ── Floating spatial nav rail (hidden on desktop for desktop homepage) ── */}
      <div className={`hidden md:flex ${isDesktopHome ? 'lg:hidden' : ''} fixed left-4 lg:left-6 top-1/2 -translate-y-1/2 z-40`}>
        <SpatialNavRail onOpenCreate={() => setIsCreateMenuOpen(true)} />
      </div>

      {/* ── Body row: main content ── */}
      <div className={`relative z-10 flex flex-1 min-h-0 w-full ${isDesktopHome ? 'max-w-none md:pl-24 lg:pl-0' : 'max-w-[1600px] mx-auto md:pl-24 lg:pl-28'}`}>

        {/* Main content — THE ONLY scroll container */}
        <main
          ref={scrollRef}
          className={[
            "flex-1 min-w-0",
            isDesktopHome ? "pt-16 sm:pt-20 lg:pt-0" : "pt-16 sm:pt-20",
            isOwnScrollPage ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden",
            "scroll-smooth",
            "hide-scrollbar md:no-scrollbar",
            isDesktopHome ? "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-6 lg:pb-0" : "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-6",
          ].join(" ")}
          id="main-feed-scroll"
        >
          <div className={isFullWidthPage || isDesktopHome ? "w-full h-full" : "w-full max-w-full"}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom mobile navigation — floating glass pill, fixed, never moves */}
      <MobileNav onOpenCreate={() => setIsCreateMenuOpen(true)} />
      {authUser && <AiAssistantDrawer />}

      {/* Shared create flow — triggered from nav rail (desktop) and mobile nav.
          "Create Post" navigates to the dedicated /app/create/post page. */}
      <CreateMenuModal
        isOpen={isCreateMenuOpen}
        onClose={() => setIsCreateMenuOpen(false)}
      />
    </div>
  );
};

