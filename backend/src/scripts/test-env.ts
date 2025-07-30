import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('🔍 Environment Variables Check:');
console.log('SMS_API_URL:', process.env.SMS_API_URL);
console.log('SMS_USERNAME:', process.env.SMS_USERNAME);
console.log('SMS_API_KEY:', process.env.SMS_API_KEY ? '***configured***' : 'missing');
console.log('SMS_SENDER_ID:', process.env.SMS_SENDER_ID);
console.log('SMS_ROUTE:', process.env.SMS_ROUTE);
console.log('SMS_TID:', process.env.SMS_TID);
console.log('SMS_PEID:', process.env.SMS_PEID);

// Test the SMS service
import { smsService } from '../utils/sms.util';

async function testWithEnv() {
  console.log('\n📱 Testing with loaded environment...');
  await smsService.notifyOutpassRequest(
    'Test Student',
    'Test Reason',
    '8341832634',
    '8341832634'
  );
}

testWithEnv().catch(console.error);
