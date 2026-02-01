import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const hexifyId = (id) => {
    if (!id) return null;
    const idStr = String(id);
    // Only accept valid 24-char hex strings (Real MongoDB IDs)
    if (idStr.length === 24 && /^[0-9a-fA-F]{24}$/.test(idStr)) {
        // BLACKLIST: Specifically reject the known stale mock IDs
        const blacklist = [
            '64f2a1b1e4b0a1b2c3d4e5f1',
            '64f2a1b1e4b0a1b2c3d4e5f2',
            '64f2a1b1e4b0a1b2c3d4e5f3',
            '64f2a1b1e4b0a1b2c3d4e5f4'
        ];
        if (blacklist.includes(idStr)) return null;
        return idStr;
    }
    return null; // Reject all other IDs (mocks, short numbers, etc)
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        if (!savedCart) return [];
        try {
            const parsed = JSON.parse(savedCart);
            // STRICT PURGE: Remove any item that doesn't have a valid real MongoDB ID
            return parsed
                .map(item => ({ ...item, id: hexifyId(item.id || item._id) }))
                .filter(item => item && item.id); // Only keep items with valid IDs
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (medicine, quantity = 1, pharmacy = 'Default Pharmacy') => {
        const activeId = hexifyId(medicine.id || medicine._id);

        if (!activeId) {
            console.warn('Blocked adding item with invalid/mock ID to cart:', medicine.name);
            return;
        }

        setCartItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(
                item => item.id === activeId && item.pharmacy === pharmacy
            );

            if (existingItemIndex > -1) {
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex].quantity += quantity;
                return updatedItems;
            }

            return [...prevItems, {
                ...medicine,
                id: activeId,
                _id: activeId,
                quantity,
                pharmacy,
                priceValue: parseFloat(String(medicine.priceValue || medicine.price || '0').replace(/[^\d.]/g, '') || '0')
            }];
        });
    };

    const removeFromCart = (itemId, pharmacy) => {
        const activeId = hexifyId(itemId);
        setCartItems(prevItems => prevItems.filter(item => !(item.id === activeId && item.pharmacy === pharmacy)));
    };

    const updateQuantity = (itemId, pharmacy, delta) => {
        const activeId = hexifyId(itemId);
        setCartItems(prevItems => prevItems.map(item => {
            if (item.id === activeId && item.pharmacy === pharmacy) {
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
            if (!groups[item.pharmacy]) {
                groups[item.pharmacy] = [];
            }
            groups[item.pharmacy].push(item);
        });
        return Object.keys(groups).map(pharmacy => ({
            pharmacy,
            items: groups[pharmacy]
        }));
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
