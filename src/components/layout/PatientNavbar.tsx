import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Calendar, 
  LogOut, 
  Menu, 
  X, 
  Bell 
} from "lucide-react";
import { useState, useEffect } from "react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";

const PatientNavbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { permission, requestPermission, message } = useNotifications(currentUser?.id);

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

  // Fetch recent notifications from Firestore
  useEffect(() => {
    if (!currentUser?.id) return;
    const notifRef = collection(db, "patients", currentUser.id, "notifications");
    const q = query(notifRef, orderBy("timestamp", "desc"), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      // Use 'any' for notification type to avoid TS property errors
      const notifs = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setNotifications(notifs);
      // Defensive: treat as unread if 'read' property is present and false, or if 'read' is not present but notification is less than 30 days old
      const now = Date.now();
      setUnreadCount(
        notifs.filter((n: any) => {
          if (typeof n.read === 'boolean') return n.read === false;
          if (n.timestamp) {
            const ts = n.timestamp.seconds ? n.timestamp.seconds * 1000 : n.timestamp;
            return now - ts < 30 * 24 * 60 * 60 * 1000;
          }
          return false;
        }).length
      );
    });
    return () => unsub();
  }, [currentUser]);

  // Optionally, handle in-app notification popups
  useEffect(() => {
    if (message && message.notification) {
      // Optionally show a toast or popup
    }
  }, [message]);

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
              to="/patient/dashboard" 
              className="text-card-foreground hover:text-primary px-3 py-2 rounded-md font-medium"
            >
              Начало
            </Link>
            <Link 
              to="/patient/medications" 
              className="text-card-foreground hover:text-primary px-3 py-2 rounded-md font-medium"
            >
              Лекарства
            </Link>
            <Link 
              to="/patient/lab-results" 
              className="text-card-foreground hover:text-primary px-3 py-2 rounded-md font-medium"
            >
              Моите изследвания
            </Link>
            <Link 
              to="/patient/profile" 
              className="text-card-foreground hover:text-primary px-3 py-2 rounded-md font-medium"
            >
              Профил
            </Link>
            <ThemeSwitcher />
            {/* Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative ml-4 focus:outline-none">
                  <Bell className="w-6 h-6 text-card-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">{unreadCount}</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Последни известия</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 && (
                  <DropdownMenuItem disabled>Няма нови известия</DropdownMenuItem>
                )}
                {notifications.map((notif) => (
                  <DropdownMenuItem key={notif.id} className={!notif.read ? "font-bold" : ""}>
                    <div>
                      <div>{notif.title || notif.type || "Известие"}</div>
                      <div className="text-xs text-muted-foreground">{notif.body || notif.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">{notif.timestamp ? new Date(notif.timestamp.seconds ? notif.timestamp.seconds * 1000 : notif.timestamp).toLocaleString() : ""}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
              to="/patient/dashboard" 
              className="text-card-foreground hover:text-primary px-3 py-2 rounded-md font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Начало
            </Link>
            <Link 
              to="/patient/medications" 
              className="text-card-foreground hover:text-primary px-3 py-2 rounded-md font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Лекарства
            </Link>
            <Link 
              to="/patient/lab-results" 
              className="text-card-foreground hover:text-primary px-3 py-2 rounded-md font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Моите изследвания
            </Link>
            <Link 
              to="/patient/profile" 
              className="text-card-foreground hover:text-primary px-3 py-2 rounded-md font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Профил
            </Link>
            <ThemeSwitcher />
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
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

export default PatientNavbar;
