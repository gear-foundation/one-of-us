import { useCallback, useState, useEffect } from 'react';
import { openPasskeyAuthPopupAndWait } from './passkeyPopup';

const PROGRAM_ID_STORAGE_KEY = 'varauth_program_id';

export function getProgramId(): `0x${string}` | null {
  const value = localStorage.getItem(PROGRAM_ID_STORAGE_KEY);
  return value && value.startsWith('0x') ? (value as `0x${string}`) : null;
}

export function setProgramId(programId: `0x${string}`): void {
  localStorage.setItem(PROGRAM_ID_STORAGE_KEY, programId);
}

export function removeProgramId(): void {
  localStorage.removeItem(PROGRAM_ID_STORAGE_KEY);
}

export function useVaraAuth() {
  const [programId, setProgramIdState] = useState<`0x${string}` | null>(getProgramId);

  useEffect(() => {
    setProgramIdState(getProgramId());
  }, []);

  const setProgramId = useCallback((id: `0x${string}`) => {
    localStorage.setItem(PROGRAM_ID_STORAGE_KEY, id);
    setProgramIdState(id);
  }, []);

  const authenticateWithPasskey = useCallback(async (): Promise<`0x${string}`> => {
    const id = await openPasskeyAuthPopupAndWait();
    setProgramId(id);
    return id;
  }, [setProgramId]);

  const clearProgramId = useCallback(() => {
    removeProgramId();
    setProgramIdState(null);
  }, []);

  return {
    varauthProgramId: programId,
    setProgramId,
    clearProgramId,
    authenticateWithPasskey,
  };
}
