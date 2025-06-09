import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, User, Pill, Upload } from "lucide-react";
import { UserRole } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Register = () => {
  const navigate = useNavigate();
  const { register: authRegister, currentUser } = useAuth();
  const { toast } = useToast();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uin, setUin] = useState("");
  
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
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setProfilePicture(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
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
    
    if (selectedRole === "doctor" && !uin.trim()) {
      toast({
        title: "Липсва УИН",
        description: "Моля, въведете вашия УИН (Уникален Идентификационен Номер)",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Грешка при парола",
        description: "Паролите не съвпадат",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await authRegister(name, email, password, selectedRole, profilePicture || undefined, selectedRole === "doctor" ? uin : undefined);
      
      // Navigate based on role
      if (selectedRole === "doctor") {
        navigate("/doctor/dashboard");
      } else {
        navigate("/patient/dashboard");
      }
    } catch (error) {
      toast({
        title: "Грешка при регистрация",
        description: "Възникна проблем при създаването на акаунт",
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
              <img src="/MedPal.png" alt="MedPal Logo" height={160} width={160}  className="object-contain" />
            </Link>
          </div>
        </div>
      </header>
      
      {/* Registration form */}
      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-card rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Създаване на акаунт</h2>
            <p className="text-muted-foreground mt-2">
              Създайте своя акаунт в Медикамент Трекер
            </p>
          </div>
          
          {/* Profile picture upload */}
          <div className="mb-6 flex flex-col items-center">
            <Label className="mb-2">Профилна снимка</Label>
            <div className="relative group cursor-pointer mb-2">
              <Avatar className="h-20 w-20 mx-auto">
                {profilePicture ? (
                  <AvatarImage src={profilePicture} alt="Профилна снимка" />
                ) : (
                  <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                    {name ? name.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <Input 
                id="profilePicture" 
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-xs text-muted-foreground">Кликнете за качване на снимка</p>
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
              <Label htmlFor="name">Име</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
                required
                placeholder="Въведете вашето име"
              />
            </div>
            
            <div className="mb-4">
              <Label htmlFor="email">Имейл</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                required
                placeholder="example@mail.com"
              />
            </div>
            
            <div className="mb-4">
              <Label htmlFor="password">Парола</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                required
                placeholder="Въведете парола"
              />
            </div>
            
            <div className="mb-6">
              <Label htmlFor="confirmPassword">Потвърждение на паролата</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
                required
                placeholder="Потвърдете паролата"
              />
            </div>

            {selectedRole === "doctor" && (
              <div className="mb-4">
                <Label htmlFor="uin">УИН (Уникален Идентификационен Номер)</Label>
                <Input
                  id="uin"
                  type="text"
                  value={uin}
                  onChange={(e) => setUin(e.target.value)}
                  className="mt-1"
                  required={selectedRole === "doctor"}
                  placeholder="Въведете вашия УИН"
                />
              </div>
            )}
            
            <Button 
              type="submit"
              className="w-full bg-healthcare-primary text-white hover:bg-healthcare-secondary"
              disabled={isLoading}
            >
              {isLoading ? "Регистриране..." : "Регистрация"}
            </Button>
          </form>
          
          <div className="text-center mt-4">
            <p className="text-muted-foreground">
              Вече имате акаунт?{" "}
              <Link to="/login" className="text-healthcare-primary hover:underline">
                Влезте тук
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-4 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} Медикамент Трекер. Всички права запазени.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Register;
