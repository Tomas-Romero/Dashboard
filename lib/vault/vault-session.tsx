"use client";

import * as React from "react";
import {
  deriveKey,
  deriveVerifier,
  generateSalt,
} from "@/lib/crypto/vault-encryption";
import type { VaultVerifierInfo } from "@/lib/actions/vault";

interface VaultSessionState {
  configured: boolean;
  unlocked: boolean;
  encryptionSalt: string | null;
  masterKey: CryptoKey | null;
  unlock: (passphrase: string) => Promise<boolean>;
  setup: (passphrase: string) => Promise<{
    verifier_hash: string;
    verifier_salt: string;
    encryption_salt: string;
    key: CryptoKey;
  }>;
  lock: () => void;
}

const VaultSessionContext = React.createContext<VaultSessionState | null>(null);

export function VaultSessionProvider({
  info,
  children,
}: {
  info: VaultVerifierInfo;
  children: React.ReactNode;
}) {
  const [masterKey, setMasterKey] = React.useState<CryptoKey | null>(null);

  const unlock = React.useCallback(
    async (passphrase: string) => {
      if (!info.verifier_salt || !info.verifier_hash || !info.encryption_salt) {
        return false;
      }
      const verifier = await deriveVerifier(passphrase, info.verifier_salt);
      if (verifier !== info.verifier_hash) return false;

      const key = await deriveKey(passphrase, info.encryption_salt);
      setMasterKey(key);
      return true;
    },
    [info]
  );

  const setup = React.useCallback(async (passphrase: string) => {
    const verifierSalt = generateSalt();
    const encryptionSalt = generateSalt();
    const verifierHash = await deriveVerifier(passphrase, verifierSalt);
    const key = await deriveKey(passphrase, encryptionSalt);
    setMasterKey(key);
    return {
      verifier_hash: verifierHash,
      verifier_salt: verifierSalt,
      encryption_salt: encryptionSalt,
      key,
    };
  }, []);

  const lock = React.useCallback(() => setMasterKey(null), []);

  return (
    <VaultSessionContext.Provider
      value={{
        configured: info.configured,
        unlocked: masterKey !== null,
        encryptionSalt: info.encryption_salt ?? null,
        masterKey,
        unlock,
        setup,
        lock,
      }}
    >
      {children}
    </VaultSessionContext.Provider>
  );
}

export function useVaultSession() {
  const ctx = React.useContext(VaultSessionContext);
  if (!ctx) throw new Error("useVaultSession must be used within VaultSessionProvider");
  return ctx;
}
