import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const ThemeSwitcher = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="focus:outline-none">
            {resolvedTheme === "light" && <Sun className="h-5 w-5" />}
            {resolvedTheme === "dark" && <Moon className="h-5 w-5" />}
            {theme === "system" && <Monitor className="h-5 w-5" />}
            <span className="sr-only">Превключване на тема</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background border-border">
          <DropdownMenuItem 
            onClick={() => setTheme("light")}
            className={`flex items-center cursor-pointer ${theme === "light" ? "bg-muted" : ""}`}
          >
            <Sun className="mr-2 h-4 w-4" />
            <span>Светла</span>
            {theme === "light" && <span className="ml-auto font-bold">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme("dark")}
            className={`flex items-center cursor-pointer ${theme === "dark" ? "bg-muted" : ""}`}
          >
            <Moon className="mr-2 h-4 w-4" />
            <span>Тъмна</span>
            {theme === "dark" && <span className="ml-auto font-bold">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme("system")}
            className={`flex items-center cursor-pointer ${theme === "system" ? "bg-muted" : ""}`}
          >
            <Monitor className="mr-2 h-4 w-4" />
            <span>Системна</span>
            {theme === "system" && <span className="ml-auto font-bold">✓</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ThemeSwitcher;
