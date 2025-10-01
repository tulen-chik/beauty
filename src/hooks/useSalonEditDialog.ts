import { useCallback,useState } from 'react';

import type { Salon } from '@/types/database';

export function useSalonEditDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSalon, setCurrentSalon] = useState<Salon | null>(null);

  const openDialog = useCallback((salon?: Salon) => {
    setCurrentSalon(salon || null);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    // Small delay to allow the dialog to close before resetting the current salon
    setTimeout(() => setCurrentSalon(null), 300);
  }, []);

  return {
    isOpen,
    currentSalon,
    openDialog,
    closeDialog,
  };
}
