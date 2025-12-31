import React, { useState, useEffect, useRef } from 'react';
import { BriefingData, GeneratedOption, ChatMessage, ArchivedImage } from '../types';
import { refineArchitecturalImage } from '../services/gemini';
import { Send, Loader2, CheckCircle, History, Undo2, RefreshCw } from 'lucide-react';

interface RefinementStepProps {
  selectedOption: GeneratedOption;
  briefData: BriefingData;
  onFinalize: (finalImage: string, history: ChatMessage[]) => void;
  onArchive: (img: Partial<ArchivedImage>) => void;
}

interface DesignVersion {
    id: string;
    imageUrl: string;
    timestamp: Date;
    prompt: string;
}

const RefinementStep: React.FC<RefinementStepProps> = ({ selectedOption, briefData, onFinalize, onArchive }) => {
  // State
  const [currentImage, setCurrentImage] = useState(selectedOption.imageUrl);
  const [historyVersions, setHistoryVersions] = useState<DesignVersion[]>([
      { id: 'v0', imageUrl: selectedOption.imageUrl, timestamp: new Date(), prompt: 'Original Concept' }
  ]);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { 
        id: 'init', 
        role: 'model', 
        text: `I've loaded the "${selectedOption.title}" concept. Please verify the mood and materials. How should we iterate on this design?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async (overridePrompt?: string) => {
    const promptText = overridePrompt || input;
    if (!promptText.trim() || isProcessing) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: promptText };
    setChatHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
        const newImageUrl = await refineArchitecturalImage(currentImage, userMsg.text, briefData);
        
        if (newImageUrl) {
            // Update Image
            setCurrentImage(newImageUrl);
            
            // Add to Version History
            const newVersionId = crypto.randomUUID();
            setHistoryVersions(prev => [
                ...prev, 
                { 
                    id: newVersionId, 
                    imageUrl: newImageUrl, 
                    timestamp: new Date(), 
                    prompt: userMsg.text 
                }
            ]);

            // Add to Global Archive
            onArchive({
                id: newVersionId,
                url: newImageUrl,
                type: 'ITERATION',
                metadata: `Refinement: ${userMsg.text}`
            });

            const modelMsg: ChatMessage = { 
                id: crypto.randomUUID(), 
                role: 'model', 
                text: "Design updated. I've incorporated your comments while maintaining the inspiration mood. What else needs adjustment?",
                imageUrl: newImageUrl 
            };
            setChatHistory(prev => [...prev, modelMsg]);
        } else {
             throw new Error("No image generated");
        }

    } catch (e) {
        console.error(e);
        const errorMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'model',
            text: "I encountered an error processing that refinement. Please try a different instruction."
        };
        setChatHistory(prev => [...prev, errorMsg]);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCompleteRedesign = () => {
      const prompt = "COMPLETELY REDESIGN the view. Keep the location and massing, but change the materials, lighting, and architectural detailing significantly to create a fresh alternative option.";
      handleSend(prompt);
  };

  const restoreVersion = (version: DesignVersion) => {
      setCurrentImage(version.imageUrl);
      const restoreMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'model',
          text: `Restored version from ${version.timestamp.toLocaleTimeString()}.`
      };
      setChatHistory(prev => [...prev, restoreMsg]);
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      
      {/* Left: Visualization Canvas & History */}
      <div className="flex-1 bg-black relative flex flex-col">
        
        {/* Canvas */}
        <div className="flex-1 relative flex items-center justify-center p-8 pb-32">
             <div className="relative w-full h-full max-w-5xl flex items-center justify-center rounded-lg overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-900">
                {currentImage ? (
                    <img src={currentImage} alt="Current Render" className="max-w-full max-h-full object-contain" />
                ) : (
                    <div className="text-neutral-500">No Image Available</div>
                )}
                
                {isProcessing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                        <Loader2 className="w-10 h-10 text-arch-accent animate-spin mb-4" />
                        <p className="text-white tracking-widest text-sm uppercase">Redesigning...</p>
                        <p className="text-neutral-400 text-xs mt-2">Applying mood & geometry constraints</p>
                    </div>
                )}
            </div>

            {/* Finalize Button Overlay */}
            <button 
                onClick={() => onFinalize(currentImage, chatHistory)}
                className="absolute top-8 right-8 bg-arch-accent hover:brightness-110 text-black px-6 py-3 rounded-full font-bold shadow-lg flex items-center transition-all z-20"
            >
                <CheckCircle className="w-5 h-5 mr-2" /> Finalize Selection
            </button>

            {/* Context Label */}
             <div className="absolute top-8 left-8 bg-black/50 backdrop-blur px-4 py-2 rounded border border-white/10 pointer-events-none">
                <h2 className="text-white text-sm font-medium">{selectedOption.title} <span className="text-arch-accent">({historyVersions.length} Iterations)</span></h2>
                <p className="text-neutral-400 text-xs">{briefData.location}</p>
            </div>
        </div>

        {/* History Strip (Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-arch-dark border-t border-neutral-800 flex flex-col">
            <div className="px-6 py-2 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500 uppercase flex items-center">
                    <History className="w-3 h-3 mr-1" /> Version History
                </span>
                <span className="text-xs text-neutral-600">Click to Restore</span>
            </div>
            <div className="flex-1 overflow-x-auto px-6 pb-4 flex gap-4 items-center">
                {historyVersions.map((v, idx) => (
                    <div 
                        key={v.id} 
                        onClick={() => restoreVersion(v)}
                        className={`relative h-20 aspect-video rounded-md overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 group ${
                            currentImage === v.imageUrl ? 'border-arch-accent ring-2 ring-arch-accent/20' : 'border-neutral-700 hover:border-neutral-500'
                        }`}
                    >
                        <img src={v.imageUrl} alt={`v${idx}`} className="w-full h-full object-cover" />
                        {currentImage !== v.imageUrl && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Undo2 className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[9px] text-white p-1 truncate">
                            {idx === 0 ? 'Original' : `v${idx}`}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Right: Conversational UI (Input) */}
      <div className="w-full lg:w-[400px] bg-arch-dark border-l border-neutral-800 flex flex-col z-30 shadow-xl">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
            <div>
                <h3 className="text-white font-medium text-lg">Design Studio</h3>
                <p className="text-xs text-neutral-500 mt-1">
                    Iterate on details or reimagine the concept.
                </p>
            </div>
             <button 
                onClick={handleCompleteRedesign}
                title="Completely Redesign"
                className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
             >
                 <RefreshCw className="w-4 h-4" />
             </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-900/50" ref={chatContainerRef}>
            {chatHistory.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === 'user' 
                        ? 'bg-white text-black rounded-tr-none shadow-md' 
                        : 'bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700'
                    }`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            {isProcessing && (
                 <div className="flex justify-start">
                    <div className="bg-neutral-800 rounded-2xl px-4 py-3 rounded-tl-none border border-neutral-700 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                 </div>
            )}
        </div>

        <div className="p-5 border-t border-neutral-800 bg-neutral-900">
            <label className="text-xs text-arch-accent font-bold uppercase tracking-widest mb-2 block">
                Editor Comments / Changes
            </label>
            <div className="relative">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="e.g. Change the facade to glass, make it night time..."
                    className="w-full bg-black border border-neutral-700 text-white rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:border-arch-accent text-sm resize-none h-24"
                    disabled={isProcessing}
                />
                <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isProcessing}
                    className="absolute right-3 bottom-3 p-2 bg-arch-accent text-black rounded-lg hover:brightness-110 disabled:opacity-50 transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
             <p className="text-[10px] text-neutral-600 mt-2 text-center">
                Press Enter to generate iteration
            </p>
        </div>
      </div>
    </div>
  );
};

export default RefinementStep;