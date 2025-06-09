import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Pill, User, ArrowRight, Clock, Bell, Heart, CheckCircle, UserRound } from "lucide-react";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Card } from "@/components/ui/card";

const Landing = () => {
  const { currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"doctor" | "patient" | null>(null);

  // Redirect logged in users to their dashboard
  const getDashboardLink = () => {
    if (!currentUser) return "/login";
    return currentUser.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard";
  };

  // Handle role selection
  const handleRoleSelect = (role: "doctor" | "patient") => {
    setSelectedRole(role);
  };

  // Hero Preview Component based on selected role
  const RolePreview = () => {
    if (selectedRole === "doctor") {
      return (
        <Card className="p-6 border border-primary/20 shadow-lg bg-card">
          <div className="mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <UserRound className="text-primary w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Портал за лекари</h3>
            <p className="text-muted-foreground">Управлявайте вашите пациенти и техните лекарствени планове с лекота</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-background rounded-lg border border-border/40">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mr-3">
                <User className="text-accent w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Управление на пациенти</p>
                <p className="text-sm text-muted-foreground">Преглед и редакция на информация за пациентите</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-background rounded-lg border border-border/40">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                <Pill className="text-primary w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Предписване на лекарства</p>
                <p className="text-sm text-muted-foreground">Създаване на персонализирани режими за лечение</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-background rounded-lg border border-border/40">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mr-3">
                <Calendar className="text-secondary w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Проследяване на състоянието</p>
                <p className="text-sm text-muted-foreground">Мониторинг на напредъка на пациентите</p>
              </div>
            </div>
          </div>
        </Card>
      );
    } else if (selectedRole === "patient") {
      return (
        <Card className="p-6 border border-secondary/20 shadow-lg bg-card">
          <div className="mb-6">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
              <Heart className="text-secondary w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2">Портал за пациенти</h3>
            <p className="text-muted-foreground">Проследявайте вашите лекарства и поддържайте здравето си</p>
          </div>
          
          {/* Redesigned medication schedule preview */}
          <div className="overflow-hidden">
            <div className="bg-primary/10 p-4 rounded-t-lg border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-card-foreground flex items-center">
                  <Calendar className="mr-2 text-primary h-5 w-5" />
                  Моите лекарства
                </h3>
                <span className="text-sm font-medium px-3 py-1 bg-primary/20 text-primary rounded-full">
                  <Clock className="inline-block mr-1 h-4 w-4" /> Днес
                </span>
              </div>
            </div>
            
            <div className="p-4 bg-background/50 rounded-b-lg border-x border-b border-border">
              {/* Morning medication */}
              <div className="mb-3 p-3 bg-background rounded-lg border border-border/80 transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center mr-3 text-secondary">
                      <Pill className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium text-card-foreground">Парацетамол</h4>
                        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full dark:bg-green-800/20 dark:text-green-400">Приет</span>
                      </div>
                      <p className="text-xs text-muted-foreground">08:00 - 1 таблетка</p>
                    </div>
                  </div>
                  <div>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </div>
              
              {/* Afternoon medication */}
              <div className="p-3 bg-background rounded-lg border border-border/80 transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 text-primary">
                      <Pill className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground">Витамин C</h4>
                      <p className="text-xs text-muted-foreground">13:00 - 1 капсула</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-primary h-8 w-8">
                    <Bell className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      );
    } else {
      return (
        <div className="hidden md:block">
          <div className="rounded-xl bg-card shadow-xl overflow-hidden border border-border/30">
            <div className="bg-primary/10 p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-card-foreground flex items-center">
                  <Calendar className="mr-2 text-primary h-5 w-5" />
                  Моите лекарства
                </h3>
                <span className="text-sm font-medium px-3 py-1 bg-primary/20 text-primary rounded-full">
                  <Clock className="inline-block mr-1 h-4 w-4" /> Днес
                </span>
              </div>
            </div>
            
            <div className="p-6">
              {/* Morning medication */}
              <div className="mb-5 p-4 bg-background rounded-lg border border-border transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mr-3 text-secondary">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium text-card-foreground">Парацетамол</h4>
                        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full dark:bg-green-800/20 dark:text-green-400">Приет</span>
                      </div>
                      <p className="text-sm text-muted-foreground">08:00 - 1 таблетка</p>
                    </div>
                  </div>
                  <div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </div>
              
              {/* Afternoon medication */}
              <div className="mb-5 p-4 bg-background rounded-lg border border-border transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3 text-primary">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground">Витамин C</h4>
                      <p className="text-sm text-muted-foreground">13:00 - 1 капсула</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-primary">
                    <Bell className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Evening medication */}
              <div className="p-4 bg-background rounded-lg border border-border transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mr-3 text-accent">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground">Магнезий</h4>
                      <p className="text-sm text-muted-foreground">20:00 - 2 таблетки</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-primary">
                    <Bell className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Navigation */}
      <nav className="bg-background shadow-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center justify-center gap-2 h-full">
                <div className="flex items-center justify-center gap-3">
                <img src="/MedPal.png" alt="MedPal Logo" height={160} width={160}  className="object-contain" />
                
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ThemeSwitcher />
              
              {currentUser ? (
                <Link to={getDashboardLink()}>
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    Табло
                  </Button>
                </Link>
              ) : (
                <div className="flex space-x-3">
                  <Link to="/login">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      Вход
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/80">
                      Регистрация
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Грижа за вашето здраве, всеки ден
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              MP ви помага да следите вашите лекарства и да поддържате здравето си с лекота и сигурност.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Button 
                className={`${selectedRole === "doctor" ? "bg-primary/90 ring-2 ring-primary/50" : "bg-primary"} text-primary-foreground hover:bg-primary/80 w-full sm:w-auto`}
                onClick={() => handleRoleSelect("doctor")}
              >
                <User className="mr-2 h-5 w-5" />
                За лекари
              </Button>
              <Button 
                className={`${selectedRole === "patient" ? "bg-secondary/90 ring-2 ring-secondary/50" : "bg-secondary"} text-secondary-foreground hover:bg-secondary/80 w-full sm:w-auto`}
                onClick={() => handleRoleSelect("patient")}
              >
                <Heart className="mr-2 h-5 w-5" />
                За пациенти
              </Button>
            </div>
          </div>
          
          {/* Dynamic Role Preview */}
          <div className="transition-all duration-300 ease-in-out">
            <RolePreview />
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="bg-card py-16 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-card-foreground mb-12">Как MED PAL помага</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background rounded-xl p-6 shadow-sm border border-border">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <User className="text-primary w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Лекари</h3>
              <p className="text-muted-foreground">Следете своите пациенти и създавайте персонализирани планове за лечение на едно място.</p>
            </div>
            
            <div className="bg-background rounded-xl p-6 shadow-sm border border-border">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
                <Heart className="text-secondary w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Пациенти</h3>
              <p className="text-muted-foreground">Получавайте напомняния за вашите лекарства и поддържайте връзка с лекуващия ви лекар.</p>
            </div>
            
            <div className="bg-background rounded-xl p-6 shadow-sm border border-border">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                <Calendar className="text-accent w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Проследяване</h3>
              <p className="text-muted-foreground">Достъпвайте историята на приетите лекарства и следете напредъка си във времето.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center">
            <div className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} MED PAL. Всички права запазени.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
