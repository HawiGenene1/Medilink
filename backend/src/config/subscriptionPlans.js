const SUBSCRIPTION_PLANS = {
    basic: {
        name: 'Basic',
        price: 0,
        currency: 'ETB',
        label: 'Free',
        features: ['Pharmacy Profile', 'Listing Services', 'Basic Dashboard'],
        maxStaff: 1
    },
    standard: {
        name: 'Standard',
        price: 500,
        currency: 'ETB',
        label: '500 ETB/mo',
        features: ['Operational Insights', 'Auditing Tools', 'Performance Reports', 'Priority Support'],
        maxStaff: 3
    },
    premium: {
        name: 'Premium',
        price: 1200,
        currency: 'ETB',
        label: '1200 ETB/mo',
        features: ['Full Platform Suite', 'Advanced Analytics', 'Dedicated Support', 'Strategic Insights'],
        maxStaff: 10
    }
};

module.exports = SUBSCRIPTION_PLANS;
