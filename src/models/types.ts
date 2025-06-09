// User types
export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization?: string;
  hospital?: string;
}

export interface Patient {
  id: string;
  name: string;
  email?: string;
  doctorId: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  medicalConditions?: string[];
}

// Medication types
export type MedicationIntakeTime = "morning" | "afternoon" | "evening" | "night" | string;
export type MedicationIntakeMethod = "oral" | "injection" | "topical" | "inhalation" | string;

export interface MedicationDose {
  amount: number;
  unit: string;
  time: MedicationIntakeTime;
}

export interface Medication {
  id: string;
  patientId: string;
  doctorId?: string; // Add doctorId for traceability
  name: string;
  doses: MedicationDose[];
  intakeMethod: MedicationIntakeMethod;
  startDate: string;
  endDate: string;
  instructions?: string;
  sideEffects?: string[];
}

// Intake tracking
export interface MedicationIntake {
  id: string;
  medicationId: string;
  patientId: string;
  doseId: string;
  scheduledTime: string; // ISO string
  takenTime?: string; // ISO string, undefined if not taken yet
  skipped: boolean;
  notes?: string;
}

// Mock data
// export const mockPatients: Patient[] = [
//   {
//     id: "patient-1",
//     name: "Мария Петрова",
//     email: "patient@example.com",
//     doctorId: "doctor-1",
//     dateOfBirth: "1985-05-15",
//     phoneNumber: "0888123456",
//     medicalConditions: ["Хипертония", "Диабет тип 2"]
//   },
//   {
//     id: "patient-2",
//     name: "Георги Димитров",
//     email: "georgi@example.com",
//     doctorId: "doctor-1",
//     dateOfBirth: "1978-10-22",
//     phoneNumber: "0887654321",
//     medicalConditions: ["Астма"]
//   }
// ];

// export const mockMedications: Medication[] = [
//   {
//     id: "med-1",
//     patientId: "patient-1",
//     name: "Енаприл",
//     doses: [
//       { amount: 10, unit: "мг", time: "morning" },
//       { amount: 5, unit: "мг", time: "evening" }
//     ],
//     intakeMethod: "oral",
//     startDate: "2023-05-01",
//     endDate: "2023-12-31",
//     instructions: "Приемайте с храна",
//     sideEffects: ["Замаяност", "Суха кашлица"]
//   },
//   {
//     id: "med-2",
//     patientId: "patient-1",
//     name: "Метформин",
//     doses: [
//       { amount: 500, unit: "мг", time: "morning" },
//       { amount: 500, unit: "мг", time: "evening" }
//     ],
//     intakeMethod: "oral",
//     startDate: "2023-04-15",
//     endDate: "2023-12-31",
//     instructions: "Приемайте по време на хранене",
//     sideEffects: ["Гадене", "Стомашен дискомфорт"]
//   },
//   {
//     id: "med-3",
//     patientId: "patient-2",
//     name: "Вентолин",
//     doses: [
//       { amount: 2, unit: "впръсквания", time: "morning" },
//       { amount: 2, unit: "впръсквания", time: "evening" }
//     ],
//     intakeMethod: "inhalation",
//     startDate: "2023-06-01",
//     endDate: "2023-12-31",
//     instructions: "При нужда",
//     sideEffects: ["Тремор", "Главоболие"]
//   }
// ];

// Generate mock intakes for today
const generateMockIntakesForToday = (): MedicationIntake[] => {
  return [];
};

export const mockIntakes: MedicationIntake[] = generateMockIntakesForToday();
