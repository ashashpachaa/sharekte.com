import { createContext, useContext, useState, ReactNode } from "react";

export type Currency = "USD" | "AED" | "SAR" | "EUR" | "GBP";

export interface CurrencyRate {
  code: Currency;
  symbol: string;
  name: string;
  rate: number;
}

export const CURRENCY_RATES: Record<Currency, CurrencyRate> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", rate: 1 },
  AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham", rate: 3.67 },
  SAR: { code: "SAR", symbol: "﷼", name: "Saudi Riyal", rate: 3.75 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79 },
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceInUSD: number) => number;
  formatPrice: (priceInUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem("selectedCurrency");
      return (saved as Currency) || "GBP";
    } catch {
      return "GBP";
    }
  });

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem("selectedCurrency", newCurrency);
    } catch {
      console.error("Failed to save currency preference");
    }
  };

  const convertPrice = (priceInUSD: number): number => {
    const rate = CURRENCY_RATES[currency]?.rate || 1;
    return priceInUSD * rate;
  };

  const formatPrice = (priceInUSD: number): string => {
    const currencyInfo = CURRENCY_RATES[currency];
    const converted = convertPrice(priceInUSD);
    return `${currencyInfo.symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
