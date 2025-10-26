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
    
    // Skip empty lines
    if (!line) continue;
    
    const columns = line.split(',');
    if (columns.length >= 5) {
      // Format: District,Assembly,Candidate,Election Phase,Ballot Number
      const districtColumn = columns[0] || '';
      const assemblyColumn = columns[1] || '';
      const candidateName = columns[2] || '';
      const electionPhase = columns[3] || '';
      const ballotNumber = parseInt(columns[4]) || 0;
      
      // Extract AC number from Assembly column (e.g., "5-लौरिया" -> 5)
      const acNumberMatch = assemblyColumn.match(/^(\d+)-/);
      const acNumber = acNumberMatch ? parseInt(acNumberMatch[1]) : 0;
      
      // Skip rows with invalid assembly names or duplicates
      if (!acNumber || seenAcNumbers.has(acNumber)) continue;
      
      seenAcNumbers.add(acNumber);
      
      candidates.push({
        sNo: candidates.length + 1,
        district: districtColumn,
        acNumber: acNumber,
        acName: assemblyColumn,
        candidateName: candidateName,
        electionPhase: electionPhase,
        ballotNumber: ballotNumber,
        districtHindi: districtColumn,
        acNameHindi: assemblyColumn,
        candidateNameHindi: candidateName
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
            return candidate.acNameHindi.includes(search) ||
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
    const csvPath = path.join(process.cwd(), 'public', 'assets', 'CandidateUpdatedList.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const candidates = parseCSV(csvContent);
    
    // Sort candidates by Assembly number in ascending order
    const sortedCandidates = candidates.sort((a, b) => a.acNumber - b.acNumber);
    
    // Update cache
    candidateCache = sortedCandidates;
    cacheTimestamp = now;
    
    // Filter by search if provided (search in Hindi)
    const filteredCandidates = search 
      ? sortedCandidates.filter(candidate => {
          return candidate.acNameHindi.includes(search) ||
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
