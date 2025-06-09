import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import DoctorNavbar from "@/components/layout/DoctorNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, User } from "lucide-react";

const DoctorProfile = () => {
  const { currentUser } = useAuth();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    uin: "",
    specialization: "",
    hospital: "",
  });

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!currentUser) return;
      setLoading(true);
      const userRef = doc(db, "users", currentUser.id);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setDoctor({ id: userSnap.id, ...data });
        setForm({
          name: data.name || "",
          email: data.email || "",
          uin: data.uin || "",
          specialization: data.specialization || "",
          hospital: data.hospital || "",
        });
      }
      setLoading(false);
    };
    fetchDoctor();
  }, [currentUser]);

  if (loading) return <div>Зареждане...</div>;
  if (!doctor) return <div>Докторът не е намерен.</div>;

  const handleChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSave = async () => {
    if (!currentUser) return;
    await setDoc(doc(db, "users", currentUser.id), form, { merge: true });
    setEditMode(false);
    setDoctor({ ...doctor, ...form });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DoctorNavbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Моят профил</h1>
          <p className="text-muted-foreground">Управление на вашия профил</p>
        </div>
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground">
              <User className="mr-2 h-5 w-5 text-primary" />
              Лична информация
            </CardTitle>
            <CardDescription className="text-muted-foreground">Управление на вашата профилна информация</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-foreground">Име</Label>
                <Input
                  id="name"
                  value={form.name}
                  disabled={!editMode}
                  onChange={e => handleChange("name", e.target.value)}
                  className="mt-1 bg-card text-foreground border-border"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-foreground">Имейл</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  disabled
                  className="mt-1 bg-card text-foreground border-border"
                />
              </div>
              <div>
                <Label htmlFor="uin" className="text-foreground">УИН</Label>
                <Input
                  id="uin"
                  value={form.uin}
                  disabled={!editMode}
                  onChange={e => handleChange("uin", e.target.value)}
                  className="mt-1 bg-card text-foreground border-border"
                />
              </div>
              <div>
                <Label htmlFor="specialization" className="text-foreground">Специалност</Label>
                <Input
                  id="specialization"
                  value={form.specialization}
                  disabled={!editMode}
                  onChange={e => handleChange("specialization", e.target.value)}
                  className="mt-1 bg-card text-foreground border-border"
                />
              </div>
              <div>
                <Label htmlFor="hospital" className="text-foreground">Болница</Label>
                <Input
                  id="hospital"
                  value={form.hospital}
                  disabled={!editMode}
                  onChange={e => handleChange("hospital", e.target.value)}
                  className="mt-1 bg-card text-foreground border-border"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-2">
              {editMode ? (
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>
                  <Save className="mr-2 h-5 w-5" />Запази промените
                </Button>
              ) : (
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setEditMode(true)}>
                  Редактирай
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorProfile;
