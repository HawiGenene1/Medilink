import React, { createContext, useContext, useState, useEffect } from 'react';
import { App } from 'antd';
import { useAuth } from './AuthContext';
import api from '../services/api';

const FavoritesContext = createContext(null);

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};

export const FavoritesProvider = ({ children }) => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true); // Start loading true
    const { user } = useAuth();
    const { message } = App.useApp();

    // Fetch favorites from backend on mount or specific event
    const fetchFavorites = async () => {
        if (!user) {
            setFavorites([]);
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/favorites');
            // Assuming backend returns array of favorites where 'medicine' is populated
            // Map to extract just the medicine objects to match existing frontend structure
            // Or adjust frontend to use the favorite object structure.
            // Let's stick to storing medicine objects for now for easier compatibility
            const medicineList = response.data.map(fav => fav.medicine || fav);
            setFavorites(medicineList);
        } catch (error) {
            console.error('Failed to fetch favorites', error);
            // Don't show error message on initial load to avoid annoyance
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, [user]);

    const addToFavorites = async (medicine) => {
        if (!user) {
            message.warning('Please login to save favorites');
            return;
        }

        // Optimistic update
        const isAlreadyFavorite = favorites.some(item => item.id === medicine.id);
        if (isAlreadyFavorite) {
            message.info('Already in favorites');
            return;
        }

        const newFavorites = [...favorites, medicine];
        setFavorites(newFavorites);

        try {
            await api.post('/favorites', { medicineId: medicine.id });
            message.success('Added to favorites');
        } catch (error) {
            // Revert on failure
            setFavorites(favorites);
            console.error('Failed to add favorite', error);
            message.error('Failed to save favorite');
        }
    };

    const removeFromFavorites = async (medicineId) => {
        // Optimistic update
        const newFavorites = favorites.filter(item => item.id !== medicineId);
        setFavorites(newFavorites);

        try {
            await api.delete(`/favorites/${medicineId}`);
            message.success('Removed from favorites');
        } catch (error) {
            // Revert on failure
            const item = favorites.find(i => i.id === medicineId);
            if (item) setFavorites([...newFavorites, item]);
            // Or just refetch to be safe
            // fetchFavorites();
            console.error('Failed to remove favorite', error);
            message.error('Failed to remove favorite');
        }
    };

    const isFavorite = (medicineId) => {
        return favorites.some(item => item.id === medicineId);
    };

    return (
        <FavoritesContext.Provider value={{ favorites, addToFavorites, removeFromFavorites, isFavorite, loading }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export default FavoritesContext;
