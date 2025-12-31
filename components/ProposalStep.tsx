import React, { useEffect, useState } from 'react';
import { BriefingData, ResearchData, GeneratedOption, ArchivedImage } from '../types';
import { generateArchitecturalConcepts, generateHybridConcepts } from '../services/gemini';
import { ArrowRight, ArrowLeft, Loader2, Sparkles, Check, Layers, FlaskConical } from 'lucide-react';

interface ProposalStepProps {
  briefData: BriefingData;
  researchData: ResearchData;
  onSelectOption: (option: GeneratedOption) => void;
  onArchive: (img: Partial<ArchivedImage>) => void;
}

const ProposalStep: React.FC<ProposalStepProps> = ({ briefData, researchData, onSelectOption, onArchive }) => {
  const [options, setOptions] = useState<GeneratedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Synthesis State
  const [showSynthesisUI, setShowSynthesisUI] = useState(false);
  const [synthesisPrompt, setSynthesisPrompt] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      const generated = await generateArchitecturalConcepts(briefData, researchData);
      
      // Archive generated options
      generated.forEach(opt => {
          onArchive({
              id: opt.id,
              url: opt.imageUrl,
              type: 'CONCEPT',
              metadata: `${opt.title}: ${opt.description}`
          });
      });

      setOptions(generated);
      setLoading(false);
    };

    fetchOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % options.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + options.length) % options.length);
  };

  const handleSynthesis = async () => {
    if (!synthesisPrompt.trim()) return;
    setIsSynthesizing(true);
    setShowSynthesisUI(false); // Close modal
    try {
        // Generate 3 variants
        const hybridOptions = await generateHybridConcepts(briefData, researchData, options, synthesisPrompt);
        
        // Archive new hybrids
        hybridOptions.forEach(opt => {
          onArchive({
              id: opt.id,
              url: opt.imageUrl,
              type: 'HYBRID',
              metadata: opt.title
          });
        });

        // Append new options and switch view to the first new one
        setOptions(prev => [...prev, ...hybridOptions]);
        setCurrentIndex(options.length); // Index of the first new item
    } catch (e) {
        console.error(e);
    } finally {
        setIsSynthesizing(false);
    }
  };

  if (loading) {
     return (
        <div className="h-screen flex flex-col items-center justify-center text-center">
            <Loader2 className="w-12 h-12 text-arch-accent animate-spin mb-4" />
            <p className="text-xl font-light text-white">Drafting conceptual models...</p>
            <p className="text-sm text-neutral-500 mt-2">Rendering 8K visualizations</p>
        </div>
     );
  }

  if (options.length === 0) {
      return (
          <div className="h-screen flex flex-col items-center justify-center text-center">
              <p className="text-red-400 mb-4">Generation failed. Please try again.</p>
              <button onClick={() => window.location.reload()} className="text-white underline">Reload</button>
          </div>
      )
  }

  const currentOption = options[currentIndex];

  if (isSynthesizing) {
    return (
        <div className="h-screen flex flex-col items-center justify-center text-center bg-black/90 z-50">
            <FlaskConical className="w-16 h-16 text-arch-accent animate-bounce mb-6" />
            <h2 className="text-2xl font-light text-white tracking-widest">LABORATORY ACTIVE</h2>
            <p className="text-neutral-400 mt-4 max-w-md">
                Creating 3 distinct hybrid strains based on your direction: <br/>
                <span className="italic text-arch-accent">"{synthesisPrompt}"</span>
            </p>
        </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] w-full relative flex flex-col bg-arch-black overflow-hidden">
      
      {/* Synthesis Modal Overlay */}
      {showSynthesisUI && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-lg w-full p-8 shadow-2xl transform transition-all scale-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl text-white font-light flex items-center">
                        <Layers className="w-5 h-5 mr-3 text-arch-accent" />
                        Design Synthesis Lab
                    </h3>
                    <button onClick={() => setShowSynthesisUI(false)} className="text-neutral-500 hover:text-white">Close</button>
                </div>
                <p className="text-neutral-400 text-sm mb-4">
                    Dar's Design Lab will blend the existing concepts to create 3 new variants. 
                    <br/><br/>
                    <strong className="text-white">Which parts should be mixed?</strong>
                </p>
                <textarea 
                    value={synthesisPrompt}
                    onChange={(e) => setSynthesisPrompt(e.target.value)}
                    placeholder="e.g. Combine the glass facade of 'The Direct Vision' with the stone structure of 'The Muse'. Make it more sustainable."
                    className="w-full bg-black border border-neutral-700 rounded-lg p-4 text-white focus:border-arch-accent outline-none h-32 resize-none mb-6"
                    autoFocus
                />
                <button 
                    onClick={handleSynthesis}
                    disabled={!synthesisPrompt.trim()}
                    className="w-full bg-arch-accent text-black font-bold py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Generate 3 New Variants
                </button>
            </div>
        </div>
      )}

      {/* Main Carousel Area */}
      <div className="flex-1 relative flex items-center justify-center">
        
        {/* Background Blur */}
        <div 
            className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110"
            style={{ backgroundImage: `url(${currentOption.imageUrl})` }}
        />

        {/* Navigation Left */}
        <button 
            onClick={handlePrev}
            className="absolute left-4 md:left-8 z-20 p-4 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all backdrop-blur-sm border border-white/10 group"
        >
            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        </button>

        {/* Image Container */}
        <div className="relative z-10 w-full max-w-5xl h-[65vh] px-4 md:px-0 flex items-center justify-center">
             <img 
                key={currentOption.id} // Forces animation on change
                src={currentOption.imageUrl} 
                alt={currentOption.title}
                className="max-h-full max-w-full object-contain rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fade-in"
            />
            
            {/* Type Badge */}
            <div className="absolute top-4 left-6 md:left-0 bg-black/80 backdrop-blur text-arch-accent text-xs font-bold px-4 py-2 uppercase tracking-widest border-l-2 border-arch-accent">
                {currentOption.type}
            </div>
        </div>

        {/* Navigation Right */}
        <button 
            onClick={handleNext}
            className="absolute right-4 md:right-8 z-20 p-4 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all backdrop-blur-sm border border-white/10 group"
        >
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Bottom Control Panel */}
      <div className="h-48 bg-neutral-900 border-t border-neutral-800 flex flex-col items-center justify-center p-6 relative z-30">
        <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-5xl gap-6">
            
            {/* Text Info */}
            <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl text-white font-light mb-1">{currentOption.title}</h2>
                <p className="text-neutral-500 text-sm max-w-lg">{currentOption.description}</p>
                <div className="text-xs text-neutral-600 mt-2">Option {currentIndex + 1} of {options.length}</div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                 <button 
                    onClick={() => setShowSynthesisUI(true)}
                    className="flex items-center px-6 py-3 border border-neutral-700 rounded-full text-neutral-400 hover:text-white hover:border-arch-accent hover:bg-neutral-800 transition-all text-sm uppercase tracking-wide"
                >
                    <FlaskConical className="w-4 h-4 mr-2" />
                    Mix Designs
                </button>

                <button 
                    onClick={() => onSelectOption(currentOption)}
                    className="flex items-center px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-arch-accent transition-all shadow-lg transform hover:scale-105 active:scale-95"
                >
                    Select to Refine
                    <Check className="w-4 h-4 ml-2" />
                </button>
            </div>

             {/* Pagination Dots */}
             <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                {options.map((_, idx) => (
                    <div 
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-2 h-2 rounded-full cursor-pointer transition-all ${idx === currentIndex ? 'bg-arch-accent w-6' : 'bg-neutral-700 hover:bg-neutral-500'}`}
                    />
                ))}
            </div>
        </div>
      </div>

    </div>
  );
};

export default ProposalStep;