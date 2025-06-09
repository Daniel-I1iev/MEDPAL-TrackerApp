import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Landing from "./pages/Landing";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import PatientDashboard from "./pages/patient/PatientDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorAddPatient from "./pages/doctor/DoctorAddPatient";
import DoctorAddMedication from "./pages/doctor/DoctorAddMedication";
import DoctorEditMedication from "./pages/doctor/DoctorEditMedication";
import DoctorProfile from "./pages/doctor/DoctorProfile";
import PatientMedications from "./pages/patient/PatientMedications";
import PatientProfile from "./pages/patient/PatientProfile";
import DoctorLaboratory from "./pages/doctor/DoctorLaboratory";
import PatientLabResults from "./pages/patient/PatientLabResults";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Doctor routes */}
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/patients" element={<DoctorPatients />} />
            <Route path="/doctor/patients/add" element={<DoctorAddPatient />} />
            <Route path="/doctor/medications/add/:patientId" element={<DoctorAddMedication />} />
            <Route path="/doctor/medications/edit/:medicationId" element={<DoctorEditMedication />} />
            <Route path="/doctor/profile" element={<DoctorProfile />} />
            <Route path="/doctor/laboratory" element={<DoctorLaboratory />} />
            
            {/* Patient routes */}
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/medications" element={<PatientMedications />} />
            <Route path="/patient/profile" element={<PatientProfile />} />
            <Route path="/patient/lab-results" element={<PatientLabResults />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
