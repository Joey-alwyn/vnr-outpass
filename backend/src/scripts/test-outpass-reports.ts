import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

async function testOutpassReportingEndpoints() {
  console.log('🧪 Testing Outpass Reporting Endpoints...\n');

  try {
    // Test 1: Get outpass reports
    console.log('1. Testing GET /api/admin/outpass-reports');
    const reportsResponse = await axios.get(`${API_BASE}/admin/outpass-reports`, {
      params: {
        page: 1,
        limit: 10
      }
    });
    console.log('✅ Outpass reports:', {
      totalRecords: reportsResponse.data.summary.pagination.totalRecords,
      currentPage: reportsResponse.data.summary.pagination.currentPage,
      outpassesCount: reportsResponse.data.outpasses.length,
      todaySummary: reportsResponse.data.summary.today
    });

    // Test 2: Get live outpass status
    console.log('\n2. Testing GET /api/admin/live-outpass-status');
    const liveStatusResponse = await axios.get(`${API_BASE}/admin/live-outpass-status`);
    console.log('✅ Live status:', {
      currentlyOutside: liveStatusResponse.data.currentlyOutside.count,
      recentlyReturned: liveStatusResponse.data.recentlyReturned.count
    });

    // Test 3: Generate and download report (this will return file data)
    console.log('\n3. Testing POST /api/admin/download-outpass-report');
    const downloadResponse = await axios.post(`${API_BASE}/admin/download-outpass-report`, {
      startDate: '2025-07-01',
      endDate: '2025-07-30',
      status: 'ALL',
      reportType: 'detailed'
    }, {
      responseType: 'blob' // Important for file downloads
    });
    
    console.log('✅ Download report generated:', {
      contentType: downloadResponse.headers['content-type'],
      contentLength: downloadResponse.headers['content-length'],
      fileName: downloadResponse.headers['content-disposition']
    });

    // Test 4: Get filtered reports
    console.log('\n4. Testing filtered outpass reports');
    const today = new Date().toISOString().split('T')[0];
    const filteredResponse = await axios.get(`${API_BASE}/admin/outpass-reports`, {
      params: {
        startDate: today,
        endDate: today,
        status: 'APPROVED',
        page: 1,
        limit: 5
      }
    });
    console.log('✅ Filtered reports (today, approved only):', {
      records: filteredResponse.data.outpasses.length,
      filters: filteredResponse.data.filters
    });

    console.log('\n🎉 All outpass reporting endpoints are working correctly!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testOutpassReportingEndpoints();
