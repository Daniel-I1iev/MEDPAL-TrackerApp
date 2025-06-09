import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if user has previously saved theme preference
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as Theme;
      
      // If saved theme is valid, return it
      if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
        return savedTheme;
      }
    }
    
    // Default to system
    return "system";
  });
  
  // Track the resolved theme (actual light/dark value after system preference is applied)
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    // If theme is explicitly set to light/dark, use that
    if (theme === "light" || theme === "dark") return theme;
    
    // Otherwise check system preference
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    
    return "light"; // Safe default
  });

  // Toggle theme function - cycle through light, dark, system
  const toggleTheme = () => {
    setTheme(current => {
      if (current === "light") return "dark";
      if (current === "dark") return "system";
      return "light";
    });
  };

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = () => {
      if (theme === "system") {
        setResolvedTheme(mediaQuery.matches ? "dark" : "light");
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Update resolved theme when theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (theme === "system") {
      setResolvedTheme(
        window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      );
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Save theme preference to localStorage
    localStorage.setItem("theme", theme);
    
    // Apply theme class to document
    const root = document.documentElement;
    
    // Remove all theme classes first
    root.classList.remove("light", "dark");
    
    // Add the resolved theme class
    root.classList.add(resolvedTheme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        resolvedTheme === "dark" ? "#1A1F2C" : "#ffffff"
      );
    }
  }, [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
