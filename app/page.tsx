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
    setSelectedAC(candidate.acNameHindi);
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
    <div className="min-h-screen flex flex-col bg-amber-300">
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
          </div>
          <div className="max-w-2xl mx-auto p-1">

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
                  <div className="bg-white rounded-lg shadow-inner overflow-hidden">
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
            <div className="rounded-lg shadow-2xl relative overflow-hidden">
              {/* Promotional Text */}
              <div className="text-center mb-6">
                <p className="text-amber-900 font-bold text-lg px-4 py-4">
                  {selectedCandidate?.electionPhase === 'पहला चरण' ? '6' : '11'} नवंबर को EVM क्रमांक {selectedCandidate?.ballotNumber || 3} पर स्कूल का बस्ता छाप पर बटन दबाकर जन सुराज को भारी मतों से विजयी बनाएं।
                </p>
              </div>

              {/* EVM Machine Body */}
              <div className=" rounded-xl shadow-inner border-4 border-[#2D3748] overflow-hidden">
                {/* Top Orange Strip */}
                <div className="bg-amber-600 m-2 rounded-xl">
                  <h2 className="text-center text-black text-base font-bold p-4"> इलेक्ट्रॉनिक वोटिंग मशीन (EVM)  </h2>
                </div>

                {/* Pink EVM Content Area */}
                <div className="bg-amber-100 p-1 md:p-3">
                  {/* Table Header */}
                  <div className="bg-amber-200 border-2 border-amber-500 rounded-t-lg overflow-hidden">
                    <div className="grid grid-cols-[45px_1fr_70px_70px_85px] md:grid-cols-[55px_1fr_70px_85px_110px] gap-0 text-center py-1.5 md:py-2">
                      <div className="text-[10px] md:text-xs font-bold text-gray-800 px-1 flex items-center justify-center">क्रमांक</div>
                      <div className="text-[10px] md:text-xs font-bold text-gray-800 px-1 flex items-center justify-center">नाम</div>
                      <div className="text-[10px] md:text-xs font-bold text-gray-800 px-1 flex items-center justify-center leading-tight">फोटो</div>
                      <div className="text-[10px] md:text-xs font-bold text-gray-800 px-1 flex items-center justify-center">चिन्ह</div>
                      <div className="text-[10px] md:text-xs font-bold text-gray-800 px-1 flex items-center justify-center">बटन</div>
                    </div>
                  </div>

                  {/* Table Rows */}
                  <div className="bg-amber-100 border-2 border-t-0 border-amber-500 rounded-b-lg overflow-hidden">
                    {Array.from({ length: 10 }, (_, index) => {
                      const rowNumber = index + 1;
                      const isSelectedCandidate = rowNumber === selectedCandidate?.ballotNumber && selectedCandidate;
                      const isSelected = selectedParty?.id === 1 && isSelectedCandidate;

                      return (
                        <div key={rowNumber} className={`grid grid-cols-[45px_1fr_70px_70px_85px] md:grid-cols-[55px_1fr_85px_85px_110px] gap-0 border-b-2 border-amber-500 last:border-b-0 min-h-[65px] md:min-h-[75px] ${isSelected ? 'bg-amber-200' : ''}`}>
                          {/* Serial Number */}
                          <div className="flex items-center justify-center py-2">
                            <span className="text-sm md:text-base font-bold text-gray-800">{rowNumber}</span>
                          </div>

                          {/* Candidate Name */}
                          <div className="flex items-center px-1.5 md:px-2 py-2">
                            {isSelectedCandidate ? (
                              <div className="text-left w-full">
                                <div className="text-xs md:text-sm font-bold text-gray-900 leading-tight mb-0.5">{selectedCandidate?.candidateNameHindi}</div>
                                <div className="text-[10px] md:text-xs text-gray-700 italic leading-tight">{selectedCandidate?.candidateName}</div>
                                <div className="text-[10px] md:text-xs text-gray-600 leading-tight">Jan Suraaj</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400"></span>
                            )}
                          </div>

                          {/* Candidate Photo */}
                          <div className="flex items-center justify-center py-2 px-1">
                            {isSelectedCandidate ? (
                              <div className="w-8 h-8 md:w-14 md:h-14 bg-white rounded border-2 border-gray-400 overflow-hidden shrink-0">
                                <img
                                  src={parties[0].candidatePhoto}
                                  alt="Candidate"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="56" height="56"%3E%3Crect fill="%23e5e7eb" width="56" height="56"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="20" fill="%239ca3af"%3E👤%3C/text%3E%3C/svg%3E';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-9 h-9 md:w-10 md:h-10 bg-gray-300 rounded-full flex items-center justify-center shrink-0">
                                <div className="w-6 h-6 md:w-7 md:h-7 bg-gray-400 rounded-full"></div>
                              </div>
                            )}
                          </div>

                          {/* Party Symbol */}
                          <div className="flex items-center justify-center py-2 px-1">
                            {isSelectedCandidate ? (
                              <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-gray-400 overflow-hidden flex items-center justify-center shrink-0">
                                <img
                                  src={parties[0].icon}
                                  alt="Symbol"
                                  className="w-10 h-10 md:w-12 md:h-12 object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-9 h-9 md:w-10 md:h-10 bg-gray-300 rounded-full flex items-center justify-center shrink-0">
                                <div className="w-6 h-6 md:w-7 md:h-7 bg-gray-400 rounded-full"></div>
                              </div>
                            )}
                          </div>

                          {/* Vote Button */}
                          <div className="flex items-center justify-center gap-2 py-2 px-1">
                            {/* LED indicator */}
                            <div
                              className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full ${isSelected ? 'bg-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.35)]' : 'bg-gray-400'
                                }`}
                            />
                            <button
                              onClick={() => isSelectedCandidate && handlePartySelect(parties[0])}
                              disabled={hasVoted || !isSelectedCandidate}
                              className={`w-full max-w-[75px] md:max-w-[95px] h-9 md:h-10 rounded-lg font-bold text-[10px] md:text-xs transition-all duration-200 leading-tight ${isSelected
                                  ? 'bg-amber-700 text-white shadow-inner'
                                  : isSelectedCandidate
                                    ? 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95'
                                    : 'bg-amber-300 text-gray-600 cursor-not-allowed'
                                }`}
                            >
                              {isSelectedCandidate ? 'बटन दबाएं' : ''}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Orange Strip */}
                <div className="bg-[#FF8C42] h-3 md:h-4"></div>
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