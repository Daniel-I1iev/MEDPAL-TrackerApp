import React, { useEffect, useState } from "react";
import PatientNavbar from "@/components/layout/PatientNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Info, Pill } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePatientMedications } from "@/hooks/usePatientMedications";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";

const PatientMedications = () => {
  const { currentUser } = useAuth();
  const { medications, loading, doctors } = usePatientMedications();
  const [takenIntakes, setTakenIntakes] = useState<{ [medicationId: string]: boolean } | null>(null);

  useEffect(() => {
    const fetchTakenIntakes = async () => {
      if (!currentUser) return;
      const intakeQ = query(collection(db, "medicationIntake"), where("patientId", "==", currentUser.id));
      const intakeSnap = await getDocs(intakeQ);
      const taken: { [medicationId: string]: boolean } = {};
      intakeSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.takenTime) taken[data.medicationId] = true;
      });
      setTakenIntakes(taken);
    };
    fetchTakenIntakes();
  }, [currentUser]);

  // Group medications by active and completed
  const today = new Date();
  // Completed: show all medications that have at least one taken intake
  const completedMedications = takenIntakes
    ? medications.filter(med => takenIntakes[med.id])
    : [];
  // Active: show only those that are not completed and endDate >= today
  const activeMedications = medications.filter(
    med => !takenIntakes?.[med.id] && new Date(med.endDate) >= today
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("bg-BG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  
  // Map intake time to human-readable format
  const getIntakeTimeLabel = (time: string) => {
    switch (time) {
      case "morning": return "Сутрин";
      case "afternoon": return "Обяд";
      case "evening": return "Вечер";
      case "night": return "Нощ";
      default: return time;
    }
  };
  
  // Map intake method to human-readable format
  const getIntakeMethodLabel = (method: string) => {
    switch (method) {
      case "oral": return "Перорално";
      case "injection": return "Инжекция";
      case "topical": return "Локално приложение";
      case "inhalation": return "Инхалация";
      default: return method;
    }
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PatientNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Моите лекарства</h1>
          <p className="text-muted-foreground">Преглед на всички ваши лекарства</p>
        </div>
        
        <Tabs defaultValue="active" className="mb-8">
          <TabsList className="mb-6 bg-card border border-border">
            <TabsTrigger value="active" className="text-foreground font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow">
              Активни ({activeMedications.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-foreground font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow">
              Завършени ({completedMedications.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <div className="space-y-6">
              {loading ? (
                <Card className="bg-card border border-border">
                  <CardContent className="text-center py-8 text-muted-foreground">
                    <Pill className="mx-auto h-12 w-12 mb-3" />
                    <p className="text-xl font-medium mb-1">Зареждане...</p>
                  </CardContent>
                </Card>
              ) : activeMedications.length === 0 ? (
                <Card className="bg-card border border-border">
                  <CardContent className="text-center py-8 text-muted-foreground">
                    <Pill className="mx-auto h-12 w-12 mb-3" />
                    <p className="text-xl font-medium mb-1">Няма активни лекарства</p>
                    <p>В момента нямате активни лекарства</p>
                  </CardContent>
                </Card>
              ) : (
                activeMedications.map((medication) => (
                  <Card key={medication.id} className="overflow-hidden bg-card border border-border">
                    <div className="border-l-4 border-primary">
                      <CardHeader className="pb-2">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <CardTitle className="text-xl flex items-center text-foreground">
                              <Pill className="mr-2 h-5 w-5 text-primary" />
                              {medication.name}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                              {getIntakeMethodLabel(medication.intakeMethod)}
                            </CardDescription>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-4 w-4" />
                            <span>
                              От {formatDate(medication.startDate)} до {formatDate(medication.endDate)}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mt-4">
                          <h4 className="font-medium text-foreground mb-2">График на прием:</h4>
                          <div className="flex flex-wrap gap-3">
                            {medication.doses.map((dose, index) => (
                              <div 
                                key={index} 
                                className="bg-muted rounded-lg p-3 flex items-center"
                              >
                                <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                                <div>
                                  <p className="font-medium text-foreground">
                                    {getIntakeTimeLabel(dose.time)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {dose.amount} {dose.unit}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {medication.instructions && (
                          <div className="mt-4 border-t pt-4">
                            <h4 className="font-medium text-foreground mb-2 flex items-center">
                              <Info className="h-5 w-5 text-primary mr-2" />
                              Инструкции:
                            </h4>
                            <p className="text-muted-foreground">{medication.instructions}</p>
                          </div>
                        )}
                        {medication.sideEffects && medication.sideEffects.length > 0 && (
                          <div className="mt-4 border-t pt-4">
                            <h4 className="font-medium text-foreground mb-2">Възможни странични ефекти:</h4>
                            <div className="flex flex-wrap gap-2">
                              {medication.sideEffects.map((effect, index) => (
                                <span 
                                  key={index} 
                                  className="inline-block px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-md"
                                >
                                  {effect}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {medication.doctorId && doctors[medication.doctorId]?.name && (
                          <div className="mt-4 border-t pt-4">
                            <h4 className="font-medium text-foreground mb-2">Предписано от:</h4>
                            <p className="text-muted-foreground">{doctors[medication.doctorId].name}</p>
                          </div>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="completed">
            <div className="space-y-6">
              {loading ? (
                <Card className="bg-card border border-border">
                  <CardContent className="text-center py-8 text-muted-foreground">
                    <Calendar className="mx-auto h-12 w-12 mb-3" />
                    <p className="text-xl font-medium mb-1">Зареждане...</p>
                  </CardContent>
                </Card>
              ) : completedMedications.length === 0 ? (
                <Card className="bg-card border border-border">
                  <CardContent className="text-center py-8 text-muted-foreground">
                    <Calendar className="mx-auto h-12 w-12 mb-3" />
                    <p className="text-xl font-medium mb-1">Няма завършени лекарства</p>
                    <p>Все още нямате завършени лекарства</p>
                  </CardContent>
                </Card>
              ) : (
                completedMedications.map((medication) => (
                  <Card key={medication.id} className="overflow-hidden opacity-70 bg-card border border-border">
                    <div className="border-l-4 border-muted">
                      <CardHeader className="pb-2">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <CardTitle className="text-xl flex items-center text-foreground">
                              <Pill className="mr-2 h-5 w-5 text-muted-foreground" />
                              {medication.name}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                              {getIntakeMethodLabel(medication.intakeMethod)}
                            </CardDescription>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-4 w-4" />
                            <span>
                              От {formatDate(medication.startDate)} до {formatDate(medication.endDate)}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mt-4">
                          <h4 className="font-medium text-foreground mb-2">График на прием:</h4>
                          <div className="flex flex-wrap gap-3">
                            {medication.doses.map((dose, index) => (
                              <div 
                                key={index} 
                                className="bg-muted rounded-lg p-3 flex items-center"
                              >
                                <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                                <div>
                                  <p className="font-medium text-foreground">
                                    {getIntakeTimeLabel(dose.time)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {dose.amount} {dose.unit}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {medication.instructions && (
                          <div className="mt-4 border-t pt-4">
                            <h4 className="font-medium text-foreground mb-2 flex items-center">
                              <Info className="h-5 w-5 text-muted-foreground mr-2" />
                              Инструкции:
                            </h4>
                            <p className="text-muted-foreground">{medication.instructions}</p>
                          </div>
                        )}
                        {medication.sideEffects && medication.sideEffects.length > 0 && (
                          <div className="mt-4 border-t pt-4">
                            <h4 className="font-medium text-foreground mb-2">Възможни странични ефекти:</h4>
                            <div className="flex flex-wrap gap-2">
                              {medication.sideEffects.map((effect, index) => (
                                <span 
                                  key={index} 
                                  className="inline-block px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-md"
                                >
                                  {effect}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {medication.doctorId && doctors[medication.doctorId]?.name && (
                          <div className="mt-4 border-t pt-4">
                            <h4 className="font-medium text-foreground mb-2">Предписано от:</h4>
                            <p className="text-muted-foreground">{doctors[medication.doctorId].name}</p>
                          </div>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PatientMedications;
