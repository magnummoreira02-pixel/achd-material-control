import { useEffect, useRef } from "react";

export function useAutoSaveInventory(estoqueDataRef, dirtyRef) {
  const lastSaveRef = useRef(null);
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!dirtyRef.current) return;
      try {
        const res = await fetch("http://localhost:3001/save-inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: estoqueDataRef.current || [] }),
        });
        if (res.ok) {
          dirtyRef.current = false;
          lastSaveRef.current = new Date().toISOString();
        }
      } catch (e) {
        console.error("Auto-save falhou:", e.message);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  return lastSaveRef;
}
