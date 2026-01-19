import React, { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext(null);

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};

export const FavoritesProvider = ({ children }) => {
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('favorites');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }, [favorites]);

    const toggleFavorite = (medicine) => {
        setFavorites(prev => {
            const isFav = prev.find(item => item.id === medicine.id);
            if (isFav) {
                return prev.filter(item => item.id !== medicine.id);
            }
            return [...prev, medicine];
        });
    };

    const isFavorite = (id) => favorites.some(item => item.id === id);

    const value = {
        favorites,
        toggleFavorite,
        isFavorite
    };

    return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export default FavoritesContext;
