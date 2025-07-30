# Outpass Reporting System for HOD

## Overview
The VNR Outpass system now includes comprehensive reporting functionality for HODs to track student outpass activities in real-time and generate detailed reports.

## New API Endpoints

### 1. GET /api/admin/outpass-reports
**Purpose:** Get comprehensive outpass reports with filtering and pagination  
**Access:** HOD only  
**Query Parameters:**
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)
- `status` (optional): Filter by status (PENDING, APPROVED, REJECTED, UTILIZED, ALL)
- `mentorId` (optional): Filter by specific mentor
- `studentId` (optional): Filter by specific student
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Records per page (default: 50)

**Response:**
```json
{
  "outpasses": [
    {
      "id": "pass-id",
      "student": {
        "id": "student-id",
        "email": "student@vnrvjiet.in",
        "name": "Student Name"
      },
      "mentor": {
        "id": "mentor-id",
        "email": "mentor@vnrvjiet.in",
        "name": "Mentor Name"
      },
      "reason": "Family Event",
      "status": "APPROVED",
      "appliedAt": "2025-07-29T10:00:00Z",
      "updatedAt": "2025-07-29T10:30:00Z",
      "qrGeneratedAt": "2025-07-29T10:30:00Z",
      "scannedAt": null,
      "qrValid": true
    }
  ],
  "summary": {
    "today": {
      "total": 25,
      "approved": 18,
      "pending": 5,
      "rejected": 2,
      "utilized": 15
    },
    "activeOutpasses": 3,
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 245,
      "recordsPerPage": 50
    }
  }
}
```

### 2. GET /api/admin/live-outpass-status
**Purpose:** Get real-time status of students currently outside campus  
**Access:** HOD only  

**Response:**
```json
{
  "currentlyOutside": {
    "count": 3,
    "students": [
      {
        "passId": "pass-id",
        "student": {
          "name": "Krishna",
          "email": "krishna@vnrvjiet.in"
        },
        "mentor": {
          "name": "Dr. Mentor",
          "email": "mentor@vnrvjiet.in"
        },
        "reason": "Family Event",
        "approvedAt": "2025-07-29T10:30:00Z",
        "timeOutside": 120,
        "qrGeneratedAt": "2025-07-29T10:30:00Z"
      }
    ]
  },
  "recentlyReturned": {
    "count": 2,
    "students": [
      {
        "passId": "pass-id",
        "student": { "name": "Student", "email": "student@vnrvjiet.in" },
        "returnedAt": "2025-07-29T12:00:00Z",
        "totalTimeOut": 90
      }
    ]
  }
}
```

### 3. POST /api/admin/download-outpass-report
**Purpose:** Generate and download Excel report  
**Access:** HOD only  
**Content-Type:** application/json  

**Request Body:**
```json
{
  "startDate": "2025-07-01",
  "endDate": "2025-07-30",
  "status": "ALL",
  "mentorId": "optional-mentor-id",
  "reportType": "detailed"
}
```

**Response:** Excel file download with two sheets:
1. **Summary Sheet**: Overview statistics
2. **Outpass Details Sheet**: Complete outpass data with columns:
   - Pass ID
   - Student Name, Email, Mobile
   - Parent Mobile
   - Mentor Name, Email
   - Reason, Status
   - Applied At, Approved/Rejected At
   - QR Generated At, Scanned At
   - Time Outside (Minutes)

## Features

### Real-Time Dashboard
- **Current Status**: See who's currently outside campus
- **Today's Summary**: Quick overview of today's outpass activity
- **Live Updates**: Real-time status without page refresh

### Advanced Filtering
- **Date Range**: Filter by specific date ranges
- **Status**: Filter by outpass status
- **Mentor/Student**: Filter by specific mentor or student
- **Pagination**: Handle large datasets efficiently

### Comprehensive Reports
- **Excel Export**: Professional reports in Excel format
- **Multiple Sheets**: Summary and detailed data
- **Complete Data**: All relevant information included
- **Time Tracking**: Track how long students are outside

### Security & Access Control
- **HOD Only**: All reporting endpoints restricted to HOD role
- **Authentication**: Secure access with JWT tokens
- **Role Validation**: Automatic role checking

## Usage Examples

### Daily Monitoring
```javascript
// Get today's outpass activity
const today = new Date().toISOString().split('T')[0];
const response = await fetch(`/api/admin/outpass-reports?startDate=${today}&endDate=${today}`);
```

### Live Status Check
```javascript
// Check who's currently outside
const liveStatus = await fetch('/api/admin/live-outpass-status');
```

### Weekly Report Generation
```javascript
// Download weekly report
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const today = new Date().toISOString().split('T')[0];

const response = await fetch('/api/admin/download-outpass-report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    startDate: weekAgo,
    endDate: today,
    status: 'ALL'
  })
});
```

## Data Insights

### Available Metrics
1. **Daily Activity**: Total requests, approvals, rejections
2. **Time Tracking**: How long students stay outside
3. **Usage Patterns**: Peak times, common reasons
4. **Mentor Performance**: Approval rates, response times
5. **Student Behavior**: Frequency of requests, compliance

### Key Performance Indicators
- **Average Response Time**: How quickly mentors respond
- **Approval Rate**: Percentage of approved requests
- **Return Compliance**: Students who return vs. don't scan back
- **Peak Hours**: Busiest times for outpass requests

## Integration with SMS System

The reporting system works seamlessly with the SMS notification system:
- **Outpass Requests**: SMS sent to mentor and parent
- **Approvals**: SMS sent to student and parent
- **QR Scans**: SMS sent to parent when student exits
- **Reports Include**: Mobile numbers for communication tracking

## Benefits for HOD

### Real-Time Monitoring
- Know exactly who's outside campus at any time
- Track student safety and whereabouts
- Monitor mentor responsiveness

### Data-Driven Decisions
- Identify patterns in outpass requests
- Optimize approval processes
- Ensure student safety compliance

### Compliance & Audit
- Complete audit trail of all outpass activities
- Downloadable reports for administration
- Parent communication tracking

### Emergency Response
- Quick access to student contact information
- Real-time location status
- Parent notification history

## Technical Notes

### Performance
- Efficient database queries with indexing
- Pagination for large datasets
- Optimized for real-time updates

### File Management
- Temporary file cleanup after downloads
- Automatic file naming with timestamps
- Excel format for universal compatibility

### Error Handling
- Comprehensive error logging
- Graceful failure handling
- User-friendly error messages
