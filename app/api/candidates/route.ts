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
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',');
    if (columns.length >= 10) {
      // Extract AC number from Assembly column (e.g., "29-Runnisaidpur" -> 29)
      const assemblyColumn = columns[1] || '';
      const acNumberMatch = assemblyColumn.match(/^(\d+)-/);
      const acNumber = acNumberMatch ? parseInt(acNumberMatch[1]) : 0;
      
      candidates.push({
        sNo: i,
        district: columns[0] || '',
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
    const csvPath = path.join(process.cwd(), 'public', 'assets', 'CandidateNameData.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const candidates = parseCSV(csvContent);
    
    // Update cache
    candidateCache = candidates;
    cacheTimestamp = now;
    
    // Filter by search if provided (search in both English and Hindi)
    const filteredCandidates = search 
      ? candidates.filter(candidate => {
          const searchLower = search.toLowerCase();
          return candidate.acName.toLowerCase().includes(searchLower) ||
                 candidate.candidateName.toLowerCase().includes(searchLower) ||
                 candidate.district.toLowerCase().includes(searchLower) ||
                 candidate.acNameHindi.includes(search) ||
                 candidate.candidateNameHindi.includes(search) ||
                 candidate.districtHindi.includes(search);
        })
      : candidates;
    
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
