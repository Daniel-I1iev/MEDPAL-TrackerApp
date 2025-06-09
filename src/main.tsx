
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';

// Ensure dark mode works with SSR by applying theme class to html element immediately
const setInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Apply the resolved theme
  if (savedTheme === 'dark' || (savedTheme === 'system' && prefersDark) || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('bg-background', 'text-foreground');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.add('bg-background', 'text-foreground');
  }
};

// Run the function before React hydration
if (typeof window !== 'undefined') {
  setInitialTheme();
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
