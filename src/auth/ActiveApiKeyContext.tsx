/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useCallback } from 'react';
import type { ApiKeyItem } from '../modules/api-keys/models/apiKey';
import { fetchApiKeys } from '../modules/api-keys/services/apiKeyService';
import { useAuthStore } from '../store/authStore';

type ActiveApiKeyContextValue = {
  keys: ApiKeyItem[];
  hasActiveKey: boolean;
  isChecking: boolean;
  refreshKeys: () => Promise<void>;
};

const ActiveApiKeyContext = createContext<ActiveApiKeyContextValue | undefined>(undefined);

export function ActiveApiKeyProvider({ children }: PropsWithChildren) {
  const { token } = useAuthStore();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isChecking, setIsChecking] = useState(Boolean(token));

  const refreshKeys = useCallback(async () => {
    if (!token) {
      setKeys([]);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    try {
      const data = await fetchApiKeys();
      setKeys(data);
    } catch {
      setKeys([]);
    } finally {
      setIsChecking(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshKeys();
  }, [refreshKeys]);

  const value = useMemo(
    () => ({
      keys,
      hasActiveKey: keys.some((item) => item.status === 'active'),
      isChecking,
      refreshKeys,
    }),
    [isChecking, keys, refreshKeys],
  );

  return <ActiveApiKeyContext.Provider value={value}>{children}</ActiveApiKeyContext.Provider>;
}

export function useActiveApiKey() {
  const context = useContext(ActiveApiKeyContext);
  if (!context) {
    throw new Error('useActiveApiKey must be used within ActiveApiKeyProvider');
  }
  return context;
}
