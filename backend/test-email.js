const emailService = require('./src/services/emailService');

async function testEmailService() {
    console.log('🧪 Testing Email Service...\n');
    
    // Test 1: Basic email sending
    console.log('1. Testing basic email sending...');
    try {
        const result = await emailService.sendEmail(
            'test@example.com',
            'Test Email from Medilink',
            '<h1>Test Email</h1><p>This is a test email from the Medilink application.</p>'
        );
        
        if (result.success) {
            console.log('✅ Basic email test: SUCCESS');
        } else {
            console.log('❌ Basic email test: FAILED');
            console.log('Error:', result.error);
        }
    } catch (error) {
        console.log('❌ Basic email test: FAILED');
        console.log('Error:', error.message);
    }
    
    console.log('\n');
    
    // Test 2: Welcome email
    console.log('2. Testing welcome email...');
    try {
        const result = await emailService.sendWelcomeEmail(
            'test@example.com',
            'Test User',
            'testPassword123',
            'verification-token-123'
        );
        
        if (result.success) {
            console.log('✅ Welcome email test: SUCCESS');
        } else {
            console.log('❌ Welcome email test: FAILED');
            console.log('Error:', result.error);
        }
    } catch (error) {
        console.log('❌ Welcome email test: FAILED');
        console.log('Error:', error.message);
    }
    
    console.log('\n');
    
    // Test 3: Password reset email
    console.log('3. Testing password reset email...');
    try {
        const result = await emailService.sendPasswordResetEmail(
            'test@example.com',
            'Test User',
            'http://localhost:3000/reset-password/token-123'
        );
        
        if (result.success) {
            console.log('✅ Password reset email test: SUCCESS');
        } else {
            console.log('❌ Password reset email test: FAILED');
            console.log('Error:', result.error);
        }
    } catch (error) {
        console.log('❌ Password reset email test: FAILED');
        console.log('Error:', error.message);
    }
    
    console.log('\n🎉 Email service testing completed!');
    
    // Test 4: Check transporter connection
    console.log('\n4. Checking transporter connection...');
    try {
        await emailService.transporter.verify();
        console.log('✅ Transporter connection: SUCCESS');
    } catch (error) {
        console.log('❌ Transporter connection: FAILED');
        console.log('Error:', error.message);
    }
    
    process.exit(0);
}

// Run the test
testEmailService().catch(error => {
    console.error('❌ Email service test failed:', error);
    process.exit(1);
});
