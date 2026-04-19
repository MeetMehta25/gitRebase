import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import logo from "../assets/logo.png";

export function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#05050A]">
      {/* Global background from App.tsx */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Base gradient matching the dark space look */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(42,27,61,0.4)_0%,rgba(11,10,20,1)_60%)]"></div>
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[60px_60px] mask-[radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]"></div>
        
        {/* Glowing stars/nodes scattered like in the image */}
        <div className="absolute top-[10%] left-[30%] w-1 h-1 bg-white rounded-full shadow-[0_0_15px_2px_rgba(255,255,255,0.8)]"></div>
        <div className="absolute top-[25%] right-[20%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_20px_3px_rgba(255,255,255,0.8)]"></div>
        <div className="absolute bottom-[40%] left-[20%] w-1 h-1 bg-white rounded-full shadow-[0_0_15px_2px_rgba(255,255,255,0.8)]"></div>
        <div className="absolute top-[60%] right-[35%] w-2 h-2 bg-white/50 rounded-full shadow-[0_0_30px_5px_rgba(255,255,255,0.4)] blur-[1px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo/Header */}
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={logo} alt="QuantSphere Logo" className="w-12 h-12 object-contain" />
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-blue-400 tracking-tight">QuantSphere</h1>
            </div>
            <p className="text-white/50 text-sm">
              {isSignUp ? "Create your trading intelligence account" : "Welcome back to your trading hub"}
            </p>
          </div>

          {/* Main Card */}
          <motion.div
            className="relative backdrop-blur-3xl bg-[#110e19]/60 rounded-3xl border border-white/5 p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            animate={{ borderColor: isSignUp ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)" }}
            transition={{ duration: 0.3 }}
          >
            {/* Form Container */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-white/70 text-xs font-semibold mb-2.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-5 py-4 rounded-xl bg-white/4 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:bg-white/6 transition-all duration-300 shadow-inner"
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-white/70 text-xs font-semibold mb-2.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-5 py-4 rounded-xl bg-white/4 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:bg-white/6 transition-all duration-300 shadow-inner"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Sign Up only) */}
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-white/70 text-xs font-semibold mb-2.5 uppercase tracking-wider mt-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full px-5 py-4 rounded-xl bg-white/4 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:bg-white/6 transition-all duration-300 shadow-inner"
                      required
                    />
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 px-6 py-4 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-75 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#110e19] text-white/40 text-xs font-semibold tracking-wider rounded-lg">OR</span>
              </div>
            </div>

            {/* Toggle Sign Up / Log In */}
            <p className="text-center text-white/60 text-sm">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                }}
                className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 right-10 w-20 h-20 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"
        animate={{
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      ></motion.div>

      <motion.div
        className="absolute bottom-32 left-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"
        animate={{
          x: [0, -20, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      ></motion.div>
    </div>
  );
}
