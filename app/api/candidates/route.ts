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
}

function parseCSV(csvContent: string): Candidate[] {
  const lines = csvContent.trim().split('\n');
  const candidates: Candidate[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',');
    if (columns.length >= 5) {
      candidates.push({
        sNo: parseInt(columns[0]) || 0,
        district: columns[1] || '',
        acNumber: parseInt(columns[2]) || 0,
        acName: columns[3] || '',
        candidateName: columns[4] || ''
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
        ? candidateCache.filter(candidate => 
            candidate.acName.toLowerCase().includes(search.toLowerCase()) ||
            candidate.candidateName.toLowerCase().includes(search.toLowerCase()) ||
            candidate.district.toLowerCase().includes(search.toLowerCase())
          )
        : candidateCache;
      
      return NextResponse.json({
        success: true,
        data: filteredCandidates,
        total: filteredCandidates.length,
        cached: true
      });
    }
    
    // Read CSV file
    const csvPath = path.join(process.cwd(), 'public', 'assets', 'CandidateList.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Parse CSV
    const candidates = parseCSV(csvContent);
    
    // Update cache
    candidateCache = candidates;
    cacheTimestamp = now;
    
    // Filter by search if provided
    const filteredCandidates = search 
      ? candidates.filter(candidate => 
          candidate.acName.toLowerCase().includes(search.toLowerCase()) ||
          candidate.candidateName.toLowerCase().includes(search.toLowerCase()) ||
          candidate.district.toLowerCase().includes(search.toLowerCase())
        )
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
