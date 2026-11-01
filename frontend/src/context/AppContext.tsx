import React, { createContext, useState, useContext, useEffect } from 'react';

export interface Product {
  id: string;
  title: string;
  price: number;
  category?: string;
  image: string;
  description: string;
  isLiked?: boolean;
}

export interface ActivityNotice {
  id: string;
  productTitle: string;
  status: 'SUCCESS' | 'FAILED' | 'OUTBID';
  finalPrice: number;
  timestamp: string;
}

interface AppContextType {
  products: Product[];
  watchlist: Product[];
  activities: ActivityNotice[];
  activeAuctionItem: Product | null;
  toggleWatchlist: (product: Product) => void;
  setActiveAuctionItem: (product: Product) => void;
  addActivityNotice: (notice: ActivityNotice) => void;
  fetchProducts: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [watchlist, setWatchlist] = useState<Product[]>([]);
  const [activities, setActivities] = useState<ActivityNotice[]>([
    {
      id: 'a1',
      productTitle: 'Vintage Rolex Submariner',
      status: 'SUCCESS',
      finalPrice: 8500,
      timestamp: '10 mins ago',
    },
    {
      id: 'a2',
      productTitle: 'Limited Edition Sneakers',
      status: 'FAILED',
      finalPrice: 500,
      timestamp: '2 hours ago',
    },
  ]);
  const [activeAuctionItem, setActiveAuctionItem] = useState<Product | null>(null);

  // 向後端 API 請求 Supabase 裡的真實商品資料
  const fetchProducts = async () => {
    try {
      const response = await fetch('https://auction-backend-vgus.onrender.com/api/products');
      const data = await response.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products from backend:', error);
    }
  };

  // 程式初始化時自動抓取一次
  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleWatchlist = (product: Product) => {
    setWatchlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      } else {
        return [...prev, product];
      }
    });

    setProducts((prev) =>
      prev.map((item) =>
        item.id === product.id ? { ...item, isLiked: !item.isLiked } : item
      )
    );
  };

  const addActivityNotice = (notice: ActivityNotice) => {
    setActivities((prev) => [notice, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        products,
        watchlist,
        activities,
        activeAuctionItem,
        toggleWatchlist,
        setActiveAuctionItem,
        addActivityNotice,
        fetchProducts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};