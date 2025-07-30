# SMS Integration Documentation

## Overview
The VNR Outpass system now includes comprehensive SMS notifications for students, mentors, and parents at various stages of the outpass workflow.

## SMS Flow

### 1. Outpass Request (Student applies)
**Recipients:** Mentor + Parent  
**Trigger:** When a student submits an outpass request  
**Messages:**
- **To Mentor:** "Dear Mentor, your student {StudentName} has requested for a Gatepass due to {Reason} - VNRVJIET"
- **To Parent:** "Dear Parent, your ward {StudentName} has requested for a Gatepass due to {Reason} - VNRVJIET"

### 2. Outpass Approval (Mentor approves)
**Recipients:** Student + Parent  
**Trigger:** When a mentor approves an outpass request  
**Messages:**
- **To Student:** "Dear {StudentName}, your Gatepass request for {Reason} has been approved by your mentor - VNRVJIET"
- **To Parent:** "Dear Parent, your ward {StudentName}'s Gatepass request for {Reason} has been approved - VNRVJIET"

### 3. Outpass Rejection (Mentor rejects)
**Recipients:** Student + Parent  
**Trigger:** When a mentor rejects an outpass request  
**Messages:**
- **To Student:** "Dear {StudentName}, your Gatepass request for {Reason} has been rejected by your mentor - VNRVJIET"
- **To Parent:** "Dear Parent, your ward {StudentName}'s Gatepass request for {Reason} has been rejected - VNRVJIET"

### 4. QR Code Scan (Security scans QR)
**Recipients:** Parent only  
**Trigger:** When security scans the QR code and student exits campus  
**Message:**
- **To Parent:** "Dear Parent, your ward {StudentName} has successfully exited the campus at {DateTime} for {Reason} - VNRVJIET"

## Configuration

### Environment Variables (.env)
```properties
# SMS Configuration
SMS_API_URL=https://textsms.adeep.in/api.php
SMS_USERNAME=VNRVJIET
SMS_API_KEY=4GHeq5OTe8Hj
SMS_SENDER_ID=VNRVJI
SMS_ROUTE=TRANS
SMS_TID=1607100000000353767
SMS_PEID=1601100000000013508
```

### Database Schema Updates
Added mobile number fields to User model:
- `mobile` (String, optional): User's mobile number
- `parentMobile` (String, optional): Parent's mobile number (for students)

## API Endpoints

### Update User Mobile Numbers
**Endpoint:** `PUT /api/admin/users/:userId/mobile`  
**Access:** HOD only  
**Body:**
```json
{
  "mobile": "9876543210",
  "parentMobile": "9876543211"
}
```

### Get All Users (includes mobile numbers)
**Endpoint:** `GET /api/admin/users`  
**Access:** HOD only  
**Response includes mobile and parentMobile fields**

## SMS Service Features

### Error Handling
- SMS failures don't block the main workflow
- Comprehensive error logging
- Timeout protection (10 seconds per SMS)

### Validation
- Mobile number format validation (10-digit Indian numbers)
- Configuration validation before sending
- URL encoding for message content

### Logging
- Detailed success/failure logs
- SMS content and recipient tracking
- Error diagnostics

## Testing

### Manual Testing
Run the test script:
```bash
cd backend
npx ts-node src/scripts/test-sms.ts
```

### Integration Testing
1. Create a student account with mobile numbers
2. Apply for an outpass
3. Approve/reject from mentor panel
4. Scan QR code from security panel

## Security Considerations

1. **API Key Protection:** SMS API key is stored in environment variables
2. **Rate Limiting:** Consider implementing SMS rate limiting for production
3. **Message Content:** All messages are pre-defined templates to prevent injection
4. **Access Control:** Only HOD can update mobile numbers

## Troubleshooting

### Common Issues
1. **SMS not sent:** Check environment variables and API credentials
2. **Type errors:** Restart TypeScript server after database schema changes
3. **Missing mobile numbers:** Use admin panel to update user mobile numbers

### Logs to Check
- SMS sending logs in backend console
- Database migration logs
- API response logs from SMS service

## Future Enhancements
1. SMS delivery status tracking
2. SMS templates management in admin panel
3. Multi-language SMS support
4. SMS scheduling for reminders
5. Bulk SMS functionality for announcements
