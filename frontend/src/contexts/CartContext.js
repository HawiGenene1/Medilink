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

    const addToCart = (medicine, quantity = 1, pharmacy = 'Default Pharmacy') => {
        setCartItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(
                item => item.id === medicine.id && item.pharmacy === pharmacy
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
                pharmacy,
                priceValue
            }];
        });
    };

    const removeFromCart = (itemId, pharmacy) => {
        setCartItems(prevItems => prevItems.filter(item => !(item.id === itemId && item.pharmacy === pharmacy)));
    };

    const updateQuantity = (itemId, pharmacy, delta) => {
        setCartItems(prevItems => prevItems.map(item => {
            if (item.id === itemId && item.pharmacy === pharmacy) {
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
