import { useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Medication } from "@/models/types";
import { useAuth } from "@/contexts/AuthContext";

export function usePatientMedications() {
  const { currentUser } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<{ [id: string]: any }>({});

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const q = query(collection(db, "medications"), where("patientId", "==", currentUser.id));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const meds = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Medication[];
      setMedications(meds);
      // Fetch all unique doctorIds
      const doctorIds = Array.from(new Set(meds.map((m: Medication) => m.doctorId).filter(Boolean)));
      const doctorData: { [id: string]: any } = {};
      await Promise.all(doctorIds.map(async (id) => {
        const docSnap = await getDoc(doc(db, "users", id));
        if (docSnap.exists()) doctorData[id] = docSnap.data();
      }));
      setDoctors(doctorData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  return { medications, loading, doctors };
}
