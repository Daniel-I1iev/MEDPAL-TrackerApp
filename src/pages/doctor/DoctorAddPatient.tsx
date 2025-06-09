import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorNavbar from "@/components/layout/DoctorNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Calendar, Plus, X } from "lucide-react";
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const DoctorAddPatient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [condition, setCondition] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [tempPassword, setTempPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [availablePatients, setAvailablePatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    if (mode !== 'existing') return;
    setLoadingPatients(true);
    const fetchAvailablePatients = async () => {
      const q = query(collection(db, "patients"), where("doctorId", "==", ""));
      const querySnapshot = await getDocs(q);
      setAvailablePatients(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingPatients(false);
    };
    fetchAvailablePatients();
  }, [mode]);

  const addCondition = () => {
    if (condition.trim() && !conditions.includes(condition.trim())) {
      setConditions([...conditions, condition.trim()]);
      setCondition("");
    }
  };

  const removeCondition = (conditionToRemove: string) => {
    setConditions(conditions.filter(c => c !== conditionToRemove));
  };

  const handleAddExistingPatient = async (patientId: string, patientName: string) => {
    if (!currentUser) return;
    await updateDoc(doc(db, "patients", patientId), { doctorId: currentUser.id });
    toast({ title: "Пациентът е асоцииран", description: `${patientName} беше добавен към вашия списък.` });
    navigate("/doctor/patients");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Грешка при валидация",
        description: "Името е задължително",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Грешка при валидация",
        description: "Имейлът е задължителен",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const q = query(collection(db, "patients"), where("email", "==", email));
      const patientQuery = await getDocs(q);
      if (patientQuery.size > 0) {
        const patientDoc = patientQuery.docs[0];
        await updateDoc(doc(db, "patients", patientDoc.id), { doctorId: currentUser.id });
        toast({ title: "Пациентът е асоцииран", description: `${name} беше добавен към вашия списък.` });
        navigate("/doctor/patients");
        return;
      }

      const generatedPassword = Math.random().toString(36).slice(-8);
      setTempPassword(generatedPassword);
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, generatedPassword);
      const userId = userCredential.user.uid;

      await setDoc(doc(db, "patients", userId), {
        name,
        email,
        phoneNumber: phone,
        dateOfBirth,
        medicalConditions: conditions,
        notes,
        doctorId: currentUser.id,
        createdAt: new Date().toISOString(),
        mustChangePassword: true,
      });

      toast({
        title: "Пациентът е създаден",
        description: `Временна парола: ${generatedPassword}`,
      });
      navigate("/doctor/patients");
    } catch (error) {
      toast({
        title: "Грешка при добавяне",
        description: "Възникна проблем при добавянето на пациента.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DoctorNavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate("/doctor/patients")}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Обратно към пациенти
          </Button>

          <h1 className="text-2xl font-bold text-foreground">Добавяне на нов пациент</h1>
          <p className="text-muted-foreground">Въведете информация за новия пациент</p>
        </div>

        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Информация за пациента</CardTitle>
            <CardDescription className="text-muted-foreground">Всички полета, маркирани с * са задължителни</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-4">
              <Button type="button" variant={mode === 'existing' ? 'default' : 'outline'} onClick={() => setMode('existing')}>Добави регистриран пациент</Button>
              <Button type="button" variant={mode === 'new' ? 'default' : 'outline'} onClick={() => setMode('new')}>Създай нов пациент</Button>
            </div>
            {mode === 'existing' ? (
              <div>
                <h2 className="text-lg font-semibold mb-2 text-foreground">Съществуващи пациенти без лекар</h2>
                {loadingPatients ? (
                  <div className="text-muted-foreground">Зареждане...</div>
                ) : availablePatients.length === 0 ? (
                  <div className="text-muted-foreground">Няма налични пациенти за добавяне.</div>
                ) : (
                  <ul className="divide-y divide-border mb-6">
                    {availablePatients.map((p) => (
                      <li key={p.id} className="flex items-center justify-between py-2">
                        <div>
                          <span className="font-medium text-foreground">{p.name}</span>
                          <span className="ml-2 text-muted-foreground text-sm">{p.email}</span>
                        </div>
                        <Button size="sm" onClick={() => handleAddExistingPatient(p.id, p.name)}>
                          Добави
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="flex items-center text-foreground">
                        Име *
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Въведете име на пациента"
                        required
                        className="mt-1 bg-card text-foreground border-border"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-foreground">Имейл *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@mail.com"
                        required
                        className="mt-1 bg-card text-foreground border-border"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-foreground">Телефон</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="088xxxxxxx"
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
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="flex-1 bg-card text-foreground border-border"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="conditions" className="text-foreground">Медицински състояния</Label>
                      <div className="flex items-center mt-1">
                        <Input
                          id="conditions"
                          value={condition}
                          onChange={(e) => setCondition(e.target.value)}
                          placeholder="Въведете състояние"
                          className="flex-1 bg-card text-foreground border-border"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCondition();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="ml-2 border-border text-foreground hover:bg-primary hover:text-primary-foreground"
                          onClick={addCondition}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {conditions.map((c, index) => (
                          <div 
                            key={index} 
                            className="flex items-center bg-muted px-3 py-1 rounded-full"
                          >
                            <span className="text-foreground text-sm">{c}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0 ml-1 text-muted-foreground hover:text-primary"
                              onClick={() => removeCondition(c)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-foreground">Бележки</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Въведете допълнителна информация за пациента"
                        className="mt-1 resize-none bg-card text-foreground border-border"
                        rows={5}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-border text-foreground"
                    onClick={() => navigate("/doctor/patients")}
                  >
                    Отказ
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={isCreating}
                  >
                    {isCreating ? "Добавяне..." : mode === 'new' ? "Създай пациент" : "Добави пациент"}
                  </Button>
                </div>
                {tempPassword && (
                  <div className="mt-4 text-sm text-primary">Временна парола за пациента: <b>{tempPassword}</b></div>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorAddPatient;
