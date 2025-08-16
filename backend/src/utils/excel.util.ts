import * as XLSX from 'xlsx';
import fs from 'fs';

export interface ExcelStudentData {
  email: string;
  name: string;
  rollNumber?: string;
  department?: string;
  mentorEmail?: string;
  mentorName?: string;
}

export interface ExcelParseResult {
  students: ExcelStudentData[];
  errors: string[];
  summary: {
    totalRows: number;
    validStudents: number;
    studentsWithMentors: number;
    studentsWithoutMentors: number;
  };
}

/**
 * Parse Excel file and extract student-mentor data
 */
export function parseExcelFile(filePath: string): ExcelParseResult {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    const students: ExcelStudentData[] = [];
    const errors: string[] = [];
    
    // Assume first row is headers
    if (rawData.length < 2) {
      throw new Error('Excel file must contain at least a header row and one data row');
    }
    
    const headers = rawData[0].map((h: any) => String(h).toLowerCase().trim());
    console.log('📊 Excel headers found:', headers);
    
    // Define possible column mappings
    const columnMappings = {
      email: ['email', 'student email', 'student_email', 'studentemail'],
      name: ['name', 'student name', 'student_name', 'studentname', 'full name'],
      rollNumber: ['roll', 'roll number', 'roll_number', 'rollnumber', 'reg no', 'registration'],
      department: ['department', 'dept', 'branch'],
      mentorEmail: ['mentor email', 'mentor_email', 'mentoremail', 'faculty email'],
      mentorName: ['mentor name', 'mentor_name', 'mentorname', 'faculty name', 'faculty_name']
    };
    
    // Find column indices
    const columnIndices: { [key: string]: number } = {};
    for (const [field, possibleNames] of Object.entries(columnMappings)) {
      const index = headers.findIndex(h => possibleNames.includes(h));
      if (index !== -1) {
        columnIndices[field] = index;
      }
    }
    
    console.log('📊 Column mappings found:', columnIndices);
    
    // Validate required columns
    if (columnIndices.email === undefined) {
      throw new Error('Email column is required. Expected column names: email, student email, student_email');
    }
    if (columnIndices.name === undefined) {
      throw new Error('Name column is required. Expected column names: name, student name, student_name');
    }
    
    // Process data rows
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      
      if (!row || row.length === 0 || !row[columnIndices.email]) {
        continue; // Skip empty rows
      }
      
      try {
        const email = String(row[columnIndices.email] || '').trim().toLowerCase();
        const name = String(row[columnIndices.name] || '').trim();
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push(`Row ${i + 1}: Invalid email format: ${email}`);
          continue;
        }
        
        // Validate VNR email for students
        if (!email.endsWith('@vnrvjiet.in')) {
          errors.push(`Row ${i + 1}: Student email must be @vnrvjiet.in domain: ${email}`);
          continue;
        }
        
        if (!name) {
          errors.push(`Row ${i + 1}: Name is required for ${email}`);
          continue;
        }
        
        const studentData: ExcelStudentData = {
          email,
          name,
          rollNumber: columnIndices.rollNumber !== undefined ? String(row[columnIndices.rollNumber] || '').trim() : undefined,
          department: columnIndices.department !== undefined ? String(row[columnIndices.department] || '').trim() : undefined,
          mentorEmail: columnIndices.mentorEmail !== undefined ? String(row[columnIndices.mentorEmail] || '').trim().toLowerCase() : undefined,
          mentorName: columnIndices.mentorName !== undefined ? String(row[columnIndices.mentorName] || '').trim() : undefined,
        };
        
        // Validate mentor email if provided
        if (studentData.mentorEmail && !emailRegex.test(studentData.mentorEmail)) {
          errors.push(`Row ${i + 1}: Invalid mentor email format: ${studentData.mentorEmail}`);
          studentData.mentorEmail = undefined;
        }
        
        students.push(studentData);
        
      } catch (error) {
        errors.push(`Row ${i + 1}: Error processing row - ${error}`);
      }
    }
    
    // Generate summary
    const studentsWithMentors = students.filter(s => s.mentorEmail).length;
    const summary = {
      totalRows: rawData.length - 1, // Exclude header
      validStudents: students.length,
      studentsWithMentors,
      studentsWithoutMentors: students.length - studentsWithMentors,
    };
    
    return {
      students,
      errors,
      summary
    };
    
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error}`);
  }
}

/**
 * Clean up uploaded file
 */
export function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Failed to cleanup file ${filePath}:`, error);
  }
}
