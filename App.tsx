import React, { useState, useEffect } from 'react';
import BriefingStep from './components/BriefingStep';
import ResearchStep from './components/ResearchStep';
import ProposalStep from './components/ProposalStep';
import RefinementStep from './components/RefinementStep';
import FinalStep from './components/FinalStep';
import ProjectLibrary from './components/ProjectLibrary';
import { AppStage, BriefingData, ResearchData, GeneratedOption, ChatMessage, ArchivedImage, Project } from './types';
import { LayoutGrid, PlusCircle } from 'lucide-react';

const STORAGE_KEY = 'dar_design_lab_projects_v2';

const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>(AppStage.BRIEFING);
  
  // App State
  const [briefData, setBriefData] = useState<BriefingData | null>(null);
  const [researchData, setResearchData] = useState<ResearchData | null>(null);
  const [selectedOption, setSelectedOption] = useState<GeneratedOption | null>(null);
  const [finalImage, setFinalImage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // Projects State
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [currentProjectId, setCurrentProjectId] = useState<string>(crypto.randomUUID());
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  // Sync current work to projects array
  const updateCurrentProject = (updates: Partial<Project>) => {
    setProjects(prev => {
      const existing = prev.find(p => p.id === currentProjectId);
      if (existing) {
        return prev.map(p => p.id === currentProjectId ? { ...p, ...updates } : p);
      } else {
        // Create new project entry if it doesn't exist
        const newProj: Project = {
          id: currentProjectId,
          name: briefData ? `${briefData.typology} in ${briefData.location}` : 'Unnamed Project',
          timestamp: Date.now(),
          brief: briefData || { typology: '', location: '', contextDetails: '', prompt: '', inspirationImages: [] },
          images: [],
          ...updates
        };
        return [newProj, ...prev];
      }
    });
  };

  const addToArchive = (img: Partial<ArchivedImage>) => {
    const newImage: ArchivedImage = {
      id: img.id || crypto.randomUUID(),
      url: img.url || '',
      stage: stage,
      timestamp: Date.now(),
      type: img.type || 'UNKNOWN',
      metadata: img.metadata || 'Generated Image'
    };

    setProjects(prev => {
      const proj = prev.find(p => p.id === currentProjectId);
      if (!proj) {
        // Fallback for edge cases
        return prev;
      }
      // Avoid duplicates
      if (proj.images.find(i => i.id === newImage.id)) return prev;
      
      return prev.map(p => p.id === currentProjectId 
        ? { ...p, images: [newImage, ...p.images] } 
        : p
      );
    });
  };

  const startNewProject = () => {
    // Reset state for new project
    setCurrentProjectId(crypto.randomUUID());
    setBriefData(null);
    setResearchData(null);
    setSelectedOption(null);
    setFinalImage('');
    setChatHistory([]);
    setStage(AppStage.BRIEFING);
    setIsLibraryOpen(false);
  };

  const loadProject = (project: Project) => {
    setCurrentProjectId(project.id);
    setBriefData(project.brief);
    setResearchData(project.research || null);
    setFinalImage(project.finalImage || '');
    // If it has a final image, go to final stage, else start at briefing or proposal
    if (project.finalImage) {
      setStage(AppStage.FINAL);
    } else if (project.research) {
      setStage(AppStage.PROPOSAL);
    } else {
      setStage(AppStage.BRIEFING);
    }
    setIsLibraryOpen(false);
  };

  const handleBriefingComplete = (data: BriefingData) => {
    setBriefData(data);
    updateCurrentProject({ 
      brief: data, 
      name: `${data.typology} in ${data.location}`,
      timestamp: Date.now() 
    });
    setStage(AppStage.RESEARCH);
  };

  const handleResearchComplete = (data: ResearchData) => {
    setResearchData(data);
    updateCurrentProject({ research: data });
    setStage(AppStage.PROPOSAL);
  };

  const handleOptionSelected = (option: GeneratedOption) => {
    setSelectedOption(option);
    setStage(AppStage.REFINEMENT);
  };

  const handleRefinementComplete = (image: string, history: ChatMessage[]) => {
    setFinalImage(image);
    setChatHistory(history);
    updateCurrentProject({ finalImage: image });
    setStage(AppStage.FINAL);
  };

  return (
    <div className="min-h-screen bg-arch-black text-arch-light font-sans selection:bg-arch-accent selection:text-black">
      <nav className="border-b border-neutral-800 px-8 py-5 flex items-center justify-between bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={startNewProject}>
            <div className="w-6 h-6 bg-arch-accent rounded-sm transform rotate-45 shadow-[0_0_10px_rgba(0,205,184,0.5)]"></div>
            <span className="text-xl font-bold tracking-tighter text-white">Dar's <span className="text-arch-accent font-light">Design Lab</span></span>
        </div>
        
        <div className="flex items-center gap-8">
            <div className="text-xs text-neutral-500 uppercase tracking-widest hidden lg:block">
                {stage === AppStage.BRIEFING && '01. Input'}
                {stage === AppStage.RESEARCH && '02. Context Analysis'}
                {stage === AppStage.PROPOSAL && '03. Concept Gen'}
                {stage === AppStage.REFINEMENT && '04. Iterative Loop'}
                {stage === AppStage.FINAL && '05. Export'}
            </div>
            
            <button 
                onClick={() => setIsLibraryOpen(true)}
                className="flex items-center text-xs uppercase font-bold text-neutral-400 hover:text-arch-accent transition-colors"
            >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Projects <span className="ml-1 bg-neutral-800 px-1.5 rounded-full text-[10px]">{projects.length}</span>
            </button>

            <button 
                onClick={startNewProject}
                className="flex items-center text-xs uppercase font-bold text-arch-accent hover:text-white transition-colors"
            >
                <PlusCircle className="w-4 h-4 mr-2" />
                New Project
            </button>

            <div className="h-8 border-l border-neutral-800 pl-8 flex items-center">
                <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Dar_Group_logo.svg/320px-Dar_Group_logo.svg.png" 
                    alt="Dar Group" 
                    className="h-6 w-auto object-contain" 
                />
            </div>
        </div>
      </nav>

      <ProjectLibrary 
        isOpen={isLibraryOpen} 
        onClose={() => setIsLibraryOpen(false)} 
        projects={projects}
        onSelectProject={loadProject}
        currentProjectId={currentProjectId}
      />

      <main className="container mx-auto">
        {stage === AppStage.BRIEFING && (
          <BriefingStep onComplete={handleBriefingComplete} />
        )}

        {stage === AppStage.RESEARCH && briefData && (
          <ResearchStep 
            briefData={briefData} 
            onResearchComplete={handleResearchComplete} 
          />
        )}

        {stage === AppStage.PROPOSAL && briefData && researchData && (
          <ProposalStep 
            briefData={briefData}
            researchData={researchData}
            onSelectOption={handleOptionSelected} 
            onArchive={addToArchive}
          />
        )}

        {stage === AppStage.REFINEMENT && selectedOption && briefData && (
          <RefinementStep 
            selectedOption={selectedOption}
            briefData={briefData}
            onFinalize={handleRefinementComplete}
            onArchive={addToArchive}
          />
        )}

        {stage === AppStage.FINAL && finalImage && briefData && researchData && (
          <FinalStep 
            finalImage={finalImage}
            briefData={briefData}
            researchData={researchData}
            history={chatHistory}
            onArchive={addToArchive}
            onStartNew={startNewProject}
          />
        )}
      </main>
    </div>
  );
};

export default App;