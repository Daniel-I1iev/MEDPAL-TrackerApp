import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  User as FirebaseUser, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

// Define user types
export type UserRole = "doctor" | "patient";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture?: string;
  uin?: string; // УИН for doctors
}

// Define the context interface
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole, profilePicture?: string, uin?: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, "id">;
            setCurrentUser({
              id: firebaseUser.uid,
              ...userData,
            });
          } else {
            // Handle case where user is authenticated but no data in Firestore
            setCurrentUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Firebase login function
  const login = async (email: string, password: string, role: UserRole) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      
      // Verify that user has the correct role
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role !== role) {
          await signOut(auth);
          throw new Error(`You're not registered as a ${role}`);
        }
      } else {
        await signOut(auth);
        throw new Error("User data not found");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Firebase register function
  const register = async (name: string, email: string, password: string, role: UserRole, profilePicture?: string, uin?: string) => {
    setLoading(true);
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Prepare user data for Firestore
      const userData: any = {
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      };
      if (profilePicture !== undefined && profilePicture !== "") {
        userData.profilePicture = profilePicture;
      }
      if (role === "doctor" && uin) {
        userData.uin = uin;
      }
      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), userData);
      // If registering as patient, also add to 'patients' collection
      if (role === "patient") {
        await setDoc(doc(db, "patients", user.uid), {
          name,
          email,
          doctorId: "", // Will be set when a doctor adds this patient
          dateOfBirth: "",
          phoneNumber: "",
          medicalConditions: [],
          createdAt: new Date().toISOString(),
        });
      }
      // Set the current user
      setCurrentUser({
        id: user.uid,
        name,
        email,
        role,
        ...(profilePicture !== undefined && profilePicture !== "" ? { profilePicture } : {}),
        ...(role === "doctor" && uin ? { uin } : {}),
      });
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        alert("Този имейл вече е регистриран. Моля, използвайте друг или влезте.");
      }
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Firebase logout function
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
