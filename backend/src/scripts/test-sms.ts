import { smsService } from '../utils/sms.util';

async function testSMS() {
  console.log('🧪 Testing SMS functionality...');
  
  // Test outpass request notification
  console.log('\n📱 Testing outpass request notification...');
  await smsService.notifyOutpassRequest(
    'Krishna',
    'Family Event',
    '8341832634', // mentor mobile
    '8341832634'  // parent mobile (using same number for testing)
  );
  
  // Test QR scan notification
  console.log('\n📱 Testing QR scan notification...');
  await smsService.notifyQRScanned(
    'Krishna',
    'Family Event',
    '8341832634', // parent mobile
    new Date()
  );
  
  // Test approval notification
  console.log('\n📱 Testing approval notification...');
  await smsService.notifyOutpassApproval(
    'Krishna',
    'Family Event',
    '8341832634', // student mobile
    '8341832634'  // parent mobile
  );
  
  console.log('\n✅ SMS tests completed!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSMS().catch(console.error);
}

export { testSMS };
