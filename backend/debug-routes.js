const express = require('express');
const app = express();

const safeUse = (path, handler) => {
    console.log(`Setting up route: ${path}`);
    if (!handler) {
        console.error(`ERROR: Handler for ${path} is undefined!`);
        return;
    }
    if (typeof handler !== 'function' && !(handler.handle || handler.route)) {
        console.error(`ERROR: Handler for ${path} is not a function/router! Type: ${typeof handler}`);
    }
    app.use(path, handler);
};

try {
    const authRoutes = require('./src/routes/authRoutes');
    safeUse('/api/auth', authRoutes);

    const userRoutes = require('./src/routes/userRoutes');
    safeUse('/api/users', userRoutes);

    const medicineRoutes = require('./src/routes/medicineRoutes');
    safeUse('/api/medicines', medicineRoutes);

    const prescriptionRoutes = require('./src/routes/prescriptionRoutes');
    safeUse('/api/prescriptions', prescriptionRoutes);

    const orderRoutes = require('./src/routes/orderRoutes');
    safeUse('/api/orders', orderRoutes);

    const adminRoutes = require('./src/routes/adminRoutes');
    safeUse('/api/admin', adminRoutes);

    const pharmacyRoutes = require('./src/routes/pharmacyRoutes');
    safeUse('/api/pharmacy', pharmacyRoutes);

    console.log('All routes loaded successfully in debug mode.');
} catch (e) {
    console.error('Crash during route loading:', e);
}
