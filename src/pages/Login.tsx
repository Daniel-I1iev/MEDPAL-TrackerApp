import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, User, Pill } from "lucide-react";
import { UserRole } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, currentUser } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // Check if a role was specified in the query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get("role") as UserRole | null;
    
    if (roleParam && (roleParam === "doctor" || roleParam === "patient")) {
      setSelectedRole(roleParam);
    }
  }, [location.search]);
  
  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "doctor") {
        navigate("/doctor/dashboard");
      } else {
        navigate("/patient/dashboard");
      }
    }
  }, [currentUser, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast({
        title: "Изберете роля",
        description: "Моля, изберете дали сте лекар или пациент",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await login(email, password, selectedRole);
      
      // Navigate based on role
      if (selectedRole === "doctor") {
        navigate("/doctor/dashboard");
      } else {
        navigate("/patient/dashboard");
      }
    } catch (error) {
      toast({
        title: "Грешка при вход",
        description: "Невалиден имейл или парола",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b bg-background shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/" className="flex items-center">
              <img src="/MedPal.png" alt="MedPal Logo" height={160} width={160} className="object-contain" />
            </Link>
          </div>
        </div>
      </header>
      
      {/* Login form */}
      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-card rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">Вход в системата</h2>
            <p className="text-muted-foreground mt-2">
              Въведете вашите данни за вход
            </p>
          </div>
          
          {/* Role selection */}
          <div className="mb-6">
            <Label className="block mb-2">Аз съм:</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={selectedRole === "doctor" ? "default" : "outline"}
                className={selectedRole === "doctor" ? "bg-healthcare-primary text-white" : "border-healthcare-primary text-healthcare-primary"}
                onClick={() => setSelectedRole("doctor")}
              >
                <User className="mr-2 h-5 w-5" />
                Лекар
              </Button>
              <Button
                type="button"
                variant={selectedRole === "patient" ? "default" : "outline"}
                className={selectedRole === "patient" ? "bg-healthcare-accent text-white" : "border-healthcare-accent text-healthcare-accent"}
                onClick={() => setSelectedRole("patient")}
              >
                <Pill className="mr-2 h-5 w-5" />
                Пациент
              </Button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Label htmlFor="email">Имейл</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-card text-foreground border border-input placeholder:text-muted-foreground focus:ring-healthcare-primary"
                required
                placeholder={selectedRole === "doctor" ? "doctor@example.com" : "patient@example.com"}
              />
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Парола</Label>
                <a href="#" className="text-sm text-healthcare-primary hover:underline">
                  Забравена парола?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-card text-foreground border border-input placeholder:text-muted-foreground focus:ring-healthcare-primary"
                required
                placeholder="password"
              />
            </div>
            
            <Button 
              type="submit"
              className="w-full bg-healthcare-primary text-white hover:bg-healthcare-secondary"
              disabled={isLoading}
            >
              {isLoading ? "Влизане..." : "Вход"}
            </Button>
          </form>
          
          <div className="text-center mt-4">
            <p className="text-gray-600">
              Нямате акаунт?{" "}
              <Link to="/register" className="text-healthcare-primary hover:underline">
                Регистрирайте се
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-4 border-t bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} Медикамент Трекер. Всички права запазени.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
