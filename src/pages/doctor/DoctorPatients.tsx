import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/contexts/AuthContext";
import DoctorNavbar from "@/components/layout/DoctorNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, User } from "lucide-react";
import { Patient } from "@/models/types";
import PatientDetailsDialog from "@/components/doctor/PatientDetailsDialog";

const DoctorPatients = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!currentUser) return;
      const q = query(collection(db, "patients"), where("doctorId", "==", currentUser.id));
      const querySnapshot = await getDocs(q);
      const patientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Patient[];
      setPatients(patientsData);
    };
    fetchPatients();
  }, [currentUser]);

  // Filter patients based on search query
  const filteredPatients = searchQuery
    ? patients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (patient.email && patient.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : patients;

  const handleOpenDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDetailsOpen(true);
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете този пациент?")) return;
    await deleteDoc(doc(db, "patients", patientId));
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DoctorNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Моите пациенти</h1>
            <p className="text-muted-foreground mt-1">
              Общо {patients.length} пациенти
            </p>
          </div>
          
          <Button 
            className="mt-3 md:mt-0 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate("/doctor/patients/add")}
          >
            <Plus className="mr-2 h-5 w-5" />
            Добавяне на пациент
          </Button>
        </div>
        
        <div className="relative mb-6">
          <Search className="h-4 w-4 absolute top-3 left-3 text-muted-foreground" />
          <Input
            className="pl-10 bg-card text-foreground border-border"
            placeholder="Търсете по име или имейл..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="text-foreground">Име</TableHead>
                <TableHead className="text-foreground">Имейл</TableHead>
                <TableHead className="text-foreground">Телефон</TableHead>
                <TableHead className="text-foreground">Медицински състояния</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div className="bg-muted rounded-full w-8 h-8 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{patient.name}</TableCell>
                    <TableCell className="text-foreground">{patient.email || "-"}</TableCell>
                    <TableCell className="text-foreground">{patient.phoneNumber || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate text-foreground">
                      {patient.medicalConditions && patient.medicalConditions.length > 0
                        ? patient.medicalConditions.join(", ")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetails(patient)}
                        className="text-foreground border-border"
                      >
                        Детайли
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="ml-2"
                        onClick={() => handleDeletePatient(patient.id)}
                      >
                        Изтрий
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Няма намерени пациенти
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {selectedPatient && (
          <PatientDetailsDialog 
            patient={selectedPatient}
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
          />
        )}
      </div>
    </div>
  );
};

export default DoctorPatients;
