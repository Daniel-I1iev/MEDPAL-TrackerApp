import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LogOut, 
  Menu, 
  Users, 
  X 
} from "lucide-react";
import { useState } from "react";
import ThemeSwitcher from "@/components/ThemeSwitcher";

const DoctorNavbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-card shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <img src="/MedPal.png" alt="MedPal Logo" height={160} width={160} className="object-contain mr-2" />
            {/* <span className="text-2xl font-bold text-green-500">MED PAL</span> */}
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/doctor/dashboard" 
              className="text-card-foreground hover:text-primary px-3 py-2 rounded-md font-medium"
            >
              Начало
            </Link>
            <Link 
              to="/doctor/patients" 
              className="text-card-foreground hover:text-primary px-3 py-2 rounded-md font-medium"
            >
              Пациенти
            </Link>
            <Link 
              to="/doctor/laboratory" 
              className="text-card-foreground hover:text-primary px-3 py-2 rounded-md font-medium"
            >
              Лаборатория
            </Link>
            <Link 
              to="/doctor/profile"
              className="text-card-foreground hover:text-primary px-3 py-2 rounded-md font-medium"
            >
              Моят профил
            </Link>
            <ThemeSwitcher />
            {/* Only one avatar circle after the theme button, before the user's name */}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-4">
              <span className="text-primary-foreground font-medium text-sm">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="font-medium text-sm text-card-foreground ml-2">{currentUser?.name}</div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="ml-2 text-card-foreground hover:text-primary"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="text-card-foreground"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-card pb-3 px-4">
          <div className="flex flex-col space-y-2">
            <Link 
              to="/doctor/dashboard" 
              className="text-card-foreground hover:text-primary px-3 py-2 rounded-md font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Начало
            </Link>
            <Link 
              to="/doctor/patients" 
              className="text-card-foreground hover:text-primary px-3 py-2 rounded-md font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Пациенти
            </Link>
            <Link 
              to="/doctor/laboratory" 
              className="text-card-foreground hover:text-primary px-3 py-2 rounded-md font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Лаборатория
            </Link>
            <Link 
              to="/doctor/profile"
              className="text-card-foreground hover:text-primary px-3 py-2 rounded-md font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Моят профил
            </Link>
            <ThemeSwitcher />
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center px-3 py-2">
              <span className="text-primary-foreground font-medium text-sm">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="font-medium text-card-foreground px-3 py-2">{currentUser?.name}</div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-card-foreground hover:text-primary mt-2"
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span>Изход</span>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default DoctorNavbar;
