import React, { createContext, useState, useContext } from 'react';

export interface Product {
  id: string;
  title: string;
  price: number;
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
}

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'Vintage Rolex Submariner',
    price: 8500,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    description: 'Classic 1980s luxury watch in excellent condition.',
  },
  {
    id: '2',
    title: 'Diamond Engagement Ring',
    price: 3200,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500',
    description: '18k White Gold with 1.5 Carat Diamond.',
  },
  {
    id: '3',
    title: 'Abstract Modern Oil Painting',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=500',
    description: 'Original hand-painted canvas art piece.',
  },
  {
    id: '4',
    title: 'Limited Edition Sneakers',
    price: 450,
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=500',
    description: 'Collector item, unworn size 10 US.',
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
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