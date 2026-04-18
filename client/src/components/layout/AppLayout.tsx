import { useEffect, useState } from "react";
import { LanguageToggle } from "./LanguageToggle";
import { useProfile, type UserLevel } from "../../hooks/useProfile";
import { Trophy, ThumbsUp } from "lucide-react";

// Modal Component
function ProfileSetupModal({ updateProfile }: { updateProfile: any }) {
  const [age, setAge] = useState("");
  const [exp, setExp] = useState<UserLevel>("Beginner");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ age: parseInt(age), level: exp });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#141415] border border-white/10 rounded-xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">
          Welcome to Alpha Quant
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Let's set up your profile to tailor the experience.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Age
            </label>
            <input
              type="number"
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a855f7]"
              placeholder="e.g. 25"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Trading Experience
            </label>
            <select
              value={exp}
              onChange={(e) => setExp(e.target.value as UserLevel)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#a855f7]"
            >
              <option value="Beginner">Beginner (Just starting)</option>
              <option value="Intermediate">
                Intermediate (Some experience)
              </option>
              <option value="Advanced">Advanced (Pro / Quant)</option>
            </select>
          </div>
          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-lg font-medium transition-colors"
          >
            Start Building
          </button>
        </form>
      </div>
    </div>
  );
}

import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import {
  Workflow,
  Newspaper,
  LineChart,
  Wallet,
  Terminal,
  Plus,
  IndentDecrease,
  IndentIncrease,
  Bot,
  CodeIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import logo from "../../assets/logo.png";
import { ThemeToggle } from "../ThemeToggle";

import { useTranslation } from "react-i18next";
const NAV_ITEMS = [
  // { name: "AI Agents", path: "/dashboard", icon: BrainCircuit },
  { name: "Strategy Builder", path: "/strategy-builder", icon: Workflow },
  { name: "News", path: "/news", icon: Newspaper },
  { name: "Screener", path: "/screener", icon: LineChart },
  { name: "Paper Trading", path: "/trading", icon: Wallet },
  { name: "Quant Coach", path: "/quant-coach", icon: Bot },
  { name: "Playground", path: "/playground", icon: Terminal },
  { name: "Sandbox", path: "/sandbox", icon: CodeIcon },
  //  {name : "MCP",path: "/mcp", icon: Brain}
];

export function AppLayout() {
  const { t } = useTranslation();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isCollapsed, setIsCollapsed] = useState(true);
  const location = useLocation();
  const { profile, updateProfile, showGamificationToast } = useProfile();

  // Route Protection Logic
  const isActivePathRestricted = () => {
    if (!profile.level) return false; // Allow until profile setup
    if (profile.level === "Beginner") {
      return ["/sandbox", "/playground", "/strategy-builder"].includes(
        location.pathname,
      );
    }
    if (profile.level === "Intermediate") {
      return ["/sandbox", "/playground"].includes(location.pathname);
    }
    return false;
  };

  if (isActivePathRestricted()) {
    // Log the forbidden access and redirect
    console.log(
      `Access to ${location.pathname} blocked for profile level ${profile.level}. Redirecting.`,
    );
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-bg-primary">
      {!profile.level && <ProfileSetupModal updateProfile={updateProfile} />}
      {showGamificationToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#141415] border border-[#a855f7]/50 rounded-lg p-4 shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center gap-4 animate-in slide-in-from-top-10">
          <div className="bg-[#a855f7]/20 p-2 rounded-full">
            <ThumbsUp className="w-6 h-6 text-[#a855f7]" />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">
              {showGamificationToast.message}
            </h4>
            <span className="text-sm text-[#a855f7] font-bold">
              +{showGamificationToast.points} Points!
            </span>
          </div>
        </div>
      )}

      {!profile.level && <ProfileSetupModal updateProfile={updateProfile} />}
      {showGamificationToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#141415] border border-[#a855f7]/50 rounded-lg p-4 shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center gap-4 animate-in slide-in-from-top-10">
          <div className="bg-[#a855f7]/20 p-2 rounded-full">
            <ThumbsUp className="w-6 h-6 text-[#a855f7]" />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">
              {showGamificationToast.message}
            </h4>
            <span className="text-sm text-[#a855f7] font-bold">
              +{showGamificationToast.points} Points!
            </span>
          </div>
        </div>
      )}

      {/* Subtle cursor glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(90,90,90,0.07), transparent 50%)`,
        }}
      />

      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside
          className={cn(
            "flex flex-col items-center border-r border-[#1e1e20] bg-[#141415] py-5 transition-all duration-300 overflow-hidden shrink-0",
            isCollapsed ? "w-16" : "w-64",
          )}
        >
          {/* Logo Section */}
          <div className="flex w-full items-center px-4 mb-8 h-8 shrink-0">
            <img
              src={logo}
              alt="Logo"
              className="w-8 h-8 object-contain shrink-0"
            />
            {!isCollapsed && (
              <span className="ml-3 font-mono font-bold text-sm tracking-tight text-white whitespace-nowrap">
                Alpha Quant
              </span>
            )}
          </div>

          {/* Plus Button */}
          <div className="px-4 mb-8 w-full flex justify-center shrink-0">
            <Link
              to="/dashboard"
              title={isCollapsed ? "New Strategy" : undefined}
              className={cn(
                "flex items-center justify-center rounded-full border transition-colors",
                isCollapsed ? "w-10 h-10" : "w-full h-10 px-4 gap-2",
                location.pathname === "/dashboard"
                  ? "border-[#a855f7] bg-[#a855f7]/10 text-[#a855f7]"
                  : "border-white/20 text-white hover:bg-white/10",
              )}
            >
              <Plus className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">New Strategy</span>
              )}
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-3 w-full px-3 flex-1 overflow-hidden">
            {NAV_ITEMS.filter((item) => {
              if (!profile.level) return true;
              if (profile.level === "Beginner") {
                return ![
                  "/sandbox",
                  "/playground",
                  "/strategy-builder",
                ].includes(item.path);
              }
              if (profile.level === "Intermediate") {
                return !["/sandbox", "/playground"].includes(item.path);
              }
              return true; // Advanced gets everything
            }).map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.name : undefined}
                  className={cn(
                    "relative flex items-center rounded-lg px-2.5 py-2 transition-all duration-200 overflow-hidden whitespace-nowrap group",
                    isActive ? "text-white" : "text-[#8e8e93] hover:text-white",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive && "text-[#a855f7]",
                    )}
                  />
                  {!isCollapsed && (
                    <span className="ml-4 text-sm font-medium">
                      {t(`nav.${item.name.toLowerCase().replace(" ", "_")}`)}
                    </span>
                  )}
                  {isActive && isCollapsed && (
                    <div className="absolute left-0 w-0.5 h-5 bg-[#a855f7] rounded-r" />
                  )}
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 w-0.5 h-6 bg-[#a855f7] rounded-r" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="flex flex-col w-full px-3 gap-3 mt-auto shrink-0 border-t border-[#1e1e20] pt-5">
            {/* <button title={isCollapsed ? "Upload" : undefined} className="relative flex items-center px-2.5 py-2 text-[#8e8e93] hover:text-white transition-all duration-200">
              <Upload className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="ml-4 text-sm font-medium">Upload</span>}
            </button> */}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expand" : "Collapse"}
              className="relative flex items-center px-2.5 py-2 text-[#8e8e93] hover:text-white transition-all duration-200"
            >
              {isCollapsed ? (
                <IndentIncrease className="h-5 w-5 shrink-0" />
              ) : (
                <IndentDecrease className="h-5 w-5 shrink-0" />
              )}
              {!isCollapsed && (
                <span className="ml-4 text-sm font-medium">Collapse</span>
              )}
            </button>

            <div className="flex justify-center w-full mt-2">
              <ThemeToggle />
              <LanguageToggle />
            </div>

            <div
              title={
                profile.age
                  ? `${profile.points} Trophies | Age: ${profile.age}`
                  : `${profile.points} Trophies`
              }
              className={cn(
                "mt-4 flex rounded-lg bg-black/40 border border-white/5 p-2 items-center justify-center hover:bg-white/10 transition-all cursor-pointer group",
                isCollapsed ? "mx-1" : "mx-4",
              )}
            >
              <Trophy className="w-5 h-5 text-yellow-500 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="h-full w-full p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
