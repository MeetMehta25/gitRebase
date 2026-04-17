import { Link } from "react-router-dom";
import logo from '../assets/logo.png';
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  return (
    <div className="absolute top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between 
      w-full max-w-4xl h-14 px-8 
      bg-[#0F0F13]/90 backdrop-blur-xl 
      border border-white/10 rounded-full shadow-2xl">

        {/* Logo */}
        <div className="flex items-center gap-8">
          <img src={logo} alt="Alpha Quant Logo" className="w-8 h-8 object-contain" />

          <span className="font-mono font-semibold text-sm tracking-tight text-white whitespace-nowrap -ml-6">
            Alpha Quant
          </span>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-mono text-gray-400">
          <a href="#" className="hover:text-[#FACC15] transition-colors">
            Features
          </a>
          <a href="#" className="hover:text-[#FACC15] transition-colors">
            How It Works
          </a>
          <a href="#" className="hover:text-[#FACC15] transition-colors">
            Pricing
          </a>
          <a href="#" className="hover:text-[#FACC15] transition-colors">
            Docs
          </a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link to="/login" className="text-sm font-mono font-semibold text-white hover:text-[#FACC15] transition-colors">
            Login
          </Link>
        </div>

      </nav>
    </div>
  );
}
