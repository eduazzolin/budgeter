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
  where
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
            createdAt: data.createdAt || new Date().toISOString(),
            userId: data.userId
          });
        });
        
        // Sort in memory to avoid custom index configuration
        return periods.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (error) {
        console.error('Firebase getPeriods error:', error);
      }
    }
    
    // Local mode fallback
    let periods = getLocalPeriods();
    if (userId) {
      periods = periods.filter(p => p.userId === userId || !p.userId);
    }
    return periods.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
        await updateDoc(docRef, updates as any);
        return;
      } catch (error) {
        console.error('Firebase updatePeriod error, updating locally:', error);
      }
    }

    // Local mode fallback
    const periods = getLocalPeriods();
    const index = periods.findIndex(p => p.id === id);
    if (index !== -1) {
      periods[index] = {
        ...periods[index],
        ...updates
      };
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
          createdAt: p.createdAt,
          userId: userId
        };
        await addDoc(periodsRef, newPeriod);
      }
      // Clear local storage after successful sync to avoid duplicates
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.log('Successfully synced local periods to Firebase.');
    } catch (error) {
      console.error('Error syncing local data to Firebase:', error);
    }
  }
};
