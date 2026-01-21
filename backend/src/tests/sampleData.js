const Medicine = require('../models/Medicine');
const Order = require('../models/Order');
const Category = require('../models/Category');

/**
 * Sample data for testing filtering functionality
 */

const sampleCategories = [
  { name: 'Pain Relief', slug: 'pain-relief', description: 'Medications for pain management' },
  { name: 'Antibiotics', slug: 'antibiotics', description: 'Antibiotic medications' },
  { name: 'Vitamins', slug: 'vitamins', description: 'Vitamin supplements' },
  { name: 'Medical Equipment', slug: 'medical-equipment', description: 'Medical devices and equipment' }
];

const sampleMedicines = [
  {
    name: 'Aspirin 500mg',
    description: 'Pain relief and fever reducer',
    price: 12.99,
    stock: 150,
    category: 'otc',
    manufacturer: 'PharmaCorp',
    requiresPrescription: false,
    dosage: '500mg tablets'
  },
  {
    name: 'Amoxicillin 250mg',
    description: 'Antibiotic for bacterial infections',
    price: 25.50,
    stock: 75,
    category: 'prescription',
    manufacturer: 'MediTech',
    requiresPrescription: true,
    dosage: '250mg capsules'
  },
  {
    name: 'Ibuprofen 400mg',
    description: 'Anti-inflammatory pain medication',
    price: 15.99,
    stock: 200,
    category: 'otc',
    manufacturer: 'PharmaCorp',
    requiresPrescription: false,
    dosage: '400mg tablets'
  },
  {
    name: 'Vitamin D3 1000IU',
    description: 'Vitamin D supplement for bone health',
    price: 8.99,
    stock: 300,
    category: 'supplement',
    manufacturer: 'HealthPlus',
    requiresPrescription: false,
    dosage: '1000IU softgels'
  },
  {
    name: 'Blood Pressure Monitor',
    description: 'Digital blood pressure monitoring device',
    price: 89.99,
    stock: 25,
    category: 'equipment',
    manufacturer: 'MedTech Devices',
    requiresPrescription: false,
    dosage: 'N/A'
  },
  {
    name: 'Cough Syrup 200ml',
    description: 'Relief for cough and sore throat',
    price: 9.99,
    stock: 0,
    category: 'otc',
    manufacturer: 'PharmaCorp',
    requiresPrescription: false,
    dosage: '10ml every 4 hours'
  },
  {
    name: 'Insulin Pen',
    description: 'Insulin delivery device for diabetes',
    price: 149.99,
    stock: 50,
    category: 'equipment',
    manufacturer: 'DiabetesCare',
    requiresPrescription: true,
    dosage: 'As prescribed'
  },
  {
    name: 'Antibiotic Ointment',
    description: 'Topical antibiotic for skin infections',
    price: 6.99,
    stock: 100,
    category: 'otc',
    manufacturer: 'MediTech',
    requiresPrescription: false,
    dosage: 'Apply to affected area'
  }
];

const sampleOrders = [
  {
    orderNumber: 'ORD-001',
    customer: '60f1b2c3d4e5f6789012345',
    pharmacy: '60f1b2c3d4e5f6789012346',
    items: [
      {
        medicine: '60f1b2c3d4e5f6789012347',
        name: 'Aspirin 500mg',
        price: 12.99,
        quantity: 2,
        subtotal: 25.98
      }
    ],
    totalAmount: 25.98,
    finalAmount: 25.98,
    status: 'delivered',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    address: {
      street: '123 Main St',
      city: 'Addis Ababa',
      country: 'Ethiopia'
    }
  },
  {
    orderNumber: 'ORD-002',
    customer: '60f1b2c3d4e5f6789012348',
    pharmacy: '60f1b2c3d4e5f6789012346',
    items: [
      {
        medicine: '60f1b2c3d4e5f6789012348',
        name: 'Amoxicillin 250mg',
        price: 25.50,
        quantity: 1,
        subtotal: 25.50
      }
    ],
    totalAmount: 25.50,
    finalAmount: 25.50,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'cash',
    address: {
      street: '456 Oak Ave',
      city: 'Addis Ababa',
      country: 'Ethiopia'
    }
  },
  {
    orderNumber: 'ORD-003',
    customer: '60f1b2c3d4e5f6789012345',
    pharmacy: '60f1b2c3d4e5f6789012346',
    items: [
      {
        medicine: '60f1b2c3d4e5f6789012349',
        name: 'Vitamin D3 1000IU',
        price: 8.99,
        quantity: 3,
        subtotal: 26.97
      }
    ],
    totalAmount: 26.97,
    finalAmount: 26.97,
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'mobile_money',
    address: {
      street: '123 Main St',
      city: 'Addis Ababa',
      country: 'Ethiopia'
    }
  }
];

/**
 * Create sample data for testing
 */
async function createSampleData() {
  try {
    console.log('Creating sample categories...');
    const categories = await Category.insertMany(sampleCategories);
    console.log(`Created ${categories.length} categories`);

    console.log('Creating sample medicines...');
    const medicines = await Medicine.insertMany(sampleMedicines);
    console.log(`Created ${medicines.length} medicines`);

    console.log('Creating sample orders...');
    const orders = await Order.insertMany(sampleOrders);
    console.log(`Created ${orders.length} orders`);

    return { categories, medicines, orders };
  } catch (error) {
    console.error('Error creating sample data:', error);
    throw error;
  }
}

/**
 * Clear sample data
 */
async function clearSampleData() {
  try {
    await Medicine.deleteMany({});
    await Order.deleteMany({});
    await Category.deleteMany({});
    console.log('Cleared all sample data');
  } catch (error) {
    console.error('Error clearing sample data:', error);
    throw error;
  }
}

/**
 * Test scenarios for filtering
 */
const testScenarios = {
  medicines: [
    {
      name: 'Filter by category - OTC',
      query: { category: 'otc' },
      expectedCount: 4
    },
    {
      name: 'Filter by manufacturer - PharmaCorp',
      query: { manufacturer: 'PharmaCorp' },
      expectedCount: 3
    },
    {
      name: 'Filter by price range - $10-$20',
      query: { minPrice: '10', maxPrice: '20' },
      expectedCount: 4
    },
    {
      name: 'Filter in stock only',
      query: { inStock: 'true' },
      expectedCount: 6
    },
    {
      name: 'Filter prescription required',
      query: { requiresPrescription: 'true' },
      expectedCount: 2
    },
    {
      name: 'Search by name - Aspirin',
      query: { search: 'aspirin' },
      expectedCount: 1
    },
    {
      name: 'Multiple filters - OTC, in stock, under $20',
      query: { category: 'otc', inStock: 'true', maxPrice: '20' },
      expectedCount: 2
    }
  ],
  orders: [
    {
      name: 'Filter by status - delivered',
      query: { status: 'delivered' },
      expectedCount: 1
    },
    {
      name: 'Filter by payment status - paid',
      query: { paymentStatus: 'paid' },
      expectedCount: 2
    },
    {
      name: 'Filter by payment method - card',
      query: { paymentMethod: 'card' },
      expectedCount: 1
    },
    {
      name: 'Search by order number',
      query: { search: 'ORD-001' },
      expectedCount: 1
    }
  ]
};

module.exports = {
  sampleCategories,
  sampleMedicines,
  sampleOrders,
  createSampleData,
  clearSampleData,
  testScenarios
};
