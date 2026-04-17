import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem("theme") === "light";
  });

  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add("light-theme", "light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light-theme", "light");
      localStorage.setItem("theme", "dark");
    }
  }, [isLight]);

  return (
    <button
      onClick={() => setIsLight(!isLight)}
      className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center text-gray-400 hover:text-white"
      title="Toggle Theme"
    >
      {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
