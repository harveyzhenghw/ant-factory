import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../services/firebase';
import { AntFarm, Ant } from '../types';
import { getUserFarms, createFarm, updateFarm, sanitizeFarm } from '../services/farmService';
import { computeDecay, applyCare, simulateAnts } from '../game/simulation';
import { applyXp } from '../services/progressionService';
import { addHoneydew } from '../services/economyService';
import { useAuth } from './AuthContext';

const TICK_INTERVAL = 30000;
const XP_PER_CARE = 10;
const HONEYDEW_PER_CARE = 5;

interface FarmContextValue {
  farms: AntFarm[];
  activeFarm: AntFarm | null;
  ants: Ant[];
  loading: boolean;
  error: string | null;
  care: (action: 'feed' | 'water' | 'clean') => Promise<void>;
  createNewFarm: (name: string) => Promise<AntFarm | undefined>;
  setActiveFarm: (farm: AntFarm) => void;
}

const FarmContext = createContext<FarmContextValue>({
  farms: [],
  activeFarm: null,
  ants: [],
  loading: true,
  error: null,
  care: async () => {},
  createNewFarm: async () => undefined,
  setActiveFarm: () => {},
});

export function FarmProvider({ children }: { children: ReactNode }) {
  const { user, refreshProfile } = useAuth();
  const userId = user?.uid;
  const [farms, setFarms] = useState<AntFarm[]>([]);
  const [activeFarm, setActiveFarm] = useState<AntFarm | null>(null);
  const [ants, setAnts] = useState<Ant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const farmRef = useRef<AntFarm | null>(null);

  useEffect(() => {
    farmRef.current = activeFarm;
  }, [activeFarm]);

  useEffect(() => {
    if (!userId) return;

    getUserFarms(userId).then(async (userFarms) => {
      if (userFarms.length === 0) {
        const newFarm = await createFarm(userId, 'My First Colony');
        userFarms = [newFarm];
      }
      setFarms(userFarms);
      setActiveFarm(userFarms[0]);
      setLoading(false);
    }).catch((e) => {
      setError(e.message);
      setLoading(false);
    });
  }, [userId]);

  useEffect(() => {
    if (!activeFarm?.id) return;

    const unsub = onValue(ref(db, `farms/${activeFarm.id}`), (snap) => {
      if (!snap.exists()) return;
      const data = sanitizeFarm({ ...(snap.val() as AntFarm), id: snap.key as string });
      const decayed = computeDecay(data);
      const updated = { ...data, ...decayed };
      setActiveFarm(updated);
      setAnts(simulateAnts(updated));
    });

    return unsub;
  }, [activeFarm?.id]);

  const care = useCallback(async (action: 'feed' | 'water' | 'clean') => {
    const farm = farmRef.current;
    if (!farm?.id || !userId) return;
    const updates = applyCare(farm, action);
    await updateFarm(farm.id, updates);
    await applyXp(userId, XP_PER_CARE);
    await addHoneydew(userId, HONEYDEW_PER_CARE);
    refreshProfile();
  }, [userId, refreshProfile]);

  const decayLoop = useCallback(async () => {
    const farm = farmRef.current;
    if (!farm?.id || !userId) return;
    const decayed = computeDecay(farm);
    const changed =
      decayed.foodLevel !== farm.foodLevel ||
      decayed.waterLevel !== farm.waterLevel ||
      decayed.cleanliness !== farm.cleanliness ||
      decayed.health !== farm.health ||
      decayed.population !== farm.population;
    if (changed) {
      await updateFarm(farm.id, decayed);
    }
    const income = Math.max(0, Math.floor((farm.population * farm.health) / 1000));
    if (income > 0) {
      await addHoneydew(userId, income);
      refreshProfile();
    }
    setAnts(simulateAnts({ ...farm, ...decayed }));
  }, [userId, refreshProfile]);

  useEffect(() => {
    tickRef.current = setInterval(decayLoop, TICK_INTERVAL);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [decayLoop]);

  const createNewFarm = useCallback(async (name: string) => {
    if (!userId) return;
    const farm = await createFarm(userId, name);
    setFarms((prev) => [...prev, farm]);
    setActiveFarm(farm);
    return farm;
  }, [userId]);

  return (
    <FarmContext.Provider value={{ farms, activeFarm, ants, loading, error, care, createNewFarm, setActiveFarm }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm(): FarmContextValue {
  return useContext(FarmContext);
}
