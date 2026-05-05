import React, { createContext, useContext, useMemo, useState } from "react";

const defaultBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const defaultUseMock = (process.env.EXPO_PUBLIC_USE_MOCK ?? "true").toLowerCase() !== "false";

type ThemeMode = "dark" | "light";

type AppContextState = {
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  useMockApi: boolean;
  setUseMockApi: (next: boolean) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
};

const AppContext = createContext<AppContextState | undefined>(undefined);

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(defaultBaseUrl);
  const [useMockApi, setUseMockApi] = useState<boolean>(defaultUseMock);
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const value = useMemo(
    () => ({ apiBaseUrl, setApiBaseUrl, useMockApi, setUseMockApi, theme, toggleTheme }),
    [apiBaseUrl, useMockApi, theme]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextState => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return ctx;
};
