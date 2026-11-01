import React, { createContext, useContext, useState, useEffect } from "react";
import { Requester } from "../types/requester";

export interface RequesterContextType {
  selectedRequester: Requester | null;
  setSelectedRequester: (requester: Requester | null) => void;
  clearSelectedRequester: () => void;
  isFormDirty: boolean;
  setIsFormDirty: (dirty: boolean) => void;
}

const STORAGE_KEY = "toktickit_selected_requester";

const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

export const RequesterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedRequester, setSelectedRequesterState] = useState<Requester | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isFormDirty, setIsFormDirty] = useState<boolean>(false);

  const setSelectedRequester = (requester: Requester | null) => {
    setSelectedRequesterState(requester);
    try {
      if (requester) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(requester));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  };

  const clearSelectedRequester = () => {
    setSelectedRequester(null);
    setIsFormDirty(false);
  };

  return (
    <RequesterContext.Provider
      value={{
        selectedRequester,
        setSelectedRequester,
        clearSelectedRequester,
        isFormDirty,
        setIsFormDirty,
      }}
    >
      {children}
    </RequesterContext.Provider>
  );
};

export const useRequester = (): RequesterContextType => {
  const context = useContext(RequesterContext);
  if (!context) {
    throw new Error("useRequester must be used within a RequesterProvider");
  }
  return context;
};
