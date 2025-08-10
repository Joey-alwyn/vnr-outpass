// Quick analysis of bulk add user logic
// This script helps identify why 4 users might be missing

export const analyzeRowSkipping = () => {
  // Looking at the bulk add logic, rows are skipped if:
  
  console.log('Row skipping conditions in bulkAddUsers:');
  
  console.log('1. Missing basic info:');
  console.log('   - !rollNumber || !studentName');
  
  console.log('2. Header row detection:');
  console.log('   - rollNumber === "Sno"');
  console.log('   - rollNumber === "H.T.NO."');
  console.log('   - studentName === "Name of the Student"');
  
  console.log('3. Section headers:');
  console.log('   - rollNumber.includes("CSBS")');
  console.log('   - rollNumber.includes("entry")');
  console.log('   - rollNumber.includes("Student Data")');
  
  console.log('4. Invalid roll number format:');
  console.log('   - !rollNumber.match(/^\\d{2}071[A-Z]\\d{4}$/)');
  console.log('   - This means roll number must be: XX071YXXXX');
  console.log('   - Where XX = 2 digits, Y = 1 letter, XXXX = 4 digits');
  
  console.log('5. Errors during processing:');
  console.log('   - Mentor creation failures');
  console.log('   - Student creation failures');
  console.log('   - Database constraint violations');
  
  // Test the roll number regex
  const rollNumberRegex = /^\d{2}071[A-Z]\d{4}$/;
  
  console.log('\nTesting roll number format:');
  console.log('Valid examples:');
  console.log('24071A3201:', rollNumberRegex.test('24071A3201'));
  console.log('23071B1234:', rollNumberRegex.test('23071B1234'));
  
  console.log('\nInvalid examples:');
  console.log('24071a3201 (lowercase):', rollNumberRegex.test('24071a3201'));
  console.log('2071A3201 (missing digit):', rollNumberRegex.test('2071A3201'));
  console.log('24072A3201 (wrong number):', rollNumberRegex.test('24072A3201'));
  console.log('24071AA3201 (extra letter):', rollNumberRegex.test('24071AA3201'));
  console.log('24071A32011 (extra digit):', rollNumberRegex.test('24071A32011'));
  
  return {
    message: 'Check your Excel file for rows that match these skipping conditions',
    commonIssues: [
      'Roll numbers not matching pattern XX071YXXXX',
      'Empty cells in roll number or student name columns',
      'Section headers or title rows',
      'Rows with text like "CSBS", "entry", "Student Data"',
      'Mentor email not ending with @vnrvjiet.in'
    ]
  };
};

// Example usage:
// analyzeRowSkipping();
