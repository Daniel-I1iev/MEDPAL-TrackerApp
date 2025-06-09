import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Patient, Medication } from "@/models/types";
import { Calendar, Clock, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";

interface PatientDetailsDialogProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PatientDetailsDialog = ({ patient, open, onOpenChange }: PatientDetailsDialogProps) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [patientMedications, setPatientMedications] = useState<any[]>([]);

  useEffect(() => {
    const fetchMedications = async () => {
      if (!patient?.id || !currentUser) return;
      const q = query(
        collection(db, "medications"),
        where("patientId", "==", patient.id),
        where("doctorId", "==", currentUser.id)
      );
      const querySnapshot = await getDocs(q);
      setPatientMedications(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchMedications();
  }, [patient, currentUser]);

  const getIntakeMethodLabel = (method: string): string => {
    const methods = {
      oral: "Перорален прием",
      injection: "Инжекция",
      topical: "Локално приложение",
      inhalation: "Инхалация"
    };
    return methods[method as keyof typeof methods] || method;
  };

  const getTimeLabel = (time: string): string => {
    const times = {
      morning: "Сутрин",
      afternoon: "Обяд",
      evening: "Вечер",
      night: "Нощ"
    };
    return times[time as keyof typeof times] || time;
  };

  const handleEditMedication = (medicationId: string) => {
    onOpenChange(false); // Close the dialog first
    navigate(`/doctor/medications/edit/${medicationId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Информация за пациент</DialogTitle>
          <DialogDescription>
            Детайлна информация за {patient.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Personal Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Лични данни</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Име</p>
                <p className="font-medium">{patient.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Имейл</p>
                <p className="font-medium">{patient.email || "Не е посочен"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Дата на раждане</p>
                <p className="font-medium">{patient.dateOfBirth || "Не е посочена"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Телефон</p>
                <p className="font-medium">{patient.phoneNumber || "Не е посочен"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Medical Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Медицински състояния и алергии</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.medicalConditions && patient.medicalConditions.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {patient.medicalConditions.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground italic">Няма посочени медицински състояния</p>
              )}
            </CardContent>
          </Card>

          {/* Medications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Лекарства</CardTitle>
              <Button 
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/doctor/medications/add/${patient.id}`);
                }}
              >
                Добави лекарство
              </Button>
            </CardHeader>
            <CardContent>
              {patientMedications.length > 0 ? (
                <div className="space-y-4">
                  {patientMedications.map((medication) => (
                    <Card key={medication.id} className="bg-muted/50">
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">{medication.name}</CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditMedication(medication.id)}
                          title="Редактирай лекарство"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {medication.startDate} - {medication.endDate}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {getIntakeMethodLabel(medication.intakeMethod)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-sm font-medium">Дози:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                            {medication.doses.map((dose, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  {getTimeLabel(dose.time)}: {dose.amount} {dose.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {medication.instructions && (
                          <div className="mt-3">
                            <p className="text-sm font-medium">Инструкции:</p>
                            <p className="text-sm mt-1">{medication.instructions}</p>
                          </div>
                        )}

                        {medication.sideEffects && medication.sideEffects.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium">Странични ефекти:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {medication.sideEffects.map((effect, index) => (
                                <span 
                                  key={index}
                                  className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full"
                                >
                                  {effect}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground italic">Няма предписани лекарства</p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailsDialog;
