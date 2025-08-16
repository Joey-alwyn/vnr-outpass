import axios from 'axios';

interface SMSConfig {
  username: string;
  apikey: string;
  senderid: string;
  route: string;
  TID: string;
  PEID: string;
}

interface SMSData {
  mobile: string;
  text: string;
}

class SMSService {
  private config: SMSConfig;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.SMS_API_URL || '';
    this.config = {
      username: process.env.SMS_USERNAME || '',
      apikey: process.env.SMS_API_KEY || '',
      senderid: process.env.SMS_SENDER_ID || '',
      route: process.env.SMS_ROUTE || '',
      TID: process.env.SMS_TID || '',
      PEID: process.env.SMS_PEID || '',
    };
  }

  private validateConfig(): boolean {
    return Object.values(this.config).every(value => value !== '') && this.baseURL !== '';
  }

  public async sendSMS(mobile: string, text: string): Promise<boolean> {
    if (!this.validateConfig()) {
      console.error('SMS configuration is incomplete');
      return false;
    }

    try {
      const params = new URLSearchParams({
        username: this.config.username,
        apikey: this.config.apikey,
        senderid: this.config.senderid,
        route: this.config.route,
        mobile: mobile,
        text: encodeURIComponent(text),
        TID: this.config.TID,
        PEID: this.config.PEID,
      });

      const url = `${this.baseURL}?${params.toString()}`;
      
      console.log(`📱 Sending SMS to ${mobile}: ${text}`);
      
      // For testing purposes, bypass SSL verification
      // In production, ensure the SMS provider has proper SSL certificates
      const response = await axios.get(url, {
        timeout: 10000, // 10 seconds timeout
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      });

      if (response.status === 200) {
        console.log(`✅ SMS sent successfully to ${mobile}:`, response.data);
        return true;
      } else {
        console.error(`❌ SMS failed with status ${response.status}:`, response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ SMS sending error:', error);
      return false;
    }
  }

  /**
   * Send outpass request notification to parent using Adeep.in API
   */
  async sendOutpassRequestToParent(name: string, reason: string, mobile: string): Promise<boolean> {
    const baseUrl = 'https://textsms.adeep.in/api.php';
    const message = `Dear Parent, your ward ${name} has requested for a Gatepass due to ${reason} - VNRVJIET`;

    const params = new URLSearchParams({
      username: 'VNRVJIET',
      apikey: '4GHeq5OTe8Hj',
      senderid: 'VNRVJI',
      route: 'TRANS',
      mobile: mobile,
      text: message,
      TID: '1607100000000353767',
      PEID: '1601100000000013508',
    });

    const url = `${baseUrl}?${params.toString()}`;
    
    console.log(`📱 Sending SMS to parent ${mobile}: ${message}`);

    try {
      const response = await axios.get(url, {
        timeout: 10000, // 10 seconds timeout
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      });

      if (response.status === 200) {
        console.log(`✅ SMS sent successfully to parent ${mobile}:`, response.data);
        return true;
      } else {
        console.error(`❌ SMS failed with status ${response.status}:`, response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ SMS sending error:', error);
      return false;
    }
  }

  /**
   * Send QR scan notification to parent using Adeep.in API
   */
  async sendQRScannedToParent(name: string, reason: string, mobile: string, scanTime: Date): Promise<boolean> {
    const baseUrl = 'https://textsms.adeep.in/api.php';
    
    const formatTime = scanTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    const message = `OUTPASS UPDATE: Your ward ${name} has LEFT the college premises at ${formatTime}. Purpose: ${reason}. Stay updated! - VNRVJIET`;

    const params = new URLSearchParams({
      username: 'VNRVJIET',
      apikey: '4GHeq5OTe8Hj',
      senderid: 'VNRVJI',
      route: 'TRANS',
      mobile: mobile,
      text: message,
      TID: '1607100000000353767',
      PEID: '1601100000000013508',
    });

    const url = `${baseUrl}?${params.toString()}`;
    
    console.log(`📱 Sending QR scan SMS to parent ${mobile}: ${message}`);

    try {
      const response = await axios.get(url, {
        timeout: 10000, // 10 seconds timeout
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      });

      if (response.status === 200) {
        console.log(`✅ QR scan SMS sent successfully to parent ${mobile}:`, response.data);
        return true;
      } else {
        console.error(`❌ QR scan SMS failed with status ${response.status}:`, response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ QR scan SMS sending error:', error);
      return false;
    }
  }

  /**
   * Send notification to mentor using Adeep.in API
   */
  async sendMentorNotification(mentorName: string, studentName: string, reason: string, mobile: string): Promise<boolean> {
    const baseUrl = 'https://textsms.adeep.in/api.php';
    const message = `Alert: Your mentee ${studentName} has submitted an outpass request. Reason: ${reason}. Please review and approve/reject in the system. - VNRVJIET`;

    const params = new URLSearchParams({
      username: 'VNRVJIET',
      apikey: '4GHeq5OTe8Hj',
      senderid: 'VNRVJI',
      route: 'TRANS',
      mobile: mobile,
      text: message,
      TID: '1607100000000353767',
      PEID: '1601100000000013508',
    });

    const url = `${baseUrl}?${params.toString()}`;
    
    console.log(`📱 Sending SMS to mentor ${mobile}: ${message}`);

    try {
      const response = await axios.get(url, {
        timeout: 10000, // 10 seconds timeout
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      });

      if (response.status === 200) {
        console.log(`✅ SMS sent successfully to mentor ${mobile}:`, response.data);
        return true;
      } else {
        console.error(`❌ SMS failed with status ${response.status}:`, response.data);
        return false;
      }
    } catch (error) {
      console.error('❌ SMS sending error:', error);
      return false;
    }
  }

  /**
   * Send outpass request notification to mentor and parent
   */
  async notifyOutpassRequest(studentName: string, reason: string, mentorMobile: string, parentMobile: string): Promise<void> {
    const mentorMessage = `Dear Mentor, your student ${studentName} has requested for a Gatepass due to ${reason} - VNRVJIET`;
    const parentMessage = `Dear Parent, your ward ${studentName} has requested for a Gatepass due to ${reason} - VNRVJIET`;

    // Send to mentor
    if (mentorMobile) {
      await this.sendSMS(mentorMobile, mentorMessage);
    }

    // Send to parent
    if (parentMobile) {
      await this.sendSMS(parentMobile, parentMessage);
    }
  }

  /**
   * Send QR scan notification to parent only
   */
  async notifyQRScanned(studentName: string, reason: string, parentMobile: string, scanTime: Date): Promise<void> {
    const formatTime = scanTime.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const parentMessage = `Dear Parent, your ward ${studentName} has successfully exited the campus at ${formatTime} for ${reason} - VNRVJIET`;

    if (parentMobile) {
      await this.sendSMS(parentMobile, parentMessage);
    }
  }

  /**
   * Send approval notification to student and parent
   */
  async notifyOutpassApproval(studentName: string, reason: string, studentMobile: string, parentMobile: string): Promise<void> {
    const studentMessage = `APPROVED! Your outpass request for ${reason} has been approved by your mentor. Check your dashboard for QR code. - VNRVJIET`;
    const parentMessage = `OUTPASS APPROVED: Your ward ${studentName}'s outpass request has been approved. Purpose: ${reason}. They can now exit campus. - VNRVJIET`;

    // Send to student
    if (studentMobile) {
      await this.sendSMS(studentMobile, studentMessage);
    }

    // Send to parent
    if (parentMobile) {
      await this.sendSMS(parentMobile, parentMessage);
    }
  }

  /**
   * Send rejection notification to student and parent
   */
  async notifyOutpassRejection(studentName: string, reason: string, studentMobile: string, parentMobile: string): Promise<void> {
    const studentMessage = `REJECTED: Your outpass request for ${reason} has been rejected by your mentor. Contact your mentor for details. - VNRVJIET`;
    const parentMessage = `OUTPASS REJECTED: Your ward ${studentName}'s outpass request has been rejected. Purpose: ${reason}. No campus exit permitted. - VNRVJIET`;

    // Send to student
    if (studentMobile) {
      await this.sendSMS(studentMobile, studentMessage);
    }

    // Send to parent
    if (parentMobile) {
      await this.sendSMS(parentMobile, parentMessage);
    }
  }
}

export const smsService = new SMSService();
