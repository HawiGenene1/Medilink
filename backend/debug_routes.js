const express = require('express');
const app = require('./src/server.js'); // This might try to start the server if it's not exported correctly

// Actually, in server.js, app is not exported. It just listens.
// I need to modify server.js slightly to export app for testing, or just use a script to check the router.

const cashierRoutes = require('./src/routes/cashierRoutes');
console.log('Cashier Routes Stack:');
cashierRoutes.stack.forEach(layer => {
    if (layer.route) {
        console.log(`${Object.keys(layer.route.methods).join(',').toUpperCase()} ${layer.route.path}`);
    }
});
