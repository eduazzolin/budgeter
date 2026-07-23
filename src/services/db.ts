import type { Period } from '../types';
import { db, isFirebaseEnabled } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  deleteField
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'budgeter_periods';

// Helper to generate IDs for local storage
const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

// --- Local Storage Implementation ---
const getLocalPeriods = (): Period[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as Period[];
  } catch (e) {
    console.error('Error parsing local periods', e);
    return [];
  }
};

const saveLocalPeriods = (periods: Period[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(periods));
};

export const dbService = {
  getPeriods: async (userId?: string): Promise<Period[]> => {
    if (isFirebaseEnabled() && db && userId) {
      try {
        const periodsRef = collection(db, 'periods');
        const q = query(periodsRef, where('userId', '==', userId));
        
        const querySnapshot = await getDocs(q);
        const periods: Period[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          periods.push({
            id: docSnap.id,
            name: data.name,
            startDate: data.startDate,
            endDate: data.endDate,
            initialBudget: Number(data.initialBudget),
            finalBudget: Number(data.finalBudget),
            currentBalance: data.currentBalance !== undefined ? Number(data.currentBalance) : undefined,
            currentBalanceDate: data.currentBalanceDate || undefined,
            balanceHistory: data.balanceHistory || {},
            createdAt: data.createdAt || new Date().toISOString(),
            userId: data.userId,
            sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined
          });
        });
        
        // Sort in memory to avoid custom index configuration
        return periods.sort((a, b) => {
          const orderA = a.sortOrder !== undefined ? a.sortOrder : Number.MIN_SAFE_INTEGER;
          const orderB = b.sortOrder !== undefined ? b.sortOrder : Number.MIN_SAFE_INTEGER;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      } catch (error) {
        console.error('Firebase getPeriods error:', error);
      }
    }
    
    // Local mode fallback
    let periods = getLocalPeriods();
    if (userId) {
      periods = periods.filter(p => p.userId === userId || !p.userId);
    }
    return periods.sort((a, b) => {
      const orderA = a.sortOrder !== undefined ? a.sortOrder : Number.MIN_SAFE_INTEGER;
      const orderB = b.sortOrder !== undefined ? b.sortOrder : Number.MIN_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  createPeriod: async (periodData: Omit<Period, 'id' | 'createdAt'>, userId?: string): Promise<Period> => {
    const newPeriod: Omit<Period, 'id'> = {
      ...periodData,
      createdAt: new Date().toISOString(),
      userId: userId || undefined
    };

    if (isFirebaseEnabled() && db && userId) {
      try {
        const periodsRef = collection(db, 'periods');
        const docRef = await addDoc(periodsRef, newPeriod);
        return {
          id: docRef.id,
          ...newPeriod
        };
      } catch (error) {
        console.error('Firebase createPeriod error, saving locally:', error);
      }
    }

    // Local mode fallback
    const periods = getLocalPeriods();
    const periodWithId: Period = {
      id: generateId(),
      ...newPeriod
    };
    periods.push(periodWithId);
    saveLocalPeriods(periods);
    return periodWithId;
  },

  updatePeriod: async (id: string, updates: Partial<Omit<Period, 'id' | 'createdAt'>>): Promise<void> => {
    if (isFirebaseEnabled() && db) {
      try {
        const docRef = doc(db, 'periods', id);
        const firestoreUpdates: any = { ...updates };
        Object.keys(firestoreUpdates).forEach(key => {
          if (firestoreUpdates[key] === undefined) {
            firestoreUpdates[key] = deleteField();
          }
        });
        await updateDoc(docRef, firestoreUpdates);
        return;
      } catch (error) {
        console.error('Firebase updatePeriod error, updating locally:', error);
      }
    }

    // Local mode fallback
    const periods = getLocalPeriods();
    const index = periods.findIndex(p => p.id === id);
    if (index !== -1) {
      const mergedPeriod = {
        ...periods[index],
        ...updates
      };
      Object.keys(updates).forEach(key => {
        if ((updates as any)[key] === undefined) {
          delete (mergedPeriod as any)[key];
        }
      });
      periods[index] = mergedPeriod;
      saveLocalPeriods(periods);
    }
  },

  deletePeriod: async (id: string): Promise<void> => {
    if (isFirebaseEnabled() && db) {
      try {
        const docRef = doc(db, 'periods', id);
        await deleteDoc(docRef);
        return;
      } catch (error) {
        console.error('Firebase deletePeriod error, deleting locally:', error);
      }
    }

    // Local mode fallback
    const periods = getLocalPeriods();
    const filtered = periods.filter(p => p.id !== id);
    saveLocalPeriods(filtered);
  },

  // Import local data to Firestore when user logs in or configures Firebase
  syncLocalToFirebase: async (userId: string): Promise<void> => {
    if (!isFirebaseEnabled() || !db) return;
    const localPeriods = getLocalPeriods();
    if (localPeriods.length === 0) return;

    try {
      const periodsRef = collection(db, 'periods');
      for (const p of localPeriods) {
        const newPeriod = {
          name: p.name,
          startDate: p.startDate,
          endDate: p.endDate,
          initialBudget: p.initialBudget,
          finalBudget: p.finalBudget,
          currentBalance: p.currentBalance !== undefined ? p.currentBalance : null,
          currentBalanceDate: p.currentBalanceDate || null,
          balanceHistory: p.balanceHistory || {},
          createdAt: p.createdAt,
          userId: userId,
          sortOrder: p.sortOrder !== undefined ? p.sortOrder : null
        };
        await addDoc(periodsRef, newPeriod);
      }
      // Clear local storage after successful sync to avoid duplicates
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.log('Successfully synced local periods to Firebase.');
    } catch (error) {
      console.error('Error syncing local data to Firebase:', error);
    }
  },

  // Delete all data for a specific user (LGPD compliance)
  deleteAllUserPeriods: async (userId: string): Promise<void> => {
    if (isFirebaseEnabled() && db && userId) {
      try {
        const periodsRef = collection(db, 'periods');
        const q = query(periodsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        const deletePromises: Promise<void>[] = [];
        querySnapshot.forEach((docSnap) => {
          deletePromises.push(deleteDoc(docSnap.ref));
        });
        
        await Promise.all(deletePromises);
        console.log(`Deleted ${deletePromises.length} periods for user ${userId}`);
      } catch (error) {
        console.error('Error deleting all user periods:', error);
        throw new Error('Falha ao excluir os dados do usuário no banco de dados.');
      }
    }
    
    // Always clear local data associated with this user as well
    const periods = getLocalPeriods();
    const filtered = periods.filter(p => p.userId !== userId && p.userId !== undefined);
    saveLocalPeriods(filtered);
  }
};
