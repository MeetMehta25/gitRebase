with open("src/components/layout/AppLayout.tsx", "r", encoding='utf-8') as f:
    content = f.read()

import_nav = 'import { Link, Outlet, useLocation, Navigate } from "react-router-dom";'
content = content.replace('import { Link, Outlet, useLocation } from "react-router-dom";', import_nav)

redirect_logic = """
  // Route Protection Logic
  const isActivePathRestricted = () => {
    if (!profile.level) return false; // Allow until profile setup
    if (profile.level === 'Beginner') {
      return ['/sandbox', '/playground', '/strategy-builder'].includes(location.pathname);
    }
    if (profile.level === 'Intermediate') {
      return ['/sandbox', '/playground'].includes(location.pathname);
    }
    return false;
  };

  if (isActivePathRestricted()) {
    return <Navigate to="/dashboard" replace />;
  }
"""

if "isActivePathRestricted" not in content:
    target = "  const { profile, updateProfile, showGamificationToast } = useProfile();"
    content = content.replace(target, target + "\n" + redirect_logic)

with open("src/components/layout/AppLayout.tsx", "w", encoding='utf-8') as f:
    f.write(content)

