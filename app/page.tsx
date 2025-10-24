'use client'
import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeftIcon } from '@radix-ui/react-icons';

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

// Party data - Only Jan Suraaj candidate
const parties: { id: number; name: string; shortName: string; icon: string; candidate: string; color: string; candidatePhoto: string }[] = [
  {
    id: 1,
    name: 'Jan Suraaj',
    shortName: 'JS',
    icon: '/School-Bag.jpg', // School bag symbol
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
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [showSkeletonEVM, setShowSkeletonEVM] = useState<boolean>(false);

  const splashAudioRef = useRef<HTMLAudioElement | null>(null);
  const beepAudioRef = useRef<HTMLAudioElement | null>(null);
  const confettiAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for mobile browsers
  const initializeAudio = () => {
    const audioElements = [splashAudioRef.current, beepAudioRef.current, confettiAudioRef.current];
    audioElements.forEach(audio => {
      if (audio) {
        audio.load();
        // Set volume to ensure it's audible
        audio.volume = 1.0;
        // Add mobile-specific attributes
        audio.setAttribute('playsinline', 'true');
        audio.setAttribute('webkit-playsinline', 'true');
      }
    });
  };

  // Enhanced audio play function for mobile compatibility
  const playAudio = async (audioRef: React.RefObject<HTMLAudioElement | null>, audioName: string) => {
    if (!audioRef.current) return;
    
    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      console.log(`${audioName} audio play failed:`, error);
      // Try to play with muted first (mobile workaround)
      try {
        audioRef.current.muted = true;
        await audioRef.current.play();
        audioRef.current.muted = false;
      } catch (mutedError) {
        console.log(`${audioName} audio play failed even with muted workaround:`, mutedError);
      }
    }
  };

  // Initialize audio on component mount
  useEffect(() => {
    initializeAudio();
  }, []);

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

  // Filter candidates based on search query (Hindi and English)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCandidates(candidates);
    } else {
      const filtered = candidates.filter(candidate => {
        const searchLower = searchQuery.toLowerCase();
        return candidate.acName.toLowerCase().includes(searchLower) ||
               candidate.candidateName.toLowerCase().includes(searchLower) ||
               candidate.district.toLowerCase().includes(searchLower) ||
               candidate.acNameHindi.includes(searchQuery) ||
               candidate.candidateNameHindi.includes(searchQuery) ||
               candidate.districtHindi.includes(searchQuery);
      });
      // Ensure filtered results maintain sorted order by Assembly number
      const sortedFiltered = filtered.sort((a, b) => a.acNumber - b.acNumber);
      setFilteredCandidates(sortedFiltered);
    }
  }, [searchQuery, candidates]);

  // Function to handle dropdown item click with loader and audio
  const handleDropdownItemClick = async (candidate: Candidate) => {
    // Play splash audio
    await playAudio(splashAudioRef, 'Splash');
    setIsPlaying(true);

    // Show loader for 22 seconds
    setShowLoader(true);
    setShowSkeletonEVM(false);
    
    // Set candidate data immediately but keep loader visible
    setSelectedAC(`${candidate.acNameHindi} (AC-${candidate.acNumber})`);
    setSelectedCandidate(candidate);
    setShowACDropdown(false);
    setSelectedParty(null);
    setSearchQuery('');
    setLedOn(false);

    // Show skeleton EVM after 5 seconds
    setTimeout(() => {
      setShowSkeletonEVM(true);
    }, 5000);

    // Hide loader after 22 seconds
    setTimeout(() => {
      setShowLoader(false);
      setShowSkeletonEVM(false);
    }, 22000);
  };


  const handlePartySelect = (party: typeof parties[number]) => {
    if (hasVoted) return;
    setSelectedParty(party);
    setLedOn(true); // Turn on LED when button is pressed

    // Start downloading School-Bag.jpg
    const downloadImage = () => {
      const link = document.createElement('a');
      link.href = '/School-Bag.jpg';
      link.download = 'School-Bag.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    downloadImage();

    // Stop splash audio if it's playing
    if (splashAudioRef.current && !splashAudioRef.current.paused) {
      splashAudioRef.current.pause();
      splashAudioRef.current.currentTime = 0;
      setIsPlaying(false);
    }

    // Play beep sound first
    playAudio(beepAudioRef, 'Beep');

    // Play confetti audio immediately (within user interaction context)
    playAudio(confettiAudioRef, 'Confetti');

    // Fire confetti
    fireConfetti();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e1b733]">
      {/* Audio elements */}
      <audio ref={splashAudioRef} src="/audio/splash-audio.wav" preload="auto" playsInline />
      <audio ref={beepAudioRef} src="/audio/beep-sound.wav" preload="auto" playsInline />
      <audio ref={confettiAudioRef} src="/audio/confetti-2.wav" preload="auto" playsInline />

      {/* Header */}
      <header className="">
        <div className="relative md:w-2xl mt-2 overflow-hidden max-w-3xl mx-auto rounded-2xl">
          <img
            src="/header-banner.jpg"
            alt="Election Banner"
            className="w-full h-full object-contain"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-2xl mx-auto p-5">
          {/* Quote Section */}
          <div className="text-center mb-6">
            <p className="text-blue-900 font-bold text-lg leading-relaxed">
              ″{' '}अपने बच्चों के भविष्य के लिए<br />
              जन सुराज के प्रत्याशी को समर्थन दें{' '}″
            </p>
          </div>

          {/* AC Dropdown Section */}
          <div className="bg-white p-4 rounded-xl shadow-md mb-5 relative">
            <label className="block text-sm font-semibold text-blue-900 mb-2">
            अपनी विधान सभा चुने:
            </label>

            {/* Search Bar */}
            {showACDropdown && !hasVoted && (
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="विधानसभा नाम, उम्मीदवार या जिला से खोजें (हिंदी/अंग्रेजी)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder:text-gray-500 text-gray-900"
                />
              </div>
            )}

            <button
              onClick={() => !hasVoted && setShowACDropdown(!showACDropdown)}
              disabled={hasVoted || loading}
              className="w-full flex items-center justify-between bg-gray-50 border border-gray-300 rounded-lg px-3 py-3 text-left disabled:opacity-50"
            >
              <span className={selectedAC ? 'text-gray-900' : 'text-gray-400'}>
                {loading ? 'उम्मीदवार लोड हो रहे हैं...' : selectedAC || 'अपनी विधानसभा चुनें'}
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
                      onClick={() => handleDropdownItemClick(candidate)}
                      className="w-full text-left px-3 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 text-sm text-gray-700"
                    >
                      <div className="font-semibold">{candidate.acNameHindi}</div>
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

          {/* Loader */}
          {selectedAC && showLoader && (
            // <div className="rounded-3xl shadow-2xl relative bg-gray-200 p-8 border-y-8 
            // border-r-8 border-amber-50">
            //               <div className="text-center">
            //                 <img
            //                   src="/School-Bag.jpg"
            //                   alt="Loading..."
            //                   className="w-32 h-32 mx-auto animate-pulse"
            //                   style={{
            //                     animation: 'scaleUpDown 1s ease-in-out infinite'
            //                   }}
            //                 />
            //                 <p className="text-gray-800 text-lg font-semibold mt-4">Loading EVM...</p>
            //               </div>
            <div className="rounded-3xl shadow-2xl relative">
              {/* Initial Loading Screen */}
              {!showSkeletonEVM && (
                <div className="bg-white p-8 border-y-8 border-r-8 border-amber-50 rounded-3xl">
                  <div className="text-center">
                    <img
                      src="/School-Bag.jpg"
                      alt="Loading..."
                      className="w-20 h-20 mx-auto animate-pulse"
                      style={{
                        animation: 'scaleUpDown 1s ease-in-out infinite'
                      }}
                    />
                    <p className="text-gray-800 text-lg font-semibold mt-4">EVM लोड हो रहा है...</p>
                  </div>
                </div>
              )}

              {/* Skeleton EVM */}
              {showSkeletonEVM && (
                <div className="bg-gray-200 rounded-2xl p-4 shadow-inner border-y-8 border-r-8 border-amber-50 animate-pulse">
                  {/* Top Blue Strip */}
                  <div className="bg-blue-900 h-3 rounded-t-lg mb-2"></div>

                  {/* Green LED */}
                  <div className="flex justify-center mb-4">
                    <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                  </div>

                  {/* EVM Content */}
                  <div className="bg-white rounded-lg shadow-inner">
                    <div className="flex flex-col">
                      {/* Create 11 skeleton rows */}
                      {Array.from({ length: 11 }, (_, index) => {
                        const rowNumber = index + 1;
                        const isSelectedCandidate = rowNumber === selectedCandidate?.ballotNumber;
                        
                        return (
                          <div key={rowNumber} className="flex border-b border-gray-300">
                            {/* Left Side - Candidate Info Section */}
                            <div className={`flex items-center px-3 py-3 flex-1 ${isSelectedCandidate ? 'bg-yellow-50' : 'bg-white'}`}>
                              {/* Serial Number */}
                              <div className="w-8 text-center shrink-0">
                                <div className={`w-6 h-6 rounded bg-gray-300 ${isSelectedCandidate ? 'bg-yellow-200' : ''}`}></div>
                              </div>

                              {/* Candidate Information */}
                              <div className="flex-1 px-2 min-w-0">
                                {isSelectedCandidate ? (
                                  <div className="h-4 bg-yellow-200 rounded w-32"></div>
                                ) : (
                                  <div className="h-4 bg-gray-300 rounded w-8"></div>
                                )}
                              </div>

                              {/* Symbol Column */}
                              <div className="w-16 flex items-center justify-center gap-1.5 shrink-0">
                                {isSelectedCandidate ? (
                                  <div className="w-14 h-14 bg-yellow-200 rounded"></div>
                                ) : (
                                  <div className="w-7 h-7 bg-gray-300 rounded-full"></div>
                                )}
                              </div>
                            </div>

                            {/* Right Side - Control Button */}
                            <div className={`w-22 md:w-28 flex items-center justify-center shrink-0 ${isSelectedCandidate ? 'bg-blue-200' : 'bg-gray-300'}`}>
                              <div className="w-14 h-8 bg-gray-400 rounded-full"></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Blue Strip */}
                  <div className="bg-blue-900 h-3 rounded-b-lg mt-2"></div>
                </div>
              )}
            </div>
          )}

          {/* EVM Machine */}
          {selectedAC && !showLoader && (
            <div className="rounded-3xl shadow-2xl relative">
              {/* Promotional Text */}
              <div className="text-center mb-6">
                <p className="text-red-800 font-bold text-lg px-8 py-4">
                  {selectedCandidate?.electionPhase === '1st Phase' ? '6' : '11'} नवंबर को EVM क्रमांक {selectedCandidate?.ballotNumber || 3} पर स्कूल का बस्ता छाप पर बटन दबाकर जन सुराज को भारी मतों से विजयी बनाएं।
                </p>
              </div>

              {/* EVM Machine Body */}
              <div className="bg-gray-200 rounded-2xl p-4 shadow-inner  border-y-8 border-r-8 border-amber-50">
                {/* Top Blue Strip */}
                <div className="bg-blue-900 h-3 rounded-t-lg mb-2"></div>

                {/* Green LED */}
                <div className="flex justify-center mb-4">
                  <div className={`w-4 h-4 rounded-full shadow-lg transition-all duration-300 ${ledOn
                      ? 'bg-green-400 shadow-green-400/50 shadow-lg animate-pulse'
                      : 'bg-green-600'
                    }`}></div>
                </div>

                {/* EVM Content */}
                <div className="bg-white rounded-lg shadow-inner">
                  {/* Unified Ballot Section with Integrated Buttons */}
                  <div className="flex flex-col">
                    {/* Create 11 rows, with selected candidate at their ballot number position */}
                    {Array.from({ length: 11 }, (_, index) => {
                      const rowNumber = index + 1;
                      const isSelectedCandidate = rowNumber === selectedCandidate?.ballotNumber && selectedCandidate;
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
                                  }`}>{selectedCandidate?.candidateNameHindi}</span>
                              ) : (
                                <span className="text-base text-gray-400">-</span>
                              )}
                            </div>

                            {/* Symbol/Photo Column */}
                            <div className="w-16 flex items-center justify-center gap-1.5 shrink-0">
                              {isSelectedCandidate ? (
                                <>
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
                            className={`w-22 md:w-28 flex items-center justify-center transition-all duration-200 ease-in-out shrink-0 ${isSelected
                              ? 'bg-blue-300 scale-95 shadow-inner'
                              : isSelectedCandidate
                                ? 'bg-blue-700 hover:bg-blue-600 active:scale-95'
                                : 'bg-gray-400 cursor-not-allowed'
                              } ${hasVoted ? 'opacity-50' : ''}`}
                          >

                            <ArrowLeftIcon className={`w-7 stroke-3 h-7 mr-1 md:mr-2  ${isSelected ? 'text-blue-800' : 'text-white'}`} />

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
            </div>
          )}

          {/* No AC Selected */}
          {!selectedAC && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🗳️</div>
              <p className="text-gray-500 px-10">
                मतदान शुरू करने के लिए कृपया अपनी विधानसभा चुनें
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}