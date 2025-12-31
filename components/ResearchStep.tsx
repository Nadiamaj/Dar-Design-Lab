import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { BriefingData, ResearchData } from '../types';
import { performContextResearch } from '../services/gemini';

interface ResearchStepProps {
  briefData: BriefingData;
  onResearchComplete: (data: ResearchData) => void;
}

const ResearchStep: React.FC<ResearchStepProps> = ({ briefData, onResearchComplete }) => {
  const [status, setStatus] = useState("Initializing geospatial data...");
  const [details, setDetails] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const runResearch = async () => {
      // Simulate status updates for UX
      setTimeout(() => isMounted && setStatus(`Analyzing vernacular in ${briefData.location}...`), 1500);
      setTimeout(() => isMounted && setStatus("Cross-referencing typology with local climate data..."), 3500);
      setTimeout(() => isMounted && setStatus("Synthesizing material palette..."), 5500);

      try {
        const research = await performContextResearch(briefData);
        if (isMounted) {
            setDetails([
                `Detected Context: ${research.lighting}`,
                `Suggested Materials: ${research.materials.join(', ')}`,
                `Style Note: ${research.vernacular}`
            ]);
            // Give user a moment to read the final status before completing
            setTimeout(() => {
                onResearchComplete(research);
            }, 2000);
        }
      } catch (e) {
        console.error(e);
        if(isMounted) setStatus("Error accessing context database.");
      }
    };

    runResearch();

    return () => { isMounted = false; };
  }, [briefData, onResearchComplete]);

  return (
    <div className="h-screen flex flex-col items-center justify-center p-8 bg-arch-black text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-arch-accent blur-xl opacity-20 rounded-full animate-pulse"></div>
        <Loader2 className="w-16 h-16 text-arch-accent animate-spin relative z-10" />
      </div>
      
      <h2 className="mt-8 text-2xl font-light tracking-widest uppercase text-white animate-pulse">
        {status}
      </h2>

      <div className="mt-8 max-w-md w-full space-y-2">
        {details.map((detail, idx) => (
            <div key={idx} className="text-sm text-neutral-400 border-l-2 border-arch-gray pl-3 text-left animate-fade-in-up">
                {detail}
            </div>
        ))}
      </div>
    </div>
  );
};

export default ResearchStep;
