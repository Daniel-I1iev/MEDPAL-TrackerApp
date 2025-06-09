import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/contexts/AuthContext";
import DoctorNavbar from "@/components/layout/DoctorNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Trash, X } from "lucide-react";
import { MedicationIntakeMethod } from "@/models/types";

const intakeMethods: { value: MedicationIntakeMethod; label: string }[] = [
  { value: "oral", label: "Перорален прием" },
  { value: "injection", label: "Инжекция" },
  { value: "topical", label: "Локално приложение" },
  { value: "inhalation", label: "Инхалация" },
];

const intakeTimes = [
  { value: "morning", label: "Сутрин" },
  { value: "afternoon", label: "Обяд" },
  { value: "evening", label: "Вечер" },
  { value: "night", label: "Нощ" },
];

interface Dose {
  amount: number;
  unit: string;
  time: string;
}

interface SideEffect {
  text: string;
}

const DoctorAddMedication = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const [patient, setPatient] = useState<any>(null);
  const [medicationName, setMedicationName] = useState("");
  const [intakeMethod, setIntakeMethod] = useState<MedicationIntakeMethod>("oral");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [doses, setDoses] = useState<Dose[]>([
    { amount: 1, unit: "таблетка", time: "morning" }
  ]);
  const [sideEffectText, setSideEffectText] = useState("");
  const [sideEffects, setSideEffects] = useState<SideEffect[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) return;
      const patientRef = doc(db, "patients", patientId);
      const patientSnap = await getDoc(patientRef);
      if (patientSnap.exists()) {
        setPatient({ id: patientSnap.id, ...patientSnap.data() });
      } else {
        setPatient(null);
      }
    };
    fetchPatient();
  }, [patientId]);
  
  const addDose = () => {
    setDoses([...doses, { amount: 1, unit: "таблетка", time: "morning" }]);
  };
  
  const removeDose = (index: number) => {
    setDoses(doses.filter((_, i) => i !== index));
  };
  
  const updateDose = (index: number, field: keyof Dose, value: any) => {
    const updatedDoses = [...doses];
    updatedDoses[index] = { ...updatedDoses[index], [field]: value };
    setDoses(updatedDoses);
  };
  
  const addSideEffect = () => {
    if (sideEffectText.trim()) {
      setSideEffects([...sideEffects, { text: sideEffectText.trim() }]);
      setSideEffectText("");
    }
  };
  
  const removeSideEffect = (index: number) => {
    setSideEffects(sideEffects.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    // Validate form
    if (!medicationName.trim()) {
      toast({
        title: "Грешка при валидация",
        description: "Името на лекарството е задължително",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    if (!startDate || !endDate) {
      toast({
        title: "Грешка при валидация",
        description: "Началната и крайната дата са задължителни",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    if (doses.length === 0) {
      toast({
        title: "Грешка при валидация",
        description: "Трябва да добавите поне една доза",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      await addDoc(collection(db, "medications"), {
        patientId,
        doctorId: currentUser?.id || "", // Save doctorId for traceability
        name: medicationName,
        intakeMethod,
        startDate,
        endDate,
        instructions,
        doses,
        sideEffects: sideEffects.map(e => e.text),
        createdAt: new Date().toISOString(),
      });
      toast({
        title: "Лекарството е добавено",
        description: `${medicationName} беше добавено успешно`,
      });
      navigate("/doctor/patients");
    } catch (error) {
      toast({
        title: "Грешка при добавяне",
        description: "Възникна проблем при добавянето на лекарството.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!patient) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <DoctorNavbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-xl text-center text-muted-foreground">Пациентът не е намерен</p>
        </div>
      </div>
    );
  }
  
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
          
          <h1 className="text-2xl font-bold text-foreground">Добавяне на лекарство</h1>
          <p className="text-muted-foreground">
            Пациент: <span className="font-medium text-foreground">{patient.name}</span>
          </p>
        </div>
        
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Информация за лекарството</CardTitle>
            <CardDescription className="text-muted-foreground">Всички полета, маркирани с * са задължителни</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="medicationName" className="flex items-center text-foreground">
                    Име на лекарството *
                  </Label>
                  <Input
                    id="medicationName"
                    value={medicationName}
                    onChange={(e) => setMedicationName(e.target.value)}
                    placeholder="Въведете име на лекарството"
                    required
                    className="mt-1 bg-card text-foreground border-border"
                  />
                </div>
                
                <div>
                  <Label htmlFor="intakeMethod" className="flex items-center text-foreground">
                    Начин на прием *
                  </Label>
                  <Select 
                    value={intakeMethod} 
                    onValueChange={(value) => setIntakeMethod(value as MedicationIntakeMethod)}
                  >
                    <SelectTrigger className="mt-1 bg-card text-foreground border-border">
                      <SelectValue placeholder="Изберете начин на прием" />
                    </SelectTrigger>
                    <SelectContent className="bg-card text-foreground border-border">
                      {intakeMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value} className="text-foreground">
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="flex items-center text-foreground">
                      Начална дата *
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="mt-1 bg-card text-foreground border-border"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate" className="flex items-center text-foreground">
                      Крайна дата *
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="mt-1 bg-card text-foreground border-border"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center text-foreground">
                      Дози *
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-foreground border-border hover:bg-primary hover:text-primary-foreground"
                      onClick={addDose}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Добави доза
                    </Button>
                  </div>
                  
                  {doses.map((dose, index) => (
                    <div 
                      key={index} 
                      className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3 p-3 border border-border rounded-md bg-muted"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 items-center gap-2 flex-1">
                        <div>
                          <Label htmlFor={`amount-${index}`} className="text-xs text-foreground">
                            Количество
                          </Label>
                          <Input
                            id={`amount-${index}`}
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={dose.amount}
                            onChange={(e) => updateDose(index, "amount", parseFloat(e.target.value))}
                            className="mt-1 bg-card text-foreground border-border"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`unit-${index}`} className="text-xs text-foreground">
                            Единица
                          </Label>
                          <Input
                            id={`unit-${index}`}
                            value={dose.unit}
                            onChange={(e) => updateDose(index, "unit", e.target.value)}
                            className="mt-1 bg-card text-foreground border-border"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`time-${index}`} className="text-xs text-foreground">
                            Време
                          </Label>
                          <Select 
                            value={dose.time} 
                            onValueChange={(value) => updateDose(index, "time", value)}
                          >
                            <SelectTrigger className="mt-1 bg-card text-foreground border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card text-foreground border-border">
                              {intakeTimes.map((time) => (
                                <SelectItem key={time.value} value={time.value} className="text-foreground">
                                  {time.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {doses.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary sm:self-end"
                          onClick={() => removeDose(index)}
                        >
                          <Trash className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div>
                  <Label htmlFor="instructions" className="text-foreground">Инструкции</Label>
                  <Textarea
                    id="instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Въведете инструкции за прием"
                    className="mt-1 resize-none bg-card text-foreground border-border"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label className="text-foreground">Странични ефекти</Label>
                  <div className="flex items-center mt-1">
                    <Input
                      value={sideEffectText}
                      onChange={(e) => setSideEffectText(e.target.value)}
                      placeholder="Добавете възможен страничен ефект"
                      className="flex-1 bg-card text-foreground border-border"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSideEffect();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="ml-2 text-foreground border-border hover:bg-primary hover:text-primary-foreground"
                      onClick={addSideEffect}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {sideEffects.map((effect, index) => (
                      <div 
                        key={index} 
                        className="flex items-center bg-muted px-3 py-1 rounded-full"
                      >
                        <span className="text-foreground text-sm">{effect.text}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 ml-1 text-muted-foreground hover:text-primary"
                          onClick={() => removeSideEffect(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Добавяне..." : "Добави лекарство"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorAddMedication;
