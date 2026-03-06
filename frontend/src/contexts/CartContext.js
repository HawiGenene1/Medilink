import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (medicine, quantity = 1, pharmacyId, pharmacyName = 'Default Pharmacy') => {
        setCartItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(
                item => item.id === medicine.id && item.pharmacyId === pharmacyId
            );

            if (existingItemIndex > -1) {
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex].quantity += quantity;
                return updatedItems;
            }

            const priceStr = String(medicine.price?.basePrice || medicine.price || '0');
            const priceValue = parseFloat(priceStr.replace(/[^\d.]/g, '')) || 0;

            return [...prevItems, {
                ...medicine,
                quantity,
                pharmacyId,
                pharmacyName,
                priceValue,
                prescriptionId: medicine.prescriptionId,
                prescriptionImage: medicine.prescriptionImage,
                prescriptionRequired: medicine.prescriptionRequired || medicine.requiresPrescription,
                rxStatus: medicine.prescriptionId ? 'uploaded' : undefined
            }];
        });
    };

    const removeFromCart = (itemId, pharmacyId) => {
        setCartItems(prevItems => prevItems.filter(item => !(item.id === itemId && item.pharmacyId === pharmacyId)));
    };

    const updateQuantity = (itemId, pharmacyId, delta) => {
        setCartItems(prevItems => prevItems.map(item => {
            if (item.id === itemId && item.pharmacyId === pharmacyId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const getCartGroups = () => {
        const groups = {};
        cartItems.forEach(item => {
            const groupKey = item.pharmacyId || item.pharmacyName;
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    pharmacyId: item.pharmacyId,
                    pharmacyName: item.pharmacyName,
                    items: []
                };
            }
            groups[groupKey].items.push(item);
        });
        return Object.values(groups);
    };

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartGroups,
        totalItems: cartItems.reduce((acc, item) => acc + item.quantity, 0),
        subtotal: cartItems.reduce((acc, item) => acc + (item.priceValue * item.quantity), 0)
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
