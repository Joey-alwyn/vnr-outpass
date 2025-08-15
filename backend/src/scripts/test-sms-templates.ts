import * as dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testSMSTemplates() {
  console.log('🔍 Testing SMS Template Compliance...');
  console.log('API URL:', process.env.SMS_API_URL);
  console.log('Username:', process.env.SMS_USERNAME);
  console.log('Sender ID:', process.env.SMS_SENDER_ID);
  
  // Test with different template formats
  const testMessages = [
    // Template 1: Simple notification
    "Your request has been submitted successfully. -VNRVJIET",
    
    // Template 2: Student outpass notification
    "Student outpass request submitted. Please check system for details. -VNRVJIET",
    
    // Template 3: Campus exit notification
    "Student has exited campus. Details available in system. -VNRVJIET",
    
    // Template 4: Very basic message
    "Notification from VNRVJIET. Please check system.",
    
    // Template 5: Minimal message
    "VNRVJIET System Alert"
  ];

  for (let i = 0; i < testMessages.length; i++) {
    const message = testMessages[i];
    console.log(`\n📱 Testing Template ${i + 1}:`);
    console.log(`Message: ${message}`);
    
    try {
      const params = new URLSearchParams({
        username: process.env.SMS_USERNAME!,
        apikey: process.env.SMS_API_KEY!,
        senderid: process.env.SMS_SENDER_ID!,
        route: process.env.SMS_ROUTE!,
        mobile: '9999999999', // Test number
        text: message,
        TID: process.env.SMS_TID!,
        PEID: process.env.SMS_PEID!,
      });

      const url = `${process.env.SMS_API_URL}?${params.toString()}`;
      
      const response = await axios.get(url, {
        timeout: 10000,
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      });

      console.log(`✅ Response: ${response.data}`);
      
    } catch (error: any) {
      console.error(`❌ Error: ${error.response?.data || error.message}`);
    }
    
    // Wait 2 seconds between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testSMSTemplates().catch(console.error);
