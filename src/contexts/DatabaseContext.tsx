'use client';
import { createContext, useContext, useMemo } from 'react';

import * as database from '@/lib/firebase/database';

interface DatabaseContextType {
  user: typeof database.userOperations;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export const DatabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useMemo(() => ({
    user: database.userOperations
  }), []);

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}; 