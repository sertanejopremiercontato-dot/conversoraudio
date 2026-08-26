/**
 * CLEAN RECEIPT STORE
 * Armazenamento persistente (IndexedDB com fallback localStorage) de recibos de limpeza criptográfica.
 * Não insere nenhum byte nos arquivos de áudio; a prova é conferida estritamente via hash SHA-256.
 */

import { CleanReceipt } from "./types";

const DB_NAME = "AudioForensicsStore_v1";
const STORE_NAME = "clean_receipts";
const DB_VERSION = 1;
const LOCAL_STORAGE_KEY = "audio_forensics_clean_receipts";

export class CleanReceiptStore {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        reject(new Error("IndexedDB not supported in this environment"));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "cleanedFileSha256" });
          store.createIndex("audioPayloadSha256", "audioPayloadSha256", { unique: false });
          store.createIndex("originalFileSha256", "originalFileSha256", { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Salva um recibo de limpeza no IndexedDB e no fallback localStorage
   */
  public static async saveReceipt(receipt: CleanReceipt): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(receipt);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      // Fallback para localStorage
      this.saveToLocalStorage(receipt);
    }
  }

  /**
   * Busca um recibo pelo SHA-256 do arquivo
   */
  public static async getReceiptByFileSha256(fileSha256: string): Promise<CleanReceipt | null> {
    if (!fileSha256) return null;

    try {
      const db = await this.getDB();
      const receipt = await new Promise<CleanReceipt | null>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(fileSha256);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      if (receipt) return receipt;
    } catch {
      // Fallback
    }

    return this.getFromLocalStorage(fileSha256);
  }

  /**
   * Busca recibo pelo hash do payload de áudio
   */
  public static async getReceiptByPayloadSha256(payloadSha256: string): Promise<CleanReceipt | null> {
    if (!payloadSha256) return null;

    try {
      const db = await this.getDB();
      const receipt = await new Promise<CleanReceipt | null>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index("audioPayloadSha256");
        const request = index.get(payloadSha256);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      if (receipt) return receipt;
    } catch {
      // Fallback
    }

    const all = this.getAllFromLocalStorage();
    return all.find((r) => r.audioPayloadSha256 === payloadSha256) || null;
  }

  /**
   * Retorna todos os recibos emitidos
   */
  public static async getAllReceipts(): Promise<CleanReceipt[]> {
    try {
      const db = await this.getDB();
      return await new Promise<CleanReceipt[]>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return this.getAllFromLocalStorage();
    }
  }

  // --- Helpers de Fallback LocalStorage ---

  private static saveToLocalStorage(receipt: CleanReceipt): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const list = this.getAllFromLocalStorage();
      const filtered = list.filter((r) => r.cleanedFileSha256 !== receipt.cleanedFileSha256);
      filtered.unshift(receipt);
      // Mantém últimos 200 recibos
      if (filtered.length > 200) filtered.length = 200;
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // Ignora erro de quota
    }
  }

  private static getFromLocalStorage(fileSha256: string): CleanReceipt | null {
    const list = this.getAllFromLocalStorage();
    return list.find((r) => r.cleanedFileSha256 === fileSha256) || null;
  }

  private static getAllFromLocalStorage(): CleanReceipt[] {
    if (typeof window === "undefined" || !window.localStorage) return [];
    try {
      const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
}
