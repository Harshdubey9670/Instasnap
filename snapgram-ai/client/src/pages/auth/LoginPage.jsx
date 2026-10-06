import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Menu,
  Heart,
  ChevronRight,
  LogIn
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

import { loginSuccess } from "../../store/authSlice";
import { useToast } from "../../components/ui/Toast";
import api from "../../services/api";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email or username is required";
    } else if (formData.email.includes("@") && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (!formData.email.includes("@") && formData.email.trim().length < 3) {
      newErrors.email = "Username must be at least 3 characters";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await api.post("/api/auth/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      const { token, user } = response.data;
      if (token) localStorage.setItem("token", token);
      dispatch(loginSuccess(user));

      if (user && !user.isVerified) {
        toast({
          variant: "warning",
          title: "Verification Required",
          description: "Please enter the verification code sent to your email.",
        });
        navigate("/auth/otp", { replace: true });
        return;
      }

      toast({
        variant: "success",
        title: "Welcome back!",
        description: "Successfully logged in.",
      });

      const destination = location.state?.from?.pathname || "/app";
      navigate(destination, { replace: true });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to connect to the server. Please try again.";
      toast({
        variant: "error",
        title: "Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const response = await api.post("/api/auth/google", {
        credential: credentialResponse.credential,
      });

      const { token, user } = response.data;
      localStorage.setItem("token", token);
      dispatch(loginSuccess(user));

      toast({
        variant: "success",
        title: "Welcome back!",
        description: "Successfully logged in with Google.",
      });
      const destination = location.state?.from?.pathname || "/app";
      navigate(destination, { replace: true });
    } catch (err) {
      toast({
        variant: "error",
        title: "Google Login Failed",
        description: "Could not authenticate with Google.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-12 select-none">
      
      {/* ─────────────────────────────────────────────────────────────
          1. DESKTOP VIEW (lg and above) — EXACT MATCH TO REFERENCE
         ───────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col flex-1 justify-between max-w-[1360px] w-full mx-auto">
        
        {/* Top Header Bar */}
        <header className="flex items-center justify-between w-full pt-2 pb-6">
          {/* Brand Logo & Script Tagline */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <img
                  src="/nuvyelo-emblem.png"
                  alt="NUVYELO"
                  className="w-10 h-10 object-contain drop-shadow"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-[#1A1A1A] dark:text-[#F5F0EB]">
                  NUVYELO
                </span>
                <span className="font-script text-sm text-[#FF6B35] -mt-1 tracking-wide">
                  More Moments, Brighter Together
                </span>
              </div>
            </Link>
          </div>

          {/* Right Header Navigation Link */}
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="text-black/50 dark:text-white/50">Don't have an account?</span>
            <Link
              to="/auth/signup"
              className="font-bold text-[#FF6B35] hover:text-[#E55A27] hover:underline transition-colors"
            >
              Create account
            </Link>
          </div>
        </header>

        {/* Center Main Two-Column Content */}
        <main className="grid grid-cols-12 gap-10 items-center py-6">
          
          {/* ── Left Column: Editorial Visual Story Collage ── */}
          <div className="col-span-7 flex flex-col gap-5 pr-4">
            
            {/* Collage Row */}
            <div className="flex items-stretch gap-4 relative">
              
              {/* Handwritten sticker badge top-left */}
              <div className="absolute -top-5 -left-4 z-20 px-3.5 py-1.5 rounded-full bg-[#FAF3EC] dark:bg-[#251715] border border-[#FF6B35]/20 shadow-[0_4px_16px_rgba(255,107,53,0.12)] rotate-[-6deg]">
                <span className="font-script text-base text-[#1A1A1A] dark:text-[#F5F0EB] font-bold">
                  Good Photos Brighter People <span className="text-[#FF6B35]">♡</span>
                </span>
              </div>

              {/* Large Portrait Card */}
              <div className="relative flex-1 rounded-[30px] overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.06)] border border-black/[0.04] bg-[#F0EBE5] min-h-[420px] group">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85"
                  alt="Moments"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Script overlay on portrait */}
                <div className="absolute bottom-6 left-6 z-10">
                  <p className="font-script text-2xl text-white font-bold drop-shadow-md leading-tight">
                    Collect Beautiful Moments
                  </p>
                  <div className="w-12 h-1 rounded-full bg-[#FF6B35] mt-1" />
                </div>
              </div>

              {/* Two Stacked Cards on Right */}
              <div className="w-56 flex flex-col gap-4">
                
                {/* Coastal Town Card with Quote Pill */}
                <div className="relative h-48 rounded-[26px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.05)] border border-black/[0.04] group">
                  <img
                    src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=500&q=80"
                    alt="Coastal Moments"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  
                  {/* Quote pill */}
                  <div className="absolute bottom-3 left-3 right-3 p-2 rounded-xl bg-white/90 dark:bg-[#1E1210]/90 backdrop-blur-md border border-white/30 text-center shadow-sm">
                    <p className="text-[11px] font-semibold text-[#1A1A1A] dark:text-[#F5F0EB] leading-tight">
                      A kinder brighter corner of the internet. <span className="text-[#FF6B35]">♡</span>
                    </p>
                  </div>
                </div>

                {/* Puppy / Happy Moment Card */}
                <div className="relative h-52 rounded-[26px] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.05)] border border-black/[0.04] group">
                  <img
                    src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=500&q=80"
                    alt="Happy Puppy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>

              </div>
            </div>

            {/* Social Proof Community Banner Card */}
            <div className="rounded-[24px] bg-white dark:bg-[#1E1210] p-4 px-5 flex items-center justify-between shadow-[0_6px_24px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/[0.05]">
              <div className="flex items-center gap-3.5">
                <div className="flex -space-x-2.5">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                    alt="Community"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-[#1E1210]"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                    alt="Community"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-[#1E1210]"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80"
                    alt="Community"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-[#1E1210]"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80"
                    alt="Community"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-[#1E1210]"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1A1A1A] dark:text-[#F5F0EB]">
                    Join a global community
                  </p>
                  <p className="text-[11px] text-black/50 dark:text-white/50">
                    of creators, explorers and friends.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-semibold text-black/40 dark:text-white/40">
                <span>Discover</span>
                <span>•</span>
                <span>Share</span>
                <span>•</span>
                <span className="text-[#FF6B35]">Belong</span>
              </div>
            </div>

          </div>

          {/* ── Right Column: Floating Login Card ── */}
          <div className="col-span-5 flex justify-center">
            <div className="w-full max-w-[440px] bg-white dark:bg-[#1E1210] rounded-[32px] p-8 shadow-[0_12px_44px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-black/[0.04] dark:border-white/[0.06] relative overflow-hidden">
              
              {/* Soft peach radial background glow */}
              <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-[#FF6B35]/8 dark:bg-[#FF6B35]/15 blur-2xl pointer-events-none" />

              {/* Logo & Welcome */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center">
                    <img
                      src="/nuvyelo-emblem.png"
                      alt="NUVYELO"
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <span className="text-lg font-black tracking-tight text-[#1A1A1A] dark:text-[#F5F0EB]">
                    NUVYELO
                  </span>
                </div>

                <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-[#F5F0EB] tracking-tight">
                  Welcome back
                </h2>
                <p className="text-xs text-black/50 dark:text-white/50 mt-1 max-w-xs mx-auto leading-relaxed">
                  Log in to continue sharing your world and discovering new stories.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                
                {/* Email / Username Input */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40 dark:text-white/40">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="email"
                      placeholder="Email or username"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border ${
                        errors.email
                          ? "border-red-400 focus:ring-red-400"
                          : "border-black/[0.06] dark:border-white/[0.08] focus:border-[#FF6B35] focus:ring-[#FF6B35]/20"
                      } text-xs font-medium text-[#1A1A1A] dark:text-[#F5F0EB] placeholder:text-black/35 dark:placeholder:text-white/35 outline-none transition-all`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] text-red-500 font-medium mt-1 pl-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40 dark:text-white/40">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-10 py-3 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border ${
                        errors.password
                          ? "border-red-400 focus:ring-red-400"
                          : "border-black/[0.06] dark:border-white/[0.08] focus:border-[#FF6B35] focus:ring-[#FF6B35]/20"
                      } text-xs font-medium text-[#1A1A1A] dark:text-[#F5F0EB] placeholder:text-black/35 dark:placeholder:text-white/35 outline-none transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-red-500 font-medium mt-1 pl-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="w-3.5 h-3.5 rounded border-black/20 text-[#FF6B35] focus:ring-[#FF6B35] accent-[#FF6B35] cursor-pointer"
                    />
                    <span className="text-black/60 dark:text-white/60 font-medium text-[11px]">
                      Keep me logged in
                    </span>
                  </label>
                  <Link
                    to="/auth/forgot-password"
                    className="font-semibold text-xs text-[#FF6B35] hover:text-[#E55A27] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Primary Orange Gradient Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white font-bold text-sm shadow-[0_4px_18px_rgba(255,107,53,0.35)] hover:shadow-[0_6px_24px_rgba(255,107,53,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Log In</span>
                  )}
                </button>

                {/* Divider */}
                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-black/[0.06] dark:border-white/[0.08]" />
                  </div>
                  <span className="relative px-3 bg-white dark:bg-[#1E1210] text-[11px] font-medium text-black/40 dark:text-white/40">
                    or continue with
                  </span>
                </div>

                {/* Social Login 3-Column Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Google */}
                  <div className="relative flex items-center justify-center h-12 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.08] transition-all cursor-pointer overflow-hidden group">
                    <div className="scale-75 origin-center opacity-0 absolute inset-0 z-20 flex items-center justify-center">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() =>
                          toast({
                            variant: "error",
                            title: "Login Failed",
                            description: "Google Login was unsuccessful.",
                          })
                        }
                      />
                    </div>
                    {/* Visual Google button icon */}
                    <div className="flex flex-col items-center justify-center gap-0.5 pointer-events-none">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      <span className="text-[10px] font-semibold text-black/60 dark:text-white/60">
                        Google
                      </span>
                    </div>
                  </div>

                  {/* Apple */}
                  <button
                    type="button"
                    onClick={() =>
                      toast({
                        title: "Apple Login",
                        description: "Apple sign-in is coming soon.",
                      })
                    }
                    className="flex flex-col items-center justify-center gap-0.5 h-12 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.08] transition-all"
                  >
                    <svg className="w-4 h-4 text-black dark:text-white fill-current" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.66-.82 1.11-1.96.99-3.1-.96.04-2.11.64-2.8 1.45-.6.7-.1.14-1.9 1.01-3.03.99 1.18 2.22 1.83 2.8 2.68z" />
                    </svg>
                    <span className="text-[10px] font-semibold text-black/60 dark:text-white/60">
                      Apple
                    </span>
                  </button>

                  {/* X */}
                  <button
                    type="button"
                    onClick={() =>
                      toast({
                        title: "X Login",
                        description: "X sign-in is coming soon.",
                      })
                    }
                    className="flex flex-col items-center justify-center gap-0.5 h-12 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.08] transition-all"
                  >
                    <svg className="w-3.5 h-3.5 text-black dark:text-white fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span className="text-[10px] font-semibold text-black/60 dark:text-white/60">
                      X
                    </span>
                  </button>
                </div>

                {/* Bottom Sign up Link */}
                <p className="text-center text-xs text-black/50 dark:text-white/50 pt-2">
                  Don't have an account?{" "}
                  <Link
                    to="/auth/signup"
                    className="font-bold text-[#FF6B35] hover:text-[#E55A27] transition-colors"
                  >
                    Create account
                  </Link>
                </p>

              </form>

            </div>
          </div>

        </main>

        {/* Desktop Footer */}
        <footer className="flex items-center justify-between w-full pt-6 pb-2 text-[11px] text-black/40 dark:text-white/40 border-t border-black/[0.04] dark:border-white/[0.05]">
          <p>© 2026 NUVYELO. More Moments, Brighter Together.</p>
          <div className="flex items-center gap-4 font-medium">
            <span className="hover:text-black dark:hover:text-white cursor-pointer">About</span>
            <span className="hover:text-black dark:hover:text-white cursor-pointer">Help</span>
            <span className="hover:text-black dark:hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-black dark:hover:text-white cursor-pointer">Terms</span>
            <span>|</span>
            <span className="font-script text-xs text-[#FF6B35] font-bold">
              More Moments, Brighter Together
            </span>
          </div>
        </footer>

      </div>


      {/* ─────────────────────────────────────────────────────────────
          2. RESPONSIVE MOBILE WEB VIEW (< lg) — MATCHING RIGHT PHONE
         ───────────────────────────────────────────────────────────── */}
      <div className="flex lg:hidden flex-col w-full max-w-md mx-auto py-2">
        
        {/* Mobile Header Bar */}
        <header className="flex items-center justify-between w-full mb-4 pl-12 pr-1">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center">
              <img
                src="/nuvyelo-emblem.png"
                alt="NUVYELO"
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="text-xl font-black text-[#1A1A1A] dark:text-[#F5F0EB]">
              NUVYELO
            </span>
          </Link>
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Mobile Hero Banner Card */}
        <div className="relative w-full h-44 rounded-[28px] overflow-hidden shadow-sm border border-black/[0.04] mb-[-24px] z-0">
          <img
            src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80"
            alt="Moments"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Script Sticker top-left */}
          <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-white/90 dark:bg-[#1E1210]/90 backdrop-blur-md border border-white/30 shadow-sm">
            <p className="font-script text-sm font-bold text-[#1A1A1A] dark:text-[#F5F0EB]">
              Good Stories Brighter Days <span className="text-[#FF6B35]">♡</span>
            </p>
          </div>
        </div>

        {/* Floating Mobile Login Card */}
        <div className="relative z-10 bg-white dark:bg-[#1E1210] rounded-[30px] p-6 shadow-[0_12px_36px_rgba(0,0,0,0.06)] border border-black/[0.04] dark:border-white/[0.06]">
          
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center gap-1.5 mb-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center">
                <img
                  src="/nuvyelo-emblem.png"
                  alt="NUVYELO"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <span className="text-base font-black text-[#1A1A1A] dark:text-[#F5F0EB]">
                NUVYELO
              </span>
            </div>

            <h2 className="text-xl font-black text-[#1A1A1A] dark:text-[#F5F0EB]">
              Welcome back
            </h2>
            <p className="text-[11px] text-black/50 dark:text-white/50 mt-0.5">
              Log in to explore, share and connect.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            {/* Email Input */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40 dark:text-white/40">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="email"
                  placeholder="Email or username"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium text-[#1A1A1A] dark:text-[#F5F0EB] placeholder:text-black/35 outline-none"
                />
              </div>
              {errors.email && (
                <p className="text-[10px] text-red-500 font-medium mt-1 pl-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40 dark:text-white/40">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium text-[#1A1A1A] dark:text-[#F5F0EB] placeholder:text-black/35 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-black/40 dark:text-white/40"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] text-red-500 font-medium mt-1 pl-1">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Link
                to="/auth/forgot-password"
                className="font-semibold text-[11px] text-[#FF6B35]"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white font-bold text-xs shadow-md shadow-[#FF6B35]/25 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Log In</span>
              )}
            </button>

            {/* Divider */}
            <div className="relative py-1 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/[0.06] dark:border-white/[0.08]" />
              </div>
              <span className="relative px-3 bg-white dark:bg-[#1E1210] text-[10px] font-medium text-black/40 dark:text-white/40">
                or continue with
              </span>
            </div>

            {/* Social buttons */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="flex items-center justify-center h-10 rounded-xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>

              <div className="flex items-center justify-center h-10 rounded-xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]">
                <svg className="w-4 h-4 text-black dark:text-white fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.66-.82 1.11-1.96.99-3.1-.96.04-2.11.64-2.8 1.45-.6.7-.1.14-1.9 1.01-3.03.99 1.18 2.22 1.83 2.8 2.68z" />
                </svg>
              </div>

              <div className="flex items-center justify-center h-10 rounded-xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]">
                <svg className="w-3.5 h-3.5 text-black dark:text-white fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
            </div>

            <p className="text-center text-[11px] text-black/50 dark:text-white/50 pt-1">
              Don't have an account?{" "}
              <Link to="/auth/signup" className="font-bold text-[#FF6B35]">
                Create account
              </Link>
            </p>
          </form>

        </div>

      </div>

    </div>
  );
}
