import { useEffect, useState } from "react";
import { StoredContract } from "@/types/contracts";

const STORAGE_KEY = "campuslands_contracts_v1";

export const useStoredContracts = () => {
  const [contracts, setContracts] = useState<StoredContract[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as StoredContract[];
      setContracts(parsed);
    } catch (error) {
      console.error("Error al recuperar contratos guardados:", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
  }, [contracts]);

  return {
    contracts,
    setContracts,
  };
};
