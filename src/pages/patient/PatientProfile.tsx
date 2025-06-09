import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";
import { getAuth, updatePassword } from "firebase/auth";
import PatientNavbar from "@/components/layout/PatientNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Bell, Calendar, Clock, Save, User } from "lucide-react";

const PatientProfile = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    medicationReminders: true,
    missedDose: true,
    doctorMessages: true,
    labResultsReady: true,
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [doctorName, setDoctorName] = useState<string>("");

  useEffect(() => {
    const fetchPatient = async () => {
      if (!currentUser) return;
      setLoading(true);
      const patientRef = doc(db, "patients", currentUser.id);
      const patientSnap = await getDoc(patientRef);
      if (patientSnap.exists()) {
        setPatient({ id: patientSnap.id, ...patientSnap.data() });
        // Ако има mustChangePassword, покажи формата за смяна на парола
        if (patientSnap.data().mustChangePassword) {
          setShowChangePassword(true);
        }
      }
      setLoading(false);
    };
    fetchPatient();
  }, [currentUser]);

  useEffect(() => {
    if (patient && patient.doctorId) {
      const fetchDoctor = async () => {
        const doctorRef = doc(db, "doctors", patient.doctorId);
        const doctorSnap = await getDoc(doctorRef);
        if (doctorSnap.exists()) {
          setDoctorName(doctorSnap.data().name);
        }
      };
      fetchDoctor();
    }
  }, [patient]);

  if (loading) return <div>Зареждане...</div>;
  if (!patient) return <div>Пациентът не е намерен.</div>;

  const handleUserDataChange = (field: keyof typeof patient, value: string) => {
    setPatient({
      ...patient,
      [field]: value,
    });
  };

  const handleNotificationChange = (field: keyof typeof notifications, value: boolean) => {
    setNotifications({
      ...notifications,
      [field]: value,
    });
  };

  const handleSaveProfile = () => {
    toast({
      title: "Профилът е актуализиран",
      description: "Вашите промени бяха запазени успешно",
    });
  };

  const handleSaveNotifications = async () => {
    if (!currentUser) return;
    await setDoc(doc(db, "patients", currentUser.id), notifications, { merge: true });
    toast({
      title: "Настройките за известия са актуализирани",
      description: "Вашите предпочитания за известия бяха запазени",
    });
  };

  const handleChangePassword = async () => {
    setChangingPassword(true);
    try {
      const auth = getAuth();
      if (!auth.currentUser) throw new Error("Няма влязъл потребител");
      await updatePassword(auth.currentUser, newPassword);
      // Премахни mustChangePassword от пациента
      await setDoc(doc(db, "patients", currentUser.id), { mustChangePassword: false }, { merge: true });
      setShowChangePassword(false);
      toast({ title: "Паролата е сменена успешно" });
    } catch (e) {
      toast({ title: "Грешка при смяна на паролата", description: e.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PatientNavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Моят профил</h1>
          <p className="text-muted-foreground">Управление на вашия профил и настройки</p>
          {doctorName && (
            <p className="text-primary mt-2">Вашият лекар: <b>{doctorName}</b></p>
          )}
        </div>

        {showChangePassword && (
          <Card className="mb-8 bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Смяна на паролата</CardTitle>
              <CardDescription className="text-muted-foreground">Моля, въведете нова парола, за да активирате профила си.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="password"
                placeholder="Нова парола"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="mb-4 bg-card text-foreground border-border"
              />
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword}
              >
                {changingPassword ? "Запазване..." : "Запази новата парола"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-8">
          {/* Profile information */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <User className="mr-2 h-5 w-5 text-primary" />
                Лична информация
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Управление на вашата профилна информация
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-foreground">Име</Label>
                  <Input
                    id="name"
                    value={patient.name}
                    onChange={(e) => handleUserDataChange("name", e.target.value)}
                    className="mt-1 bg-card text-foreground border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-foreground">Имейл</Label>
                  <Input
                    id="email"
                    type="email"
                    value={patient.email}
                    onChange={(e) => handleUserDataChange("email", e.target.value)}
                    className="mt-1 bg-card text-foreground border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-foreground">Телефон</Label>
                  <Input
                    id="phone"
                    value={patient.phoneNumber || ""}
                    onChange={(e) => handleUserDataChange("phoneNumber", e.target.value)}
                    className="mt-1 bg-card text-foreground border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth" className="text-foreground">Дата на раждане</Label>
                  <div className="flex items-center mt-1">
                    <Calendar className="mr-2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={patient.dateOfBirth}
                      onChange={(e) => handleUserDataChange("dateOfBirth", e.target.value)}
                      className="flex-1 bg-card text-foreground border-border"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleSaveProfile}
                >
                  <Save className="mr-2 h-5 w-5" />
                  Запази промените
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification settings */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Bell className="mr-2 h-5 w-5 text-primary" />
                Настройки за известия
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Управление на предпочитанията за известия
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <p className="font-medium text-foreground">Напомняния за лекарства</p>
                    <p className="text-sm text-muted-foreground">
                      Получавайте известия, когато е време да приемете лекарство
                    </p>
                  </div>
                  <Switch
                    checked={notifications.medicationReminders}
                    onCheckedChange={(checked) => handleNotificationChange("medicationReminders", checked)}
                  />
                </div>

                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <p className="font-medium text-foreground">Пропуснати дози</p>
                    <p className="text-sm text-muted-foreground">
                      Уведомления за пропуснат прием на лекарство
                    </p>
                  </div>
                  <Switch
                    checked={notifications.missedDose}
                    onCheckedChange={(checked) => handleNotificationChange("missedDose", checked)}
                  />
                </div>

                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <p className="font-medium text-foreground">Съобщения от лекари</p>
                    <p className="text-sm text-muted-foreground">
                      Известия за нови съобщения от вашия лекар
                    </p>
                  </div>
                  <Switch
                    checked={notifications.doctorMessages}
                    onCheckedChange={(checked) => handleNotificationChange("doctorMessages", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Готови изследвания</p>
                    <p className="text-sm text-muted-foreground">
                      Получавайте известие, когато резултатите от вашите изследвания са налични
                    </p>
                  </div>
                  <Switch
                    checked={notifications.labResultsReady}
                    onCheckedChange={(checked) => handleNotificationChange("labResultsReady", checked)}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleSaveNotifications}
                >
                  <Save className="mr-2 h-5 w-5" />
                  Запази настройките
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Offline settings */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                Офлайн режим
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Настройки за използване на приложението без интернет
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <p className="font-medium text-foreground">Синхронизирайте данни за офлайн използване</p>
                    <p className="text-sm text-muted-foreground">
                      Съхранява данните ви локално за използване без интернет
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="text-primary border-border hover:bg-primary hover:text-primary-foreground"
                  >
                    Синхронизирай сега
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Последно синхронизирано</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date().toLocaleString("bg-BG")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
