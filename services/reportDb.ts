
import { ChatMessage, SavedReport } from '../types';

const DB_NAME = 'ReportsDB';
const STORE_NAME = 'reports';
const DB_VERSION = 1;

let db: IDBDatabase;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject("Error opening database");

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

export const addReport = async (title: string, message: ChatMessage): Promise<void> => {
  const db = await openDb();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  const savedReport: Omit<SavedReport, 'id'> = {
    title,
    message,
    createdAt: Date.now(),
  };
  
  return new Promise((resolve, reject) => {
    const request = store.add(savedReport);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Error adding report to the database."));
  });
};

export const updateReport = async (id: number, title: string, message: ChatMessage): Promise<void> => {
  const db = await openDb();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const existingReport = getRequest.result;
      if (!existingReport) {
        return reject(new Error(`Report with id ${id} not found.`));
      }
      const updatedReport = { ...existingReport, title, message };
      const putRequest = store.put(updatedReport);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(new Error("Error updating report in the database."));
    };
    getRequest.onerror = () => reject(new Error("Error fetching report to update."));
  });
};

export const getAllReports = async (): Promise<SavedReport[]> => {
  const db = await openDb();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
        // Sort by most recent first
        const sortedReports = request.result.sort((a, b) => b.createdAt - a.createdAt);
        resolve(sortedReports);
    };
    request.onerror = () => reject(new Error("Error fetching reports from the database."));
  });
};

export const deleteReport = async (id: number): Promise<void> => {
  const db = await openDb();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Error deleting report from the database."));
  });
};
