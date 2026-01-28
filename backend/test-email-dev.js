const nodemailer = require('nodemailer');

// Test with Ethereal (fake email service for development)
async function testWithEthereal() {
    console.log('🧪 Testing with Ethereal (Development Email Service)...\n');
    
    try {
        // Create a test account with Ethereal
        let testAccount = await nodemailer.createTestAccount();
        
        console.log('📧 Ethereal Test Account Created:');
        console.log('   Email:', testAccount.user);
        console.log('   Password:', testAccount.pass);
        console.log('   SMTP:', testAccount.smtp);
        console.log('   Web URL:', `https://ethereal.email/messages/${testAccount.user}\n`);
        
        // Create a transporter using the test account
        let transporter = nodemailer.createTransporter({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        
        // Test sending an email
        let info = await transporter.sendMail({
            from: `"Medilink Test" <${testAccount.user}>`,
            to: 'test@example.com',
            subject: 'Test Email from Medilink (Ethereal)',
            html: `
                <h1>Test Email Successful!</h1>
                <p>This email was sent using Ethereal, a fake SMTP service for development.</p>
                <p>You can view this email at: <a href="https://ethereal.email/messages/${testAccount.user}">Ethereal Email Viewer</a></p>
                <p><strong>Original Gmail configuration failed due to authentication issues.</strong></p>
            `,
        });
        
        console.log('✅ Email sent successfully with Ethereal!');
        console.log('📬 Message ID:', info.messageId);
        console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
        
        return true;
    } catch (error) {
        console.error('❌ Ethereal test failed:', error.message);
        return false;
    }
}

// Test with current Gmail configuration
async function testCurrentGmail() {
    console.log('🧪 Testing Current Gmail Configuration...\n');
    
    try {
        const emailService = require('./src/services/emailService');
        
        const result = await emailService.sendEmail(
            'test@example.com',
            'Gmail Test from Medilink',
            '<h1>Gmail Test</h1><p>This is a test using the current Gmail configuration.</p>'
        );
        
        if (result.success) {
            console.log('✅ Gmail test: SUCCESS');
            return true;
        } else {
            console.log('❌ Gmail test: FAILED');
            console.log('Error:', result.error);
            return false;
        }
    } catch (error) {
        console.log('❌ Gmail test: FAILED');
        console.log('Error:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Email Service Tests...\n');
    
    // Test 1: Current Gmail configuration
    const gmailSuccess = await testCurrentGmail();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Ethereal (development alternative)
    const etherealSuccess = await testWithEthereal();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results:');
    console.log(`   Gmail: ${gmailSuccess ? '✅ Working' : '❌ Failed (Authentication Issue)'}`);
    console.log(`   Ethereal: ${etherealSuccess ? '✅ Working' : '❌ Failed'}`);
    
    if (!gmailSuccess && etherealSuccess) {
        console.log('\n💡 Recommendation:');
        console.log('   - Use Ethereal for development/testing');
        console.log('   - Fix Gmail authentication for production');
        console.log('   - Consider using a transactional email service like SendGrid or Mailgun');
    }
    
    process.exit(0);
}

runTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});
