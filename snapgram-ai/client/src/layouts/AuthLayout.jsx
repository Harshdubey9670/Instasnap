import { Outlet, Link } from "react-router-dom";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { ChevronLeft } from "lucide-react";

// NOTE: Login/Signup/Otp/ForgotPassword/ResetPassword each render a full
// self-contained `min-h-screen` layout (own ambient blobs, own glass card,
// own heading) and intentionally ignore this shell's content area — only
// ProfileSetupPage (a bare `<Card>`) actually relies on it for a background.
// This layout must stay a thin frame: ambient backdrop + corner chrome only,
// never its own title/card, or those pages would render doubled-up.
export const AuthLayout = () => {
  return (
    <div className="relative min-h-screen bg-[#F5F0EB] dark:bg-[#120907] text-[#1A1A1A] dark:text-[#F5F0EB] overflow-x-hidden selection:bg-[#FF6B35]/20 selection:text-[#FF6B35]">
      {/* Ambient glow orbs — soft peach/orange lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 sm:w-[32rem] sm:h-[32rem] rounded-full bg-[#FF6B35]/6 dark:bg-[#FF6B35]/15 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 sm:w-[32rem] sm:h-[32rem] rounded-full bg-[#FFB347]/5 dark:bg-[#FFB347]/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-[#FF8C5A]/4 dark:bg-[#FF8C5A]/10 blur-[120px]" />
      </div>

      {/* Back Arrow - Top Left */}
      <div className="absolute top-4 left-4 z-30">
        <Link
          to="/"
          className="p-2.5 flex items-center justify-center rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/15 text-[#1A1A1A] dark:text-white shadow-sm hover:bg-white dark:hover:bg-white/20 transition-all"
          aria-label="Back to Home"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      {/* Main Auth Content Container */}
      <div className="relative z-10 w-full min-h-screen flex items-center justify-center">
        <Outlet />
      </div>
    </div>
  );
};
