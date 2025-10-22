'use client'
import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

// Candidate interface
interface Candidate {
  sNo: number;
  district: string;
  acNumber: number;
  acName: string;
  candidateName: string;
}

// Party data - Only Jan Suraaj candidate
const parties: { id: number; name: string; shortName: string; icon: string; candidate: string; color: string; candidatePhoto: string }[] = [
  {
    id: 1,
    name: 'Jan Suraaj',
    shortName: 'JS',
    icon: '/school-basta.png', // School bag symbol
    candidate: 'अमर कुमार सिंह',
    color: '#1E40AF',
    candidatePhoto: '/images/amar-kumar-singh.jpg'
  }
];

// Mobile confetti effect
const mobileConfetti = (): void => {
  const colors = ["#FDB913", "#FF9800", "#D32F2F", "#FFCC00"];

  confetti({
    particleCount: 500,
    angle: 90,
    spread: 90,
    startVelocity: 100,
    origin: { x: 0.5, y: 1 },
    gravity: 1,
    scalar: 1,
    drift: 1,
    ticks: 400,
    colors: colors,
  });

  confetti({
    particleCount: 400,
    angle: 75,
    spread: 70,
    startVelocity: 95,
    origin: { x: 0.2, y: 1 },
    gravity: 1,
    drift: 0.5,
    ticks: 400,
    colors: colors,
  });

  confetti({
    particleCount: 400,
    angle: 105,
    spread: 70,
    startVelocity: 95,
    origin: { x: 0.8, y: 1 },
    gravity: 1,
    drift: -0.5,
    ticks: 400,
    colors: colors,
  });
};

// Desktop confetti effect
const desktopConfetti = (): void => {
  const end = Date.now() + 1 * 1000;
  const colors = ["#FDB913", "#FF9800", "#D32F2F", "#FFCC00"];

  const frame = () => {
    if (Date.now() > end) return;
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 80,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors: colors,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 80,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors: colors,
    });
    requestAnimationFrame(frame);
  };
  frame();
};

const fireConfetti = (): void => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768;

  if (isMobile) {
    mobileConfetti();
  } else {
    desktopConfetti();
  }
};

export default function EVMApp() {
  const [selectedAC, setSelectedAC] = useState<string>('');
  const [selectedParty, setSelectedParty] = useState<typeof parties[number] | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [showCandidateDetails, setShowCandidateDetails] = useState<boolean>(false);
  const [showACDropdown, setShowACDropdown] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [ledOn, setLedOn] = useState<boolean>(false);

  const splashAudioRef = useRef<HTMLAudioElement | null>(null);
  const beepAudioRef = useRef<HTMLAudioElement | null>(null);
  const confettiAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load candidates data from API
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/candidates');
        const result = await response.json();
        
        if (result.success) {
          setCandidates(result.data);
          setFilteredCandidates(result.data);
        } else {
          console.error('Failed to load candidates:', result.error);
        }
      } catch (error) {
        console.error('Error fetching candidates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  // Filter candidates based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCandidates(candidates);
    } else {
      const filtered = candidates.filter(candidate =>
        candidate.acName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.district.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCandidates(filtered);
    }
  }, [searchQuery, candidates]);

  // Play splash audio on mount with autoplay-policy fallback
  useEffect(() => {
    const audio = splashAudioRef.current;
    if (!audio) return;

    audio.preload = 'auto';
    // playsInline for iOS
    (audio as any).playsInline = true;

    const tryPlayUnmuted = async () => {
      try {
        audio.muted = false;
        await audio.play();
        setIsPlaying(true);
      } catch {
        // Fallback: play muted immediately
        try {
          audio.muted = true;
          await audio.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
        }
      }
    };

    const onFirstInteract = async () => {
      try {
        audio.muted = false;
        audio.currentTime = 0;
        await audio.play();
        setIsPlaying(true);
      } catch { }
      window.removeEventListener('pointerdown', onFirstInteract, { capture: true } as any);
      window.removeEventListener('keydown', onFirstInteract, { capture: true } as any);
    };

    tryPlayUnmuted();

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    window.addEventListener('pointerdown', onFirstInteract, { capture: true });
    window.addEventListener('keydown', onFirstInteract, { capture: true });

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      window.removeEventListener('pointerdown', onFirstInteract, { capture: true } as any);
      window.removeEventListener('keydown', onFirstInteract, { capture: true } as any);
    };
  }, []);

  // Play splash audio on mount with autoplay-policy fallback
  useEffect(() => {
    const audio = splashAudioRef.current;
    if (!audio) return;

    audio.preload = 'auto';
    audio.loop = false;
    // playsInline for iOS
    (audio as any).playsInline = true;

    let hasInteracted = false;

    const tryPlayAudio = async (muted = false) => {
      try {
        audio.muted = muted;
        audio.currentTime = 0;
        await audio.play();
        setIsPlaying(true);
        return true;
      } catch (err) {
        return false;
      }
    };

    const attemptAutoplay = async () => {
      // Try unmuted first
      const unmutedSuccess = await tryPlayAudio(false);
      if (unmutedSuccess) return;

      // Fallback to muted autoplay
      const mutedSuccess = await tryPlayAudio(true);
      if (!mutedSuccess) {
        setIsPlaying(false);
      }
    };

    const onFirstInteract = async () => {
      if (hasInteracted) return;
      hasInteracted = true;

      await tryPlayAudio(false);

      // Remove all listeners after first interaction
      window.removeEventListener('click', onFirstInteract, true);
      window.removeEventListener('touchstart', onFirstInteract, true);
      window.removeEventListener('keydown', onFirstInteract, true);
      window.removeEventListener('pointerdown', onFirstInteract, true);
    };

    // Attempt immediate autoplay
    attemptAutoplay();

    // Add multiple event listeners for user interaction
    window.addEventListener('click', onFirstInteract, true);
    window.addEventListener('touchstart', onFirstInteract, true);
    window.addEventListener('keydown', onFirstInteract, true);
    window.addEventListener('pointerdown', onFirstInteract, true);

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      window.removeEventListener('click', onFirstInteract, true);
      window.removeEventListener('touchstart', onFirstInteract, true);
      window.removeEventListener('keydown', onFirstInteract, true);
      window.removeEventListener('pointerdown', onFirstInteract, true);
    };
  }, []);

  const handlePartySelect = (party: typeof parties[number]) => {
    if (hasVoted) return;
    setSelectedParty(party);
    setLedOn(true); // Turn on LED when button is pressed

    // Play beep sound first
    if (beepAudioRef.current) {
      beepAudioRef.current.currentTime = 0;
      beepAudioRef.current.play().catch((err: Error) => console.log('Beep audio play failed:', err));
    }

    // Play confetti audio after beep (with slight delay)
    setTimeout(() => {
      if (confettiAudioRef.current) {
        confettiAudioRef.current.currentTime = 0;
        confettiAudioRef.current.play().catch((err: Error) => console.log('Confetti audio play failed:', err));
      }
    }, 500);

    // Fire confetti
    fireConfetti();
  };

  return (
    <div className="min-h-screen flex flex-col bg-yellow-400">
      {/* Audio elements */}
      <audio ref={splashAudioRef} src="/audio/splash-audio.wav" preload="auto" />
      <audio ref={beepAudioRef} src="/audio/beep-sound.wav" preload="auto" />
      <audio ref={confettiAudioRef} src="/audio/confetti-audio.wav" preload="auto" />

      {/* Header */}
      <header className="">
        <div className="relative md:w-2xl mt-2 overflow-hidden max-w-3xl mx-auto rounded-2xl">
          <img
            src="/header-banner.jpg"
            alt="Election Banner"
            className="w-full h-full object-contain"
          />
          {/* <button
            onClick={togglePlayPause}
            className="absolute top-12 right-4 w-10 h-10 bg-white/50 rounded-full flex items-center justify-center shadow-lg hover:bg-white/70 transition"
          >
            <span className="text-xl">{isPlaying ? '⏸️' : '▶️'}</span>
          </button> */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-2xl mx-auto p-5">
          {/* AC Dropdown Section */}
          <div className="bg-white p-4 rounded-xl shadow-md mb-5 relative">
            <label className="block text-sm font-semibold text-blue-900 mb-2">
              Assembly Constituency:
            </label>
            
            {/* Search Bar */}
            {showACDropdown && !hasVoted && (
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search by AC Name, Candidate, or District..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            )}
            
            <button
              onClick={() => !hasVoted && setShowACDropdown(!showACDropdown)}
              disabled={hasVoted || loading}
              className="w-full flex items-center justify-between bg-gray-50 border border-gray-300 rounded-lg px-3 py-3 text-left disabled:opacity-50"
            >
              <span className={selectedAC ? 'text-gray-900' : 'text-gray-400'}>
                {loading ? 'Loading candidates...' : selectedAC || 'Select your AC'}
              </span>
              <span className={`text-xs text-gray-600 transition-transform ${showACDropdown ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {showACDropdown && !hasVoted && !loading && (
              <div className="absolute left-4 right-4 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-72 overflow-y-auto z-50">
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate, index) => (
                    <button
                      key={candidate.sNo}
                      onClick={() => {
                        setSelectedAC(`${candidate.acName} (AC-${candidate.acNumber})`);
                        setSelectedCandidate(candidate);
                        setShowACDropdown(false);
                        setSelectedParty(null);
                        setSearchQuery('');
                        setLedOn(false); // Reset LED when new AC is selected
                      }}
                      className="w-full text-left px-3 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 text-sm text-gray-700"
                    >
                      <div className="font-semibold">{candidate.acName}</div>
                      <div className="text-xs text-gray-500">
                        AC-{candidate.acNumber} • {candidate.district}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Candidate: {candidate.candidateName}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-3 text-sm text-gray-500 text-center">
                    No candidates found matching your search.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* EVM Machine */}
          {selectedAC ? (
            <div className="rounded-3xl shadow-2xl relative">
              {/* EVM Machine Body */}
              <div className="bg-gray-200 rounded-2xl p-4 shadow-inner  border-y-8 border-r-8 border-amber-50">
                {/* Top Blue Strip */}
                <div className="bg-blue-900 h-3 rounded-t-lg mb-2"></div>

                {/* Green LED */}
                <div className="flex justify-center mb-4">
                  <div className={`w-4 h-4 rounded-full shadow-lg transition-all duration-300 ${
                    ledOn 
                      ? 'bg-green-400 shadow-green-400/50 shadow-lg animate-pulse' 
                      : 'bg-green-600'
                  }`}></div>
                </div>

               {/* EVM Content */}
               <div className="bg-white rounded-lg shadow-inner">
                  {/* Unified Ballot Section with Integrated Buttons */}
                  <div className="flex flex-col">
                    {/* Create 13 rows, with selected candidate at position 3 */}
                    {Array.from({ length: 13 }, (_, index) => {
                      const rowNumber = index + 1;
                      const isSelectedCandidate = rowNumber === 3 && selectedCandidate;
                      const isSelected = selectedParty?.id === 1 && isSelectedCandidate;

                      return (
                        <div key={rowNumber} className="flex border-b border-gray-300">
                          {/* Left Side - Candidate Info Section */}
                          <div className={`flex items-center px-3 py-3 flex-1 transition-all duration-200 ${isSelectedCandidate
                              ? isSelected
                                ? 'bg-blue-100 shadow-md'
                                : 'bg-yellow-50'
                              : 'bg-white'
                            }`}>
                            {/* Serial Number */}
                            <div className="w-8 text-center shrink-0">
                              <span className={`text-base font-bold ${isSelectedCandidate
                                  ? isSelected
                                    ? 'text-blue-800'
                                    : 'text-yellow-800'
                                  : 'text-black'
                                }`}>{rowNumber}.</span>
                            </div>

                            {/* Candidate Information */}
                            <div className="flex-1 px-2 min-w-0">
                              {isSelectedCandidate ? (
                                <span className={`text-base font-bold ${isSelected ? 'text-blue-800' : 'text-yellow-800'
                                  }`}>{selectedCandidate?.candidateName}</span>
                              ) : (
                                <span className="text-base text-gray-400">-</span>
                              )}
                            </div>

                            {/* Symbol/Photo Column */}
                            <div className="w-16 flex items-center justify-center gap-1.5 shrink-0">
                              {isSelectedCandidate ? (
                                <>
                                  {/* Candidate Photo - Commented out for now */}
                                  {/* <img
                                    src={parties[0].candidatePhoto}
                                    alt=""
                                    className={`w-7 h-7 rounded object-cover ${isSelected ? 'ring-2 ring-blue-500' : 'ring-2 ring-yellow-400'
                                      }`}
                                  /> */}
                                  <img
                                    src={parties[0].icon}
                                    alt="Symbol"
                                    className={`w-14 h-14 ${isSelected ? 'drop-shadow-lg' : ''
                                      }`}
                                  />
                                </>
                              ) : (
                                <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center">
                                  <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Side - Control Button (Fixed Width) */}
                          <button
                            onClick={() => isSelectedCandidate && handlePartySelect(parties[0])}
                            disabled={hasVoted || !isSelectedCandidate}
                            className={`w-18 md:w-24 flex items-center justify-center transition-all duration-200 ease-in-out shrink-0 ${isSelected
                                ? 'bg-blue-300 scale-95 shadow-inner'
                                : isSelectedCandidate
                                  ? 'bg-blue-700 hover:bg-blue-600 active:scale-95'
                                  : 'bg-gray-400 cursor-not-allowed'
                              } ${hasVoted ? 'opacity-50' : ''}`}
                          >
                            <div className={`w-14 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${isSelected
                                ? 'bg-blue-800 scale-95'
                                : isSelectedCandidate
                                  ? 'bg-blue-800'
                                  : 'bg-gray-500'
                              }`}>
                              <div className={`w-10 h-5 rounded-full flex items-center justify-center ${isSelected
                                  ? 'bg-blue-600 scale-95'
                                  : isSelectedCandidate
                                    ? 'bg-blue-600'
                                    : 'bg-gray-400'
                                }`}>
                                <div className={`w-6 h-3 rounded-full ${isSelected
                                    ? 'bg-blue-500 scale-95'
                                    : isSelectedCandidate
                                      ? 'bg-blue-500'
                                      : 'bg-gray-300'
                                  }`}></div>
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Blue Strip */}
                <div className="bg-blue-900 h-3 rounded-b-lg mt-2"></div>
              </div>

              {/* Promotional Text */}
              <div className="text-center mt-6">
                <p className="text-red-800 font-bold text-lg">
                  6 नवंबर को 3 नंबर पर स्कूल का बस्ता छाप का बटन दबाकर जन सुराज को भारी मतों से विजयी बनाएं
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🗳️</div>
              <p className="text-gray-500 px-10">
                Please select your Assembly Constituency to begin voting
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}