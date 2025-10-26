import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache for candidate data
let candidateCache: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface Candidate {
  sNo: number;
  district: string;
  acNumber: number;
  acName: string;
  candidateName: string;
  electionPhase: string;
  ballotNumber: number;
  districtHindi: string;
  acNameHindi: string;
  candidateNameHindi: string;
}

function parseCSV(csvContent: string): Candidate[] {
  const lines = csvContent.trim().split('\n');
  const candidates: Candidate[] = [];
  const seenAcNumbers = new Set<number>();
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines, header rows, and special marker lines
    if (!line || 
        line.startsWith('Column') || 
        line.startsWith('Assembly,District,Candidate') ||
        line.startsWith('District,Assembly,Candidate') ||
        line === 'District,Assembly,Candidate,Election Phase,Candidate Ballot Number,,,,,,,') {
      continue;
    }
    
    const columns = line.split(',');
    if (columns.length >= 10) {
      let assemblyColumn = '';
      let districtColumn = '';
      let acNumber = 0;
      
      // Check if first column is assembly (number prefix) or district (letter prefix)
      const firstCol = columns[0] || '';
      const secondCol = columns[1] || '';
      
      if (firstCol.match(/^\d+-/)) {
        // Format: Assembly,District,Candidate,...
        assemblyColumn = firstCol;
        districtColumn = secondCol;
        const acNumberMatch = assemblyColumn.match(/^(\d+)-/);
        acNumber = acNumberMatch ? parseInt(acNumberMatch[1]) : 0;
      } else if (secondCol.match(/^\d+-/)) {
        // Format: District,Assembly,Candidate,...
        assemblyColumn = secondCol;
        districtColumn = firstCol;
        const acNumberMatch = assemblyColumn.match(/^(\d+)-/);
        acNumber = acNumberMatch ? parseInt(acNumberMatch[1]) : 0;
      }
      
      // Skip rows with invalid assembly names or duplicates
      if (!acNumber || seenAcNumbers.has(acNumber)) continue;
      
      seenAcNumbers.add(acNumber);
      
      candidates.push({
        sNo: candidates.length + 1,
        district: districtColumn,
        acNumber: acNumber,
        acName: assemblyColumn,
        candidateName: columns[2] || '',
        electionPhase: columns[3] || '',
        ballotNumber: parseInt(columns[4]) || 0,
        districtHindi: columns[6] || '',
        acNameHindi: columns[7] || '',
        candidateNameHindi: columns[8] || ''
      });
    }
  }
  
  return candidates;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    // Check cache
    const now = Date.now();
    if (candidateCache && (now - cacheTimestamp) < CACHE_DURATION) {
      const filteredCandidates = search 
        ? candidateCache.filter(candidate => {
            const searchLower = search.toLowerCase();
            return candidate.acName.toLowerCase().includes(searchLower) ||
                   candidate.candidateName.toLowerCase().includes(searchLower) ||
                   candidate.district.toLowerCase().includes(searchLower) ||
                   candidate.acNameHindi.includes(search) ||
                   candidate.candidateNameHindi.includes(search) ||
                   candidate.districtHindi.includes(search);
          })
        : candidateCache;
      
      return NextResponse.json({
        success: true,
        data: filteredCandidates,
        total: filteredCandidates.length,
        cached: true
      });
    }
    
    // Read CSV file
    const csvPath = path.join(process.cwd(), 'public', 'assets', 'NewCandidateList.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const candidates = parseCSV(csvContent);
    
    // Sort candidates by Assembly number in ascending order
    const sortedCandidates = candidates.sort((a, b) => a.acNumber - b.acNumber);
    
    // Update cache
    candidateCache = sortedCandidates;
    cacheTimestamp = now;
    
    // Filter by search if provided (search in both English and Hindi)
    const filteredCandidates = search 
      ? sortedCandidates.filter(candidate => {
          const searchLower = search.toLowerCase();
          return candidate.acName.toLowerCase().includes(searchLower) ||
                 candidate.candidateName.toLowerCase().includes(searchLower) ||
                 candidate.district.toLowerCase().includes(searchLower) ||
                 candidate.acNameHindi.includes(search) ||
                 candidate.candidateNameHindi.includes(search) ||
                 candidate.districtHindi.includes(search);
        })
      : sortedCandidates;
    
    return NextResponse.json({
      success: true,
      data: filteredCandidates,
      total: filteredCandidates.length,
      cached: false
    });
    
  } catch (error) {
    console.error('Error reading candidate data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to read candidate data',
        data: [],
        total: 0
      },
      { status: 500 }
    );
  }
}
