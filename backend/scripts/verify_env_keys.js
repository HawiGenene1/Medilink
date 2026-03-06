require('dotenv').config();
console.log('CHAPA_SECRET_KEY:', process.env.CHAPA_SECRET_KEY ? process.env.CHAPA_SECRET_KEY.substring(0, 10) + '...' : 'NOT FOUND');
console.log('CHAPA_PUBLIC_KEY:', process.env.CHAPA_PUBLIC_KEY ? process.env.CHAPA_PUBLIC_KEY.substring(0, 10) + '...' : 'NOT FOUND');
console.log('CHAPA_BASE_URL:', process.env.CHAPA_BASE_URL);
