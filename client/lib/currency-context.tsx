import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type Currency = "USD" | "AED" | "SAR" | "EUR" | "GBP";

export interface CurrencyRate {
  code: Currency;
  symbol: string;
  name: string;
  rate: number;
}

// Default fallback rates (used if API fails)
const DEFAULT_RATES: Record<Currency, CurrencyRate> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", rate: 1 },
  AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham", rate: 3.67 },
  SAR: { code: "SAR", symbol: "﷼", name: "Saudi Riyal", rate: 3.75 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79 },
};

export let CURRENCY_RATES: Record<Currency, CurrencyRate> = DEFAULT_RATES;

// Fetch real-time exchange rates
async function fetchExchangeRates() {
  try {
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD"
    );
    if (!response.ok) throw new Error("Failed to fetch rates");

    const data = await response.json();
    const rates = data.rates;

    CURRENCY_RATES = {
      USD: { code: "USD", symbol: "$", name: "US Dollar", rate: 1 },
      AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham", rate: rates.AED || 3.67 },
      SAR: { code: "SAR", symbol: "﷼", name: "Saudi Riyal", rate: rates.SAR || 3.75 },
      EUR: { code: "EUR", symbol: "€", name: "Euro", rate: rates.EUR || 0.92 },
      GBP: { code: "GBP", symbol: "£", name: "British Pound", rate: rates.GBP || 0.79 },
    };

    localStorage.setItem("currencyRates", JSON.stringify(CURRENCY_RATES));
    localStorage.setItem("currencyRatesTimestamp", Date.now().toString());
  } catch (error) {
    console.warn("Failed to fetch live exchange rates, using defaults:", error);
    const cached = localStorage.getItem("currencyRates");
    if (cached) {
      try {
        CURRENCY_RATES = JSON.parse(cached);
      } catch {
        CURRENCY_RATES = DEFAULT_RATES;
      }
    }
  }
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (priceInUSD: number) => number;
  formatPrice: (priceInUSD: number) => string;
  rates: Record<Currency, CurrencyRate>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem("selectedCurrency");
      return (saved as Currency) || "USD";
    } catch {
      return "USD";
    }
  });

  const [rates, setRates] = useState<Record<Currency, CurrencyRate>>(CURRENCY_RATES);

  // Fetch exchange rates on mount and periodically refresh
  useEffect(() => {
    // Load cached rates if available and recent (less than 24 hours old)
    const cachedRates = localStorage.getItem("currencyRates");
    const cachedTimestamp = localStorage.getItem("currencyRatesTimestamp");
    const now = Date.now();
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

    if (
      cachedRates &&
      cachedTimestamp &&
      now - parseInt(cachedTimestamp) < CACHE_DURATION
    ) {
      try {
        const parsed = JSON.parse(cachedRates);
        setRates(parsed);
        return;
      } catch {
        // Fall through to fetch fresh data
      }
    }

    // Fetch fresh rates
    fetchExchangeRates().then(() => {
      setRates(CURRENCY_RATES);
    });
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem("selectedCurrency", newCurrency);
    } catch {
      console.error("Failed to save currency preference");
    }
  };

  const convertPrice = (priceInUSD: number): number => {
    const rate = rates[currency]?.rate || 1;
    return priceInUSD * rate;
  };

  const formatPrice = (priceInUSD: number): string => {
    const currencyInfo = rates[currency];
    if (!currencyInfo) return `$${priceInUSD.toLocaleString()}`;

    const converted = convertPrice(priceInUSD);
    return `${currencyInfo.symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, formatPrice, rates }}>
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
