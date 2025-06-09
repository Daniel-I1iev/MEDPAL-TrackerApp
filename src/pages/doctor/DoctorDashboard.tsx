import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, getDocs, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/contexts/AuthContext";
import DoctorNavbar from "@/components/layout/DoctorNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Patient } from "@/models/types";
import { Calendar, Users, Pill, Plus, Heart, ArrowRight } from "lucide-react";
import DoctorChatWidget from "@/components/doctor/DoctorChatWidget";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("patients");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [adherence, setAdherence] = useState<number>(0);
  const [recentActions, setRecentActions] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "patients"), where("doctorId", "==", currentUser.id));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const patientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Patient[];
      setPatients(patientsData);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const medsQ = query(collection(db, "medications"), where("doctorId", "==", currentUser.id));
    const unsubscribe = onSnapshot(medsQ, async (medsSnap) => {
      const meds = medsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((med: any) => !med.takenByPatient); // показвай само лекарства, които не са взети от пациента
      setMedications(meds);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchAdherence = async () => {
      const intakeQuery = query(collection(db, "medicationIntake"), where("doctorId", "==", currentUser.id));
      const intakeSnapshot = await getDocs(intakeQuery);
      const intakes = intakeSnapshot.docs.map(doc => doc.data());
      const total = intakes.length;
      const taken = intakes.filter((i: any) => i.takenTime && !i.skipped).length;
      setAdherence(total > 0 ? Math.round((taken / total) * 100) : 0);
    };
    fetchAdherence();
  }, [currentUser, patients, medications]);

  useEffect(() => {
    if (!currentUser) return;
    // Listen for completed medications for all patients
    const completedMedicationsUnsub = onSnapshot(
      query(collection(db, "medicationIntake")),
      (snapshot) => {
        // Collect all completed medication IDs (with at least one takenTime)
        const completedIds = new Set<string>();
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.takenTime && data.medicationId) {
            completedIds.add(data.medicationId);
          }
        });
        setMedications(prev => prev.filter((med: any) => !completedIds.has(med.id)));
      }
    );
    return () => completedMedicationsUnsub();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    // Последни лекарства
    const medsQ = query(collection(db, "medications"), where("doctorId", "==", currentUser.id));
    const unsubMeds = onSnapshot(medsQ, (medsSnap) => {
      const meds = medsSnap.docs.map(doc => ({
        type: "medication",
        id: doc.id,
        name: doc.data().name,
        patientId: doc.data().patientId,
        createdAt: doc.data().createdAt || doc.data().timestamp || doc.data().createdAt || null
      }));
      setRecentActions(prev => {
        // Съхранявай само последните 10 действия
        const filtered = prev.filter(a => a.type !== "medication");
        return [...filtered, ...meds].slice(-10);
      });
    });
    // Последни приети лекарства
    const intakeQ = query(collection(db, "medicationIntake"), where("doctorId", "==", currentUser.id));
    const unsubIntake = onSnapshot(intakeQ, (snap) => {
      const intakes = snap.docs.filter(doc => doc.data().takenTime).map(doc => ({
        type: "intake",
        id: doc.id,
        patientId: doc.data().patientId,
        medicationId: doc.data().medicationId,
        takenTime: doc.data().takenTime
      }));
      setRecentActions(prev => {
        const filtered = prev.filter(a => a.type !== "intake");
        return [...filtered, ...intakes].slice(-10);
      });
    });
    // Последни съобщения
    const chatsQ = query(collection(db, "chats"));
    const unsubChats = onSnapshot(chatsQ, (chatsSnap) => {
      let messages: any[] = [];
      chatsSnap.docs.forEach(chatDoc => {
        const chatId = chatDoc.id;
        const messagesQ = collection(db, "chats", chatId, "messages");
        onSnapshot(messagesQ, (msgSnap) => {
          msgSnap.docs.forEach(msgDoc => {
            const data = msgDoc.data();
            if (data.from === "patient") {
              messages.push({
                type: "message",
                id: msgDoc.id,
                patientId: data.patientId,
                text: data.text,
                timestamp: data.timestamp
              });
            }
          });
          setRecentActions(prev => {
            const filtered = prev.filter(a => a.type !== "message");
            return [...filtered, ...messages].slice(-10);
          });
        });
      });
    });
    return () => {
      unsubMeds();
      unsubIntake();
      unsubChats();
    };
  }, [currentUser]);

  const totalPatients = patients.length;

  const today = new Date().toLocaleDateString("bg-BG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DoctorNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Добре дошли, {currentUser?.name ? currentUser.name : "Доктор"}
          </h1>
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-foreground">
                <Users className="mr-2 h-5 w-5 text-primary" />
                Пациенти
              </CardTitle>
              <CardDescription className="text-muted-foreground">Общ брой пациенти</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{totalPatients}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-foreground">
                <Pill className="mr-2 h-5 w-5 text-accent" />
                Предписани лекарства
              </CardTitle>
              <CardDescription className="text-muted-foreground">Общ брой лекарства</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{medications.length}</p>
              <p className="text-sm text-muted-foreground mt-2">
                
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-foreground">
                <Heart className="mr-2 h-5 w-5 text-primary" />
                Последни действия
              </CardTitle>
              <CardDescription className="text-muted-foreground"></CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-foreground space-y-2">
                {recentActions.length === 0 && <li>Няма действия.</li>}
                {recentActions.slice(-5).map((action, idx) => {
                  if (action.type === "medication") {
                    const patient = patients.find(p => p.id === action.patientId);
                    return <li key={action.id + idx}>✓ Добавено ново лекарство <b>{action.name}</b> за {patient ? patient.name : 'пациент'}</li>;
                  }
                  if (action.type === "intake") {
                    const patient = patients.find(p => p.id === action.patientId);
                    return <li key={action.id + idx}>✓ Пациент {patient ? patient.name : 'пациент'} е приел лекарството си</li>;
                  }
                  if (action.type === "message") {
                    const patient = patients.find(p => p.id === action.patientId);
                    return <li key={action.id + idx}>✓ Пациент {patient ? patient.name : 'пациент'} е изпратил съобщение: <span className="italic">{action.text.slice(0, 30)}{action.text.length > 30 ? '...' : ''}</span></li>;
                  }
                  return null;
                })}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Tabs 
          defaultValue="patients" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mb-8"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="patients">Пациенти</TabsTrigger>
            <TabsTrigger value="medications">Лекарства</TabsTrigger>
          </TabsList>

          <TabsContent value="patients">
            <Card className="bg-card border border-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-foreground">Всички пациенти</CardTitle>
                    <CardDescription className="text-muted-foreground">Управление на вашите пациенти</CardDescription>
                  </div>
                  <Button
                    onClick={() => navigate("/doctor/patients/add")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Нов пациент
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patients.map((patient) => (
                    <div 
                      key={patient.id} 
                      className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
                    >
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3">
                          <span className="text-primary-foreground font-medium">
                            {patient.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{patient.name}</p>
                          <p className="text-sm text-muted-foreground">{patient.phoneNumber}</p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Състояния: </span>
                          <span className="font-medium text-foreground">{patient.medicalConditions?.join(", ")}</span>
                        </p>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => navigate(`/doctor/medications/add/${patient.id}`)}
                        >
                          Добави лекарство
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medications">
            <Card className="bg-card border border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Всички лекарства</CardTitle>
                <CardDescription className="text-muted-foreground">Предписани лекарства за вашите пациенти</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medications.map((medication) => {
                    const patient = patients.find(p => p.id === medication.patientId);
                    return (
                      <div key={medication.id} className="border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between hover:shadow-md transition-shadow bg-card">
                        <div>
                          <p className="font-medium text-foreground">{medication.name}</p>
                          <p className="text-sm text-muted-foreground mb-1">{medication.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Пациент: <span className="font-medium text-primary">{patient ? patient.name : 'Неизвестен пациент'}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <DoctorChatWidget patients={patients} currentUser={currentUser} />
    </div>
  );
};

export default DoctorDashboard;
