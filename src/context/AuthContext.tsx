import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { FirebaseUserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: FirebaseUserRole | null;
  assignedPartnerCodes: string[];
  loading: boolean;
  canAccessPartnerCode: (partnerCode: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  assignedPartnerCodes: [],
  loading: true,
  canAccessPartnerCode: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<FirebaseUserRole | null>(null);
  const [assignedPartnerCodes, setAssignedPartnerCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user can access a specific partner code based on role
  const canAccessPartnerCode = useCallback((partnerCode: string): boolean => {
    if (role === 'super_admin') return true;
    if (role === 'regional' || role === 'community') {
      return assignedPartnerCodes.includes(partnerCode);
    }
    return false;
  }, [role, assignedPartnerCodes]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (currentUser.email === 'talelbenghorbel@gmail.com') {
            // GOD MODE: Force super_admin
            setRole('super_admin');
            setAssignedPartnerCodes([]);
            if (!userDoc.exists() || userDoc.data()?.role !== 'super_admin') {
              await setDoc(userDocRef, {
                 uid: currentUser.uid,
                 email: currentUser.email,
                 role: 'super_admin',
                 assignedPartnerCodes: [],
                 createdAt: userDoc.exists() ? userDoc.data()?.createdAt : new Date().toISOString(),
                 lastLogin: new Date().toISOString()
              }, { merge: true });
            }
          } else {
            // Normal User
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setRole(userData.role as FirebaseUserRole);
              setAssignedPartnerCodes(userData.assignedPartnerCodes || userData.assignedCodes || []);
              // Update lastLogin
              await setDoc(userDocRef, { lastLogin: new Date().toISOString() }, { merge: true });
            } else {
               // Create new user with default role
               const newUser = {
                 uid: currentUser.uid,
                 email: currentUser.email,
                 role: 'user' as FirebaseUserRole,
                 assignedPartnerCodes: [],
                 createdAt: new Date().toISOString(),
                 lastLogin: new Date().toISOString()
               };
               await setDoc(userDocRef, newUser);
               setRole('user');
               setAssignedPartnerCodes([]);
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
          setAssignedPartnerCodes([]);
        }
      } else {
        setUser(null);
        setRole(null);
        setAssignedPartnerCodes([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, assignedPartnerCodes, loading, canAccessPartnerCode }}>
      {children}
    </AuthContext.Provider>
  );
};
