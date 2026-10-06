import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  AtSign,
  Camera,
  Check,
  CheckCircle,
  XCircle,
  ArrowRight,
  Menu,
  Sparkles,
  Heart
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

import { loginSuccess } from "../../store/authSlice";
import { useToast } from "../../components/ui/Toast";
import api from "../../services/api";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePicture: null,
    agreeTerms: true,
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fileInputRef = useRef(null);

  // Username availability state
  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: null,
    message: "",
  });
  const debouncedUsername = useDebounce(formData.username, 500);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!debouncedUsername || debouncedUsername.length < 3) {
        setUsernameStatus({ checking: false, available: null, message: "" });
        return;
      }

      setUsernameStatus({ checking: true, available: null, message: "Checking..." });
      try {
        const res = await api.post("/api/auth/check-username", {
          username: debouncedUsername,
        });
        if (res.data.available) {
          setUsernameStatus({
            checking: false,
            available: true,
            message: "Username is available!",
          });
        } else {
          setUsernameStatus({
            checking: false,
            available: false,
            message: "Username is taken.",
          });
        }
      } catch (err) {
        setUsernameStatus({ checking: false, available: null, message: "" });
      }
    };

    checkUsername();
  }, [debouncedUsername]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "error",
          title: "File too large",
          description: "Profile picture must be under 5MB.",
        });
        return;
      }
      setFormData((prev) => ({ ...prev, profilePicture: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9._]+$/.test(formData.username)) {
      newErrors.username = "Only letters, numbers, dots and underscores";
    } else if (usernameStatus.available === false) {
      newErrors.username = "This username is already taken";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must accept the terms";
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

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const data = new FormData();
      data.append("fullName", formData.fullName.trim());
      data.append("username", formData.username.trim().toLowerCase());
      data.append("email", formData.email.trim().toLowerCase());
      data.append("password", formData.password);
      if (formData.profilePicture) {
        data.append("profilePicture", formData.profilePicture);
      }

      const response = await api.post("/api/auth/register", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { token, user } = response.data;
      if (token) localStorage.setItem("token", token);
      dispatch(loginSuccess(user));

      toast({
        variant: "success",
        title: "Account Created!",
        description: "Please check your email for the verification code.",
      });

      navigate("/auth/otp", { replace: true });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Registration failed. Please verify your details.";
      toast({
        variant: "error",
        title: "Signup Failed",
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
        title: "Welcome to NUVYELO!",
        description: "Account created with Google.",
      });
      navigate("/app", { replace: true });
    } catch (err) {
      toast({
        variant: "error",
        title: "Google Sign-in Failed",
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
          {/* Left Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <img
                src="/nuvyelo-emblem.png"
                alt="NUVYELO"
                className="w-10 h-10 object-contain drop-shadow"
              />
            </div>
            <span className="text-2xl font-black tracking-tight text-[#1A1A1A] dark:text-[#F5F0EB]">
              NUVYELO
            </span>
          </Link>

          {/* Center Links */}
          <nav className="flex items-center gap-8 text-sm font-semibold text-black/60 dark:text-white/60">
            <Link to="/app/explore" className="hover:text-black dark:hover:text-white transition-colors">
              Explore
            </Link>
            <span className="hover:text-black dark:hover:text-white transition-colors cursor-pointer">
              Features
            </span>
            <span className="hover:text-black dark:hover:text-white transition-colors cursor-pointer">
              Community
            </span>
            <span className="hover:text-black dark:hover:text-white transition-colors cursor-pointer">
              About
            </span>
          </nav>

          {/* Right Link */}
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-black/50 dark:text-white/50">Have an account?</span>
            <Link
              to="/auth/login"
              className="font-bold text-[#FF6B35] hover:text-[#E55A27] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </header>

        {/* Center Content: Two Columns */}
        <main className="grid grid-cols-12 gap-10 items-start py-4">
          
          {/* ── Left Column: Brand Visuals & Collage ── */}
          <div className="col-span-6 flex flex-col gap-6 pt-4 pr-6">
            
            {/* Tagline & Headline */}
            <div>
              <span className="text-[11px] font-black tracking-widest text-[#FF6B35] uppercase block mb-1">
                JOIN OUR CREATIVE COMMUNITY
              </span>
              <h1 className="text-4xl xl:text-5xl font-black text-[#1A1A1A] dark:text-[#F5F0EB] tracking-tight leading-[1.12]">
                More Moments<br />Brighter Together
              </h1>
              <p className="text-sm text-black/55 dark:text-white/55 mt-3 max-w-md leading-relaxed">
                Create an account and start sharing your world with people who get you.
              </p>
            </div>

            {/* 4-Card Photo Collage */}
            <div className="relative pt-2 pb-4">
              
              {/* Card 1: Large Tilted Portrait */}
              <div className="relative w-60 h-72 rounded-[28px] overflow-hidden shadow-[0_16px_36px_rgba(0,0,0,0.07)] border border-black/[0.04] bg-[#EAE4DC] rotate-[-3deg] z-10">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=85"
                  alt="Moments"
                  className="w-full h-full object-cover"
                />
                
                {/* Script Sticker top-left */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 dark:bg-[#1E1210]/95 backdrop-blur-md border border-white/40 shadow-sm">
                  <p className="font-script text-xs font-bold text-[#1A1A1A] dark:text-[#F5F0EB]">
                    Good People Brighter Days <span className="text-[#FF6B35]">♡</span>
                  </p>
                </div>
              </div>

              {/* Card 2: Coastal Town */}
              <div className="absolute top-4 left-52 w-44 h-36 rounded-[24px] overflow-hidden shadow-[0_12px_28px_rgba(0,0,0,0.06)] border border-black/[0.04] bg-[#EAE4DC] rotate-[4deg] z-20">
                <img
                  src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=400&q=80"
                  alt="Coast"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Card 3: Latte Art */}
              <div className="absolute top-40 left-56 w-36 h-32 rounded-[22px] overflow-hidden shadow-[0_10px_24px_rgba(0,0,0,0.05)] border border-black/[0.04] bg-[#EAE4DC] rotate-[-2deg] z-20">
                <img
                  src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80"
                  alt="Coffee"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Card 4: Cute Kitten */}
              <div className="absolute top-64 left-44 w-40 h-36 rounded-[24px] overflow-hidden shadow-[0_14px_32px_rgba(0,0,0,0.06)] border border-black/[0.04] bg-[#EAE4DC] rotate-[3deg] z-30">
                <img
                  src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80"
                  alt="Cat"
                  className="w-full h-full object-cover"
                />
                
                {/* Script Sticker */}
                <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-full bg-white/95 dark:bg-[#1E1210]/95 backdrop-blur-md shadow-sm">
                  <p className="font-script text-[10px] font-bold text-[#1A1A1A] dark:text-[#F5F0EB]">
                    Little Moments Big Happiness <span className="text-[#FF6B35]">♡</span>
                  </p>
                </div>
              </div>

              {/* Spacer so layout does not collapse */}
              <div className="h-72" />
            </div>

            {/* Social Proof Creators Badge */}
            <div className="rounded-[22px] bg-white dark:bg-[#1E1210] p-3 px-4 flex items-center gap-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.04] w-fit">
              <div className="flex -space-x-2">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-white dark:ring-[#1E1210]"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-white dark:ring-[#1E1210]"
                />
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80"
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-white dark:ring-[#1E1210]"
                />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#1A1A1A] dark:text-[#F5F0EB]">
                  Join millions of creators
                </p>
                <p className="text-[10px] text-black/45 dark:text-white/45 font-medium">
                  Share. Connect. Be Inspired.
                </p>
              </div>
            </div>

          </div>

          {/* ── Right Column: Create Account Form Card ── */}
          <div className="col-span-6 flex justify-end">
            <div className="w-full max-w-[480px] bg-white dark:bg-[#1E1210] rounded-[32px] p-8 shadow-[0_12px_44px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-black/[0.04] dark:border-white/[0.06] relative overflow-hidden">
              
              {/* Soft peach radial background glow */}
              <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-[#FF6B35]/8 dark:bg-[#FF6B35]/15 blur-2xl pointer-events-none" />

              {/* Title Header */}
              <div className="text-center mb-5">
                <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-[#F5F0EB] tracking-tight">
                  Create Your Account
                </h2>
                <p className="text-xs text-black/50 dark:text-white/50 mt-1">
                  A brighter tomorrow starts with you. ✨
                </p>
              </div>

              {/* Profile Photo Upload Area */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] mb-5">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 rounded-full border-2 border-dashed border-[#FF6B35]/40 hover:border-[#FF6B35] flex items-center justify-center bg-white dark:bg-[#1E1210] cursor-pointer overflow-hidden flex-shrink-0 transition-colors group"
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-5 h-5 text-[#FF6B35] group-hover:scale-110 transition-transform" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-[#1A1A1A] dark:text-[#F5F0EB]">
                    Add a profile photo
                  </h4>
                  <p className="text-[11px] text-black/45 dark:text-white/45 mt-0.5">
                    Show the real you!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 text-[#FF6B35] text-xs font-bold transition-colors"
                >
                  {previewUrl ? "Change" : "Upload Photo"}
                </button>
              </div>

              {/* Form Fields */}
              <form onSubmit={handleSignup} className="space-y-3.5">
                
                {/* Full Name */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40 dark:text-white/40">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="e.g. Alex Park"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border ${
                        errors.fullName
                          ? "border-red-400"
                          : "border-black/[0.06] dark:border-white/[0.08] focus:border-[#FF6B35]"
                      } text-xs font-medium text-[#1A1A1A] dark:text-[#F5F0EB] placeholder:text-black/35 outline-none`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-[10px] text-red-500 font-medium mt-1 pl-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Username with Real-Time Availability Check */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40 dark:text-white/40">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      placeholder="e.g. alex.park"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border ${
                        errors.username
                          ? "border-red-400"
                          : "border-black/[0.06] dark:border-white/[0.08] focus:border-[#FF6B35]"
                      } text-xs font-medium text-[#1A1A1A] dark:text-[#F5F0EB] placeholder:text-black/35 outline-none`}
                    />
                    {/* Status icon */}
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {usernameStatus.checking && (
                        <div className="w-3.5 h-3.5 border-2 border-[#FF6B35]/30 border-t-[#FF6B35] rounded-full animate-spin" />
                      )}
                      {!usernameStatus.checking && usernameStatus.available === true && (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                      {!usernameStatus.checking && usernameStatus.available === false && (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1 px-1">
                    <span className="text-[10px] text-black/40 dark:text-white/40">
                      This will be your unique identity on NUVYELO.
                    </span>
                    {usernameStatus.message && (
                      <span
                        className={`text-[10px] font-semibold ${
                          usernameStatus.available ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {usernameStatus.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40 dark:text-white/40">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      placeholder="e.g. alex@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border ${
                        errors.email
                          ? "border-red-400"
                          : "border-black/[0.06] dark:border-white/[0.08] focus:border-[#FF6B35]"
                      } text-xs font-medium text-[#1A1A1A] dark:text-[#F5F0EB] placeholder:text-black/35 outline-none`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[10px] text-red-500 font-medium mt-1 pl-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40 dark:text-white/40">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border ${
                        errors.password
                          ? "border-red-400"
                          : "border-black/[0.06] dark:border-white/[0.08] focus:border-[#FF6B35]"
                      } text-xs font-medium text-[#1A1A1A] dark:text-[#F5F0EB] placeholder:text-black/35 outline-none`}
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

                {/* Confirm Password */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40 dark:text-white/40">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border ${
                        errors.confirmPassword
                          ? "border-red-400"
                          : "border-black/[0.06] dark:border-white/[0.08] focus:border-[#FF6B35]"
                      } text-xs font-medium text-[#1A1A1A] dark:text-[#F5F0EB] placeholder:text-black/35 outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-black/40 dark:text-white/40"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[10px] text-red-500 font-medium mt-1 pl-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Terms of Service Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className="mt-0.5 w-3.5 h-3.5 rounded border-black/20 text-[#FF6B35] accent-[#FF6B35] cursor-pointer"
                    />
                    <span className="text-[11px] text-black/60 dark:text-white/60 leading-tight">
                      I agree to the{" "}
                      <span className="font-bold text-[#FF6B35] hover:underline">
                        Terms of Service
                      </span>{" "}
                      and{" "}
                      <span className="font-bold text-[#FF6B35] hover:underline">
                        Privacy Policy
                      </span>
                    </span>
                  </label>
                  {errors.agreeTerms && (
                    <p className="text-[10px] text-red-500 font-medium mt-1 pl-1">
                      {errors.agreeTerms}
                    </p>
                  )}
                </div>

                {/* Primary Orange Gradient Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white font-bold text-sm shadow-[0_4px_18px_rgba(255,107,53,0.35)] hover:shadow-[0_6px_24px_rgba(255,107,53,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Create Account →</span>
                  )}
                </button>

                {/* Divider */}
                <div className="relative py-1.5 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-black/[0.06] dark:border-white/[0.08]" />
                  </div>
                  <span className="relative px-3 bg-white dark:bg-[#1E1210] text-[11px] font-medium text-black/40 dark:text-white/40">
                    or continue with
                  </span>
                </div>

                {/* Social 2-Column Buttons: Google & Apple */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Google */}
                  <div className="relative flex items-center justify-center h-11 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.08] transition-all cursor-pointer overflow-hidden">
                    <div className="scale-75 origin-center opacity-0 absolute inset-0 z-20 flex items-center justify-center">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() =>
                          toast({
                            variant: "error",
                            title: "Signup Failed",
                            description: "Google Sign-in was unsuccessful.",
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2 pointer-events-none">
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
                      <span className="text-xs font-semibold text-black/70 dark:text-white/70">
                        Continue with Google
                      </span>
                    </div>
                  </div>

                  {/* Apple */}
                  <button
                    type="button"
                    onClick={() =>
                      toast({
                        title: "Apple Sign-Up",
                        description: "Apple sign-in is coming soon.",
                      })
                    }
                    className="flex items-center justify-center gap-2 h-11 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.02] dark:hover:bg-white/[0.08] transition-all"
                  >
                    <svg className="w-4 h-4 text-black dark:text-white fill-current" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.66-.82 1.11-1.96.99-3.1-.96.04-2.11.64-2.8 1.45-.6.7-.1.14-1.9 1.01-3.03.99 1.18 2.22 1.83 2.8 2.68z" />
                    </svg>
                    <span className="text-xs font-semibold text-black/70 dark:text-white/70">
                      Continue with Apple
                    </span>
                  </button>
                </div>

              </form>

            </div>
          </div>

        </main>

        {/* Desktop Footer */}
        <footer className="flex items-center justify-between w-full pt-6 pb-2 text-[11px] text-black/40 dark:text-white/40 border-t border-black/[0.04] dark:border-white/[0.05]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1A1A1A] dark:text-[#F5F0EB]">NUVYELO</span>
            <span>—</span>
            <span>More creativity. More connections. A brighter you.</span>
          </div>
          <div className="flex items-center gap-4 font-medium">
            <span className="hover:text-black dark:hover:text-white cursor-pointer">Help</span>
            <span className="hover:text-black dark:hover:text-white cursor-pointer">Privacy</span>
            <span className="hover:text-black dark:hover:text-white cursor-pointer">Terms</span>
            <span className="hover:text-black dark:hover:text-white cursor-pointer">Contact</span>
            <span>|</span>
            <span>© 2026 NUVYELO. All rights reserved.</span>
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
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
            alt="Moments"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Script Sticker */}
          <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-white/90 dark:bg-[#1E1210]/90 backdrop-blur-md border border-white/30 shadow-sm">
            <p className="font-script text-sm font-bold text-[#1A1A1A] dark:text-[#F5F0EB]">
              Good People Brighter Days <span className="text-[#FF6B35]">♡</span>
            </p>
          </div>
        </div>

        {/* Floating Mobile Sign-up Card */}
        <div className="relative z-10 bg-white dark:bg-[#1E1210] rounded-[30px] p-6 shadow-[0_12px_36px_rgba(0,0,0,0.06)] border border-black/[0.04] dark:border-white/[0.06]">
          
          <div className="text-center mb-4">
            <h2 className="text-xl font-black text-[#1A1A1A] dark:text-[#F5F0EB]">
              Create Your Account
            </h2>
            <p className="text-[11px] text-black/50 dark:text-white/50 mt-0.5">
              Start sharing your world today. ✨
            </p>
          </div>

          {/* Photo Upload Area */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.03] border border-black/[0.04] mb-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full border-2 border-dashed border-[#FF6B35]/40 hover:border-[#FF6B35] flex items-center justify-center bg-white dark:bg-[#1E1210] cursor-pointer overflow-hidden flex-shrink-0"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-4 h-4 text-[#FF6B35]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-[#1A1A1A] dark:text-[#F5F0EB]">
                Profile Photo
              </h4>
              <p className="text-[10px] text-black/45 dark:text-white/45">Show the real you!</p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-xl bg-[#FF6B35]/10 text-[#FF6B35] text-[11px] font-bold"
            >
              Upload
            </button>
          </div>

          <form onSubmit={handleSignup} className="space-y-3">
            {/* Full Name */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06] text-xs font-medium text-[#1A1A1A] dark:text-[#F5F0EB] outline-none"
                />
              </div>
              {errors.fullName && (
                <p className="text-[10px] text-red-500 mt-1 pl-1">{errors.fullName}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40">
                  <AtSign className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06] text-xs font-medium text-[#1A1A1A] dark:text-[#F5F0EB] outline-none"
                />
              </div>
              {errors.username && (
                <p className="text-[10px] text-red-500 mt-1 pl-1">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06] text-xs font-medium text-[#1A1A1A] dark:text-[#F5F0EB] outline-none"
                />
              </div>
              {errors.email && (
                <p className="text-[10px] text-red-500 mt-1 pl-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06] text-xs font-medium text-[#1A1A1A] dark:text-[#F5F0EB] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-black/40"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[10px] text-red-500 mt-1 pl-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06] text-xs font-medium text-[#1A1A1A] dark:text-[#F5F0EB] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-black/40"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[10px] text-red-500 mt-1 pl-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Agreement */}
            <div className="pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="w-3.5 h-3.5 rounded text-[#FF6B35] accent-[#FF6B35]"
                />
                <span className="text-[10px] text-black/60 dark:text-white/60">
                  I agree to the{" "}
                  <span className="font-bold text-[#FF6B35]">Terms</span> and{" "}
                  <span className="font-bold text-[#FF6B35]">Privacy Policy</span>
                </span>
              </label>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] text-white font-bold text-xs shadow-md shadow-[#FF6B35]/25 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Create Account</span>
              )}
            </button>

            {/* Social Divider */}
            <div className="relative py-1 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/[0.06] dark:border-white/[0.08]" />
              </div>
              <span className="relative px-3 bg-white dark:bg-[#1E1210] text-[10px] font-medium text-black/40">
                or continue with
              </span>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="flex items-center justify-center h-10 rounded-xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06]">
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

              <div className="flex items-center justify-center h-10 rounded-xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06]">
                <svg className="w-4 h-4 text-black dark:text-white fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.66-.82 1.11-1.96.99-3.1-.96.04-2.11.64-2.8 1.45-.6.7-.1.14-1.9 1.01-3.03.99 1.18 2.22 1.83 2.8 2.68z" />
                </svg>
              </div>

              <div className="flex items-center justify-center h-10 rounded-xl bg-[#FBF8F5] dark:bg-white/[0.04] border border-black/[0.06] text-xs font-black text-black/40">
                •••
              </div>
            </div>

            <p className="text-center text-[11px] text-black/50 dark:text-white/50 pt-1">
              Already have an account?{" "}
              <Link to="/auth/login" className="font-bold text-[#FF6B35]">
                Sign In
              </Link>
            </p>
          </form>

        </div>

      </div>

    </div>
  );
}
