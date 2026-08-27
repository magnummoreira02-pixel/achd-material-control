// Promisified IndexedDB wrapper
// Usage: const db = await idbPromise.open(dbName, version, upgradeCb)
//         const tx = db.transaction(store, 'readwrite');
//         store = tx.objectStore(store);
//         await store.add(value);
//         await tx.done

export function idbPromise() {
  // Minimal IDB wrapper - returns a promise that resolves with the db instance
  // This is a simplified version; for production, consider using the full 'idb' library
  let dbPromise = null;

  return {
    open: (name, version, upgradeCb) => {
      if (!dbPromise || dbPromise.name !== name) {
        dbPromise = new Promise((resolve, reject) => {
          const request = indexedDB.open(name, version);
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (upgradeCb) upgradeCb(event.target.transaction);
          };
          request.onsuccess = (event) => {
            resolve(event.target.result);
          };
          request.onerror = (event) => {
            reject(new Error("IndexedDB error: " + event.target.error));
          };
          request.onblocked = () => {
            // Optionally handle blocked state
          };
        });
      }
      return dbPromise;
    },
    // Helper to get a transaction and store
    transaction: (storeName, mode = "readonly") => {
      return {
        then: (fn) => {
          return dbPromise.then((db) => {
            const tx = db.transaction(storeName, mode);
            const store = tx.objectStore(storeName);
            return fn({ db, tx, store }).then((result) => {
              return tx.done.then(() => result);
            });
          });
        }
      };
    }
  };
}

// For the label template service, we'll use a more complete approach
// Export a ready-to-use promise-based IDB API

const PROMPTED_IDB = {
  open: (dbName, version, upgradeCb) =>
    new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (upgradeCb) upgradeCb(event.target.transaction);
      };
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
      request.onblocked = () => {/* handled */};
    })
};

// Helper: execute code inside a transaction and return result after transaction done
function transaction(db, storeName, mode, operation) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    try {
      const result = operation(store);
      // Wait for transaction to complete
      tx.oncomplete = () => resolve(result);
      tx.onerror = (event) => reject(event.target.error);
      tx.onabort = (event) => reject(event.target.error);
    } catch (e) {
      reject(e);
    }
  });
}

// Named exports for the service
export { PROMPTED_IDB as idb, transaction };

// Backward compatibility - keep the original export shape
export const idbPromise = PROMPTED_IDB;