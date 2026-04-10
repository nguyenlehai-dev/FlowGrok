/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { systemApi } from '../api/client';
import {
  clearRuntimeClientApiKey,
  getRuntimeApiBaseUrl,
  getRuntimeClientApiKey,
  setRuntimeApiBaseUrl,
  setRuntimeClientApiKey,
} from '../utils/runtimeConfig';

type VerifiedClientInfo = {
  apiKeyMasked: string;
  profileCount: number;
};

type SystemAuthContextValue = {
  apiBaseUrl: string;
  clientApiKey: string;
  verifiedInfo: VerifiedClientInfo | null;
  isVerified: boolean;
  isVerifying: boolean;
  verifyKey: (apiBaseUrl: string, clientApiKey: string) => Promise<void>;
  clearKey: () => void;
};

const SystemAuthContext = createContext<SystemAuthContextValue | undefined>(undefined);

function maskKey(rawKey: string) {
  if (rawKey.length <= 12) return rawKey;
  return `${rawKey.slice(0, 8)}****************${rawKey.slice(-4)}`;
}

export function SystemAuthProvider({ children }: PropsWithChildren) {
  const [apiBaseUrl, setApiBaseUrlState] = useState(getRuntimeApiBaseUrl());
  const [clientApiKey, setClientApiKeyState] = useState(getRuntimeClientApiKey());
  const [verifiedInfo, setVerifiedInfo] = useState<VerifiedClientInfo | null>(null);
  const [isVerifying, setIsVerifying] = useState(Boolean(getRuntimeClientApiKey()));

  const verifyKey = useCallback(async (nextApiBaseUrl: string, nextClientApiKey: string) => {
    const trimmedBaseUrl = nextApiBaseUrl.trim() || '/api/v1';
    const trimmedKey = nextClientApiKey.trim();
    if (!trimmedKey) {
      throw new Error('Gateway API key is required');
    }

    setIsVerifying(true);
    try {
      const profiles = await systemApi.verifyClientKey(trimmedBaseUrl, trimmedKey);
      setRuntimeApiBaseUrl(trimmedBaseUrl);
      setRuntimeClientApiKey(trimmedKey);
      setApiBaseUrlState(trimmedBaseUrl);
      setClientApiKeyState(trimmedKey);
      setVerifiedInfo({
        apiKeyMasked: maskKey(trimmedKey),
        profileCount: profiles.length,
      });
    } catch (error) {
      clearRuntimeClientApiKey();
      setClientApiKeyState('');
      setVerifiedInfo(null);
      throw error;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const clearKey = useCallback(() => {
    clearRuntimeClientApiKey();
    setClientApiKeyState('');
    setVerifiedInfo(null);
  }, []);

  useEffect(() => {
    const existingKey = getRuntimeClientApiKey();
    const existingBaseUrl = getRuntimeApiBaseUrl();
    if (!existingKey) {
      setVerifiedInfo(null);
      setIsVerifying(false);
      return;
    }

    void verifyKey(existingBaseUrl, existingKey).catch(() => {
      clearRuntimeClientApiKey();
      setVerifiedInfo(null);
      setIsVerifying(false);
    });
  }, [verifyKey]);

  const value = useMemo(
    () => ({
      apiBaseUrl,
      clientApiKey,
      verifiedInfo,
      isVerified: Boolean(verifiedInfo),
      isVerifying,
      verifyKey,
      clearKey,
    }),
    [apiBaseUrl, clientApiKey, verifiedInfo, isVerifying, verifyKey, clearKey],
  );

  return <SystemAuthContext.Provider value={value}>{children}</SystemAuthContext.Provider>;
}

export function useSystemAuth() {
  const context = useContext(SystemAuthContext);
  if (!context) {
    throw new Error('useSystemAuth must be used within SystemAuthProvider');
  }
  return context;
}
