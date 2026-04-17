import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Workflow,
  History,
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

const NAV_ITEMS = [
  // { name: "AI Agents", path: "/dashboard", icon: BrainCircuit },
  { name: "Strategy Builder", path: "/strategy-builder", icon: Workflow },
  { name: "History", path: "/history", icon: History },
  { name: "News", path: "/news", icon: Newspaper },
  { name: "Screener", path: "/screener", icon: LineChart },
  { name: "Paper Trading", path: "/trading", icon: Wallet },
  { name: "Quant Coach", path: "/quant-coach", icon: Bot },
  { name: "Playground", path: "/playground", icon: Terminal },
  { name: "Sandbox", path: "/sandbox", icon: CodeIcon },
  //  {name : "MCP",path: "/mcp", icon: Brain}
];

export function AppLayout() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isCollapsed, setIsCollapsed] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-bg-primary">
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
              title={isCollapsed ? "New Agent" : undefined}
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
                <span className="text-sm font-medium">New Agent</span>
              )}
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-3 w-full px-3 flex-1 overflow-hidden">
            {NAV_ITEMS.map((item) => {
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
                      {item.name}
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
