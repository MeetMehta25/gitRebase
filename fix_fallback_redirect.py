with open("src/components/layout/AppLayout.tsx", "r", encoding='utf-8') as f:
    text = f.read()

# Make redirect use window.location.pathname rather than just generic so it routes cleanly
replacement_str = """
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
    // Log the forbidden access and redirect
    console.log(`Access to ${location.pathname} blocked for profile level ${profile.level}. Redirecting.`);
    return <Navigate to="/dashboard" replace />;
  }
"""

if "console.log(`Access to ${location.pathname} blocked" not in text:
    old_str = """
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
    if old_str in text:
        text = text.replace(old_str, replacement_str)

with open("src/components/layout/AppLayout.tsx", "w", encoding='utf-8') as f:
    f.write(text)
print("Updated redirect logging")
