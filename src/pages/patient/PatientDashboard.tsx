import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, doc, getDoc, setDoc, addDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import PatientNavbar from "@/components/layout/PatientNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { MedicationIntake } from "@/models/types";
import { Calendar, CheckCircle, Clock, Info, Pill, XCircle } from "lucide-react";
import { usePatientMedications } from "@/hooks/usePatientMedications";
import PatientChatWidget from "@/components/patient/PatientChatWidget";

const PatientDashboard = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { medications, loading, doctors } = usePatientMedications();
  const [notifications, setNotifications] = useState({
    medicationReminders: true,
    missedDose: true,
    doctorMessages: true,
    appointmentReminders: true,
  });
  const [patient, setPatient] = useState(null);
  const [intakes, setIntakes] = useState<MedicationIntake[]>([]);
  const [skippedHistory, setSkippedHistory] = useState<{medicationName: string, skippedAt: string, endDate: string}[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    // Real-time listener for medicationIntake
    const intakeQ = query(collection(db, "medicationIntake"), where("patientId", "==", currentUser.id));
    const unsubscribe = onSnapshot(intakeQ, (intakeSnap) => {
      const allIntakes = intakeSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          medicationId: data.medicationId || "",
          patientId: data.patientId || "",
          doseId: data.doseId || "",
          scheduledTime: data.scheduledTime || "",
          takenTime: data.takenTime,
          skipped: data.skipped ?? false,
          notes: data.notes || "",
        };
      });
      setIntakes(allIntakes);
    });
    // Fetch notifications and patient info once
    const fetchPatient = async () => {
      const notifRef = doc(db, "patients", currentUser.id);
      const notifSnap = await getDoc(notifRef);
      if (notifSnap.exists()) {
        const data = notifSnap.data();
        setNotifications({
          medicationReminders: data.medicationReminders ?? true,
          missedDose: data.missedDose ?? true,
          doctorMessages: data.doctorMessages ?? true,
          appointmentReminders: data.appointmentReminders ?? true,
        });
        setPatient(data);
      }
    };
    fetchPatient();
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "historySkippedMedications"), where("patientId", "==", currentUser.id));
    const unsub = onSnapshot(q, (snap) => {
      setSkippedHistory(snap.docs.map(doc => doc.data() as any));
    });
    return () => unsub();
  }, [currentUser]);

  // Автоматично маркирай като пропуснати лекарства със задна дата
  useEffect(() => {
    if (!medications || !currentUser) return;
    const now = new Date();
    medications.forEach(async (med) => {
      if (med.endDate && new Date(med.endDate) < now) {
        // Намери всички intakes за това лекарство, които не са приети или пропуснати
        const missedIntakes = intakes.filter(intake => intake.medicationId === med.id && !intake.takenTime && !intake.skipped);
        for (const intake of missedIntakes) {
          await setDoc(doc(db, "medicationIntake", intake.id), {
            ...intake,
            skipped: true,
            takenTime: undefined
          }, { merge: true });
        }
        // Премахни медикамента от колекцията с лекарства
        await deleteDoc(doc(db, "medications", med.id));
        // Добави пропуснат intake ако няма нито един intake за това лекарство
        const hasAnyIntake = intakes.some(intake => intake.medicationId === med.id);
        if (!hasAnyIntake) {
          // Добави един intake със skipped=true, за да се появи в пропуснатите
          await addDoc(collection(db, "medicationIntake"), {
            medicationId: med.id,
            patientId: currentUser.id,
            doseId: "",
            scheduledTime: med.endDate,
            takenTime: undefined,
            skipped: true,
            notes: "",
            doctorId: med.doctorId || ""
          });
        }
        // Добави запис в колекцията historySkippedMedications за история
        await addDoc(collection(db, "historySkippedMedications"), {
          medicationName: med.name,
          patientId: currentUser.id,
          skippedAt: now.toISOString(),
          endDate: med.endDate,
        });
        // Премахни медикамента от колекцията с лекарства
        await deleteDoc(doc(db, "medications", med.id));
      }
    });
  }, [medications, intakes, currentUser]);

  const saveNotifications = async (newSettings: typeof notifications) => {
    if (!currentUser) return;
    await setDoc(doc(db, "patients", currentUser.id), newSettings, { merge: true });
    setNotifications(newSettings);
  };

  const now = new Date();
  const intakesToShow = intakes.filter(intake => {
    if (!intake.takenTime && !intake.skipped) return true;
    const time = new Date(intake.takenTime || intake.scheduledTime);
    const diff = now.getTime() - time.getTime();
    return diff < 24 * 60 * 60 * 1000; // less than 1 day
  });

  // Филтрирай дублиращи се приети лекарства (с еднакво име и доза)
  const uniqueTakenIntakesToShow = intakesToShow.filter((intake, idx, arr) => {
    if (!intake.takenTime) return true; // показвай всички, които не са приети
    // намери първия intake със същото лекарство и доза, който е приет
    return (
      arr.findIndex(i =>
        i.medicationId === intake.medicationId &&
        i.takenTime &&
        i.doseId === intake.doseId
      ) === idx
    );
  });

  // Използвай уникалните intakes и за тракера
  const totalIntakes = uniqueTakenIntakesToShow.length;
  const takenIntakes = uniqueTakenIntakesToShow.filter(intake => intake.takenTime).length;
  const missedIntakes = uniqueTakenIntakesToShow.filter(intake => intake.skipped).length;
  const pendingIntakes = uniqueTakenIntakesToShow.filter(intake => !intake.takenTime && !intake.skipped).length
    + medications.filter(med => !uniqueTakenIntakesToShow.some(intake => intake.medicationId === med.id)).length;

  // Count unique medications with at least one skipped intake, включително тези, които вече не са в medications
  const refusedMedicationIds = new Set(intakes.filter(intake => intake.skipped).map(intake => intake.medicationId));
  // Вземи името от medications, ако го има, иначе от intake.notes или medicationId
  const refusedMedications = Array.from(refusedMedicationIds)
    .map(id => {
      const med = getMedicationById(id);
      if (med) return med.name;
      // Ако медикаментът е изтрит, намери intake с това id и вземи notes или id
      const intake = intakes.find(i => i.medicationId === id && i.skipped);
      return intake?.notes || id;
    })
    .filter(Boolean);

  const markAsTaken = (intakeId: string) => {
    setIntakes(intakes.map(intake => {
      if (intake.id === intakeId) {
        return {
          ...intake,
          takenTime: new Date().toISOString(),
          skipped: false
        };
      }
      return intake;
    }));
    toast({
      title: "Лекарството е приет",
      description: "Отбелязано като прието успешно",
    });
  };

  const markAsSkipped = async (intakeId: string) => {
    // Update in Firestore
    const intake = intakes.find(i => i.id === intakeId);
    if (!intake) return;
    try {
      await setDoc(doc(db, "medicationIntake", intakeId), {
        ...intake,
        takenTime: undefined,
        skipped: true
      }, { merge: true });
      setIntakes(prev => prev.map(intake => {
        if (intake.id === intakeId) {
          return {
            ...intake,
            takenTime: undefined,
            skipped: true
          };
        }
        return intake;
      }));
      toast({
        title: "Лекарство пропуснато",
        description: "Отбелязано като пропуснато",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Грешка при отказ!",
        description: "Възникна проблем при отбелязване като пропуснато.",
        variant: "destructive",
      });
    }
  };

  const getMedicationById = (id: string) => {
    return medications.find(med => med.id === id) || null;
  };

  const today = new Date().toLocaleDateString("bg-BG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

  const patientName = (currentUser && currentUser.name) || (patient && patient.name) || "";

  // Съвети за здравословен начин на живот
  const healthTips = [
    "Пийте достатъчно вода всеки ден за по-добро здраве.",
    "Винаги приемайте лекарствата си по едно и също време.",
    "Не пропускайте храненията, за да избегнете стомашни проблеми.",
    "Движете се поне 30 минути дневно.",
    "Избягвайте стреса чрез дълбоко дишане и кратки почивки.",
    "Спете поне 7-8 часа на нощ за по-добро възстановяване.",
    "Консултирайте се с лекар при всякакви странични ефекти.",
    "Не смесвайте лекарства без консултация с лекар или фармацевт.",
    "Следете кръвното си налягане и пулса редовно.",
    "Хранете се балансирано с повече плодове и зеленчуци."
  ];
  // Покажи 5 случайни съвета за здраве, по-видимо
  function getRandomTips(arr: string[], n: number) {
    const shuffled = arr.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }
  const [tips, setTips] = useState<string[]>(() => getRandomTips(healthTips, 5));
  useEffect(() => {
    setTips(getRandomTips(healthTips, 5));
    // eslint-disable-next-line
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PatientNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Добре дошли, {patientName}</h1>
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Приети лекарства */}
          <Card className="bg-card border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-foreground">
                <CheckCircle className="mr-2 h-5 w-5 text-primary" />
                Приети лекарства
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{takenIntakes} / {totalIntakes}</p>
              <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${(takenIntakes / totalIntakes) * 100}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          {/* Предстоящи приеми */}
          <Card className="bg-card border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-foreground">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                Предстоящи приеми
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{pendingIntakes}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {pendingIntakes > 0 ? "Не забравяйте да ги приемете навреме" : "Няма повече приеми за днес"}
              </p>
            </CardContent>
          </Card>

          {/* История на приети лекарства */}
          <Card className="bg-card border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center text-foreground">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                История на приети лекарства
              </CardTitle>
            </CardHeader>
            <CardContent>
              {intakes.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">Няма история на приеми</p>
              ) : (
                <ul className="divide-y divide-border">
                  {intakes
                    .slice()
                    .sort((a, b) => {
                      // Сортирай по време на прием (прието > пропуснато > планирано)
                      const getTime = (i) => i.takenTime ? new Date(i.takenTime).getTime() : i.skipped ? new Date(i.scheduledTime).getTime() : 0;
                      return getTime(b) - getTime(a);
                    })
                    .filter((intake, idx, arr) => {
                      // Показвай само първото срещане на intake със същото лекарство, доза и статус
                      const key = `${intake.medicationId}-${intake.doseId}-${intake.takenTime ? 'taken' : intake.skipped ? 'skipped' : 'planned'}`;
                      return arr.findIndex(i => `${i.medicationId}-${i.doseId}-${i.takenTime ? 'taken' : i.skipped ? 'skipped' : 'planned'}` === key) === idx;
                    })
                    .slice(0, 5)
                    .map((intake, idx) => {
                      const medication = getMedicationById(intake.medicationId);
                      const status = intake.takenTime ? 'Прието' : intake.skipped ? 'Пропуснато' : 'Планирано';
                      const statusColor = intake.takenTime ? 'text-green-600' : intake.skipped ? 'text-red-600' : 'text-yellow-600';
                      const statusIcon = intake.takenTime ? <CheckCircle className="inline h-4 w-4 mr-1 text-green-600" /> : intake.skipped ? <XCircle className="inline h-4 w-4 mr-1 text-red-600" /> : <Clock className="inline h-4 w-4 mr-1 text-yellow-600" />;
                      const date = intake.takenTime ? new Date(intake.takenTime) : new Date(intake.scheduledTime);
                      return (
                        <li key={intake.id || idx} className="py-2 flex items-center justify-between">
                          <div>
                            <span className="font-medium text-foreground">{medication?.name || 'Лекарство'}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{date.toLocaleDateString("bg-BG")} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <span className={`flex items-center font-semibold ${statusColor}`}>
                            {statusIcon}{status}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Всички лекарства</CardTitle>
            <CardDescription className="text-muted-foreground">Всички ваши предписани лекарства</CardDescription>
          </CardHeader>
          <CardContent>
            {medications.length === 0 && intakesToShow.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-xl font-medium text-muted-foreground mb-1">Няма намерени лекарства</p>
                <p className="text-muted-foreground">Вашият график е празен</p>
              </div>
            ) : (
              <div className="space-y-3">
                {uniqueTakenIntakesToShow.map((intake) => {
                  const medication = getMedicationById(intake.medicationId);
                  return (
                    <div
                      key={intake.id}
                      className={`p-4 border border-border rounded-md bg-card ${intake.takenTime ? 'opacity-80' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${intake.takenTime ? 'bg-primary text-primary-foreground' : intake.skipped ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'}`}> 
                            <Pill className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{medication?.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {medication?.doses?.[0]?.amount} {medication?.doses?.[0]?.unit} - {medication?.intakeMethod === 'oral' ? 'Перорално' : medication?.intakeMethod === 'injection' ? 'Инжекция' : medication?.intakeMethod === 'inhalation' ? 'Инхалация' : 'Локално'}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {!intake.takenTime && !intake.skipped && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-primary border-border hover:bg-primary hover:text-primary-foreground"
                                onClick={() => markAsTaken(intake.id)}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Прието
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={async () => {
                                  // Remove all intakes for this medication from Firestore
                                  const intakeDocs = intakes.filter(i => i.medicationId === medication.id);
                                  for (const intake of intakeDocs) {
                                    if (intake.id) {
                                      await deleteDoc(doc(db, "medicationIntake", intake.id));
                                    }
                                  }
                                  // Remove the medication itself from Firestore
                                  await deleteDoc(doc(db, "medications", medication.id));
                                  setIntakes(prev => prev.filter(i => i.medicationId !== medication.id));
                                  toast({ title: "Лекарството е премахнато!", description: `${medication.name} беше премахнато от списъка.`, variant: "destructive" });
                                }}
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Откажи
                              </Button>
                            </>
                          )}
                          {intake.takenTime && (
                            <>
                              <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full">
                                Прието в {new Date(intake.takenTime).toLocaleTimeString().substring(0, 5)}
                              </span>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="ml-2"
                                onClick={async () => {
                                  await setDoc(doc(db, "medicationIntake", intake.id), {}, { merge: false });
                                  setIntakes(prev => prev.filter(i => i.id !== intake.id));
                                  toast({ title: "Записът е изтрит!", description: "Приетото лекарство беше премахнато от списъка." });
                                }}
                              >
                                <XCircle className="h-5 w-5" />
                              </Button>
                            </>
                          )}
                          {intake.skipped && (
                            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                              Отказано
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Info className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                      {medication?.instructions && (
                        <p className="text-sm text-muted-foreground mt-3 border-t pt-2">
                          {medication.instructions}
                        </p>
                      )}
                    </div>
                  );
                })}
                {medications.filter(med => !intakesToShow.some(intake => intake.medicationId === med.id)).map(medication => (
                  <div key={medication.id} className="p-4 border border-border rounded-md bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-muted text-muted-foreground">
                          <Pill className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{medication.name}</h4>
                          <p className="text-sm text-muted-foreground mb-1">
                            {medication.doses && medication.doses.length > 0 ? (
                              <>
                                {medication.doses.map((dose, idx) => (
                                  <span key={idx} className="block">
                                    {dose.amount} {dose.unit} – {dose.time === 'morning' ? 'Сутрин' : dose.time === 'afternoon' ? 'Обяд' : dose.time === 'evening' ? 'Вечер' : dose.time === 'night' ? 'Нощ' : dose.time}
                                  </span>
                                ))}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">Няма информация за дози</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mb-1">
                            {medication.startDate && medication.endDate && (
                              <>Период: {new Date(medication.startDate).toLocaleDateString("bg-BG")} - {new Date(medication.endDate).toLocaleDateString("bg-BG")}</>
                            )}
                          </p>
                          {medication.instructions && (
                            <p className="text-sm text-muted-foreground mt-3 border-t pt-2">
                              {medication.instructions}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-primary border-border hover:bg-primary hover:text-primary-foreground"
                          onClick={async () => {
                            if (!currentUser) return;
                            const today = new Date();
                            const scheduledTime = today.toISOString();
                            const dose = medication.doses && medication.doses[0];
                            const newIntake = {
                              medicationId: medication.id,
                              patientId: currentUser.id,
                              doseId: dose ? `${medication.id}-${dose.time}` : "",
                              scheduledTime,
                              takenTime: new Date().toISOString(),
                              skipped: false,
                              notes: "",
                              doctorId: medication.doctorId || ""
                            };
                            await setDoc(doc(collection(db, "medicationIntake")), newIntake);
                            toast({ title: "Лекарството е прието!", description: `${medication.name} е отчетено като прието.` });
                            setIntakes(prev => [...prev, { id: Math.random().toString(), ...newIntake }]);
                          }}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Прието
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={async () => {
                            // Remove all intakes for this medication from Firestore
                            const intakeDocs = intakes.filter(i => i.medicationId === medication.id);
                            for (const intake of intakeDocs) {
                              if (intake.id) {
                                await deleteDoc(doc(db, "medicationIntake", intake.id));
                              }
                            }
                            // Remove the medication itself from Firestore
                            await deleteDoc(doc(db, "medications", medication.id));
                            setIntakes(prev => prev.filter(i => i.medicationId !== medication.id));
                            toast({ title: "Лекарството е премахнато!", description: `${medication.name} беше премахнато от списъка.`, variant: "destructive" });
                          }}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Откажи
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-foreground">
              💡 Съвети за здраве
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mt-2">
              {tips.map((tip, idx) => (
                <li
                  key={idx}
                  className="bg-primary/10 border-l-4 border-primary rounded px-4 py-3 text-base font-semibold text-primary dark:text-primary-foreground text-primary-foreground shadow-sm animate-fade-in"
                  style={{
                    backgroundColor: 'var(--tw-bg-opacity, 1) rgba(59,130,246,0.07)',
                    color: 'var(--primary)',
                    borderLeftColor: 'var(--primary)'
                  }}
                >
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <PatientChatWidget doctor={doctors && Object.keys(doctors).length > 0 ? { id: Object.keys(doctors)[0], name: doctors[Object.keys(doctors)[0]].name } : { id: '', name: 'Няма наличен лекар' }} currentUser={currentUser} />
    </div>
  );
};

export default PatientDashboard;
