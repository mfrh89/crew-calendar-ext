import { storage } from 'wxt/utils/storage';
import type { CalDAVConfig } from '../types';

interface StoredCredentials {
  serverUrl: string;
  username: string;
  encryptedPassword: string;
  iv: string;
  keyData: string;
  authMethod: 'Basic' | 'OAuth';
}

const credentialsStorage = storage.defineItem<StoredCredentials | null>('local:credentials', {
  defaultValue: null,
});

async function importKey(raw: string): Promise<CryptoKey> {
  const keyBytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
}

async function generateKey(): Promise<{ key: CryptoKey; exported: string }> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
  const raw = await crypto.subtle.exportKey('raw', key);
  const exported = btoa(String.fromCharCode(...new Uint8Array(raw)));
  return { key, exported };
}

export async function saveCredentials(config: CalDAVConfig): Promise<void> {
  const { key, exported } = await generateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(config.password);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  );

  await credentialsStorage.setValue({
    serverUrl: config.serverUrl,
    username: config.username,
    encryptedPassword: btoa(
      String.fromCharCode(...new Uint8Array(encrypted)),
    ),
    iv: btoa(String.fromCharCode(...iv)),
    keyData: exported,
    authMethod: config.authMethod,
  });
}

export async function loadCredentials(): Promise<CalDAVConfig | null> {
  const stored = await credentialsStorage.getValue();
  if (!stored) return null;

  const key = await importKey(stored.keyData);
  const iv = Uint8Array.from(atob(stored.iv), (c) => c.charCodeAt(0));
  const encrypted = Uint8Array.from(atob(stored.encryptedPassword), (c) =>
    c.charCodeAt(0),
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted,
  );

  const password = new TextDecoder().decode(decrypted);

  return {
    serverUrl: stored.serverUrl,
    username: stored.username,
    password,
    authMethod: stored.authMethod,
  };
}

export async function clearCredentials(): Promise<void> {
  await credentialsStorage.setValue(null);
}

export async function hasCredentials(): Promise<boolean> {
  const stored = await credentialsStorage.getValue();
  return stored !== null;
}
