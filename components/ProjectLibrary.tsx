import React, { useState } from 'react';
import { Project, ArchivedImage } from '../types';
import { Download, X, Clock, Folder, ChevronLeft, Calendar, Building2 } from 'lucide-react';

interface ProjectLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSelectProject: (p: Project) => void;
  currentProjectId: string;
}

const ProjectLibrary: React.FC<ProjectLibraryProps> = ({ isOpen, onClose, projects, onSelectProject, currentProjectId }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  if (!isOpen) return null;

  const handleProjectClick = (p: Project) => {
    setSelectedProject(p);
  };

  const handleRestoreProject = (p: Project) => {
    onSelectProject(p);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex justify-end animate-fade-in">
      <div className="w-full max-w-2xl bg-arch-dark h-full border-l border-neutral-800 shadow-2xl flex flex-col transform transition-transform duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900">
            <div className="flex items-center">
                {selectedProject && (
                  <button 
                    onClick={() => setSelectedProject(null)} 
                    className="mr-4 p-2 hover:bg-neutral-800 rounded-full text-neutral-400 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                    <h2 className="text-xl text-white font-light flex items-center">
                        <Folder className="w-5 h-5 mr-3 text-arch-accent" />
                        {selectedProject ? selectedProject.name : 'Project Archive'}
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      {selectedProject 
                        ? `${selectedProject.images.length} assets in this project` 
                        : `${projects.length} folders`
                      }
                    </p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Browser Content */}
        <div className="flex-1 overflow-y-auto p-6">
            {!selectedProject ? (
                // FOLDER VIEW
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {projects.length === 0 ? (
                        <div className="col-span-2 h-64 flex flex-col items-center justify-center text-neutral-600">
                            <Folder className="w-12 h-12 mb-4 opacity-20" />
                            <p>No projects archived yet.</p>
                        </div>
                    ) : (
                        projects.map((p) => (
                            <div 
                                key={p.id} 
                                onClick={() => handleProjectClick(p)}
                                className={`group p-5 rounded-xl border border-neutral-800 hover:border-arch-accent hover:bg-neutral-900 transition-all cursor-pointer relative ${p.id === currentProjectId ? 'ring-1 ring-arch-accent/40 bg-arch-accent/5' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-neutral-800 rounded-lg group-hover:bg-arch-accent group-hover:text-black transition-colors">
                                    <Folder className="w-6 h-6" />
                                  </div>
                                  <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-tighter">
                                    {p.images.length} Items
                                  </div>
                                </div>
                                
                                <h3 className="text-white font-medium text-sm line-clamp-1 mb-1">{p.name}</h3>
                                
                                <div className="flex items-center text-[10px] text-neutral-500 space-x-3">
                                  <div className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {new Date(p.timestamp).toLocaleDateString()}</div>
                                  <div className="flex items-center"><Building2 className="w-3 h-3 mr-1" /> {p.brief.typology}</div>
                                </div>

                                {p.id === currentProjectId && (
                                  <div className="absolute top-2 right-2 flex items-center space-x-1">
                                    <span className="w-1.5 h-1.5 bg-arch-accent rounded-full animate-pulse"></span>
                                    <span className="text-[9px] text-arch-accent font-bold uppercase tracking-widest">Active</span>
                                  </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            ) : (
                // IMAGE VIEW WITHIN FOLDER
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-neutral-800/50 p-4 rounded-lg border border-neutral-800">
                    <div className="text-sm text-neutral-300">
                      View all generations for this project.
                    </div>
                    <button 
                      onClick={() => handleRestoreProject(selectedProject)}
                      className="px-4 py-2 bg-arch-accent text-black rounded text-xs font-bold uppercase hover:brightness-110 transition-all"
                    >
                      Open in Studio
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      {selectedProject.images.map((img) => (
                          <div key={img.id} className="group relative aspect-video bg-black rounded-lg overflow-hidden border border-neutral-800 hover:border-arch-accent transition-all">
                              <img src={img.url} alt={img.metadata} className="w-full h-full object-cover" />
                              
                              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                                  <div>
                                      <span className="text-[10px] uppercase tracking-widest bg-arch-accent text-black px-2 py-1 rounded-sm font-bold">
                                          {img.type}
                                      </span>
                                      <p className="text-white text-xs font-medium mt-2 line-clamp-2">{img.metadata}</p>
                                  </div>
                                  
                                  <div className="flex justify-between items-end">
                                      <div className="flex items-center text-[10px] text-neutral-400">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {new Date(img.timestamp).toLocaleTimeString()}
                                      </div>
                                      <a 
                                          href={img.url} 
                                          download={`Dar_Lab_${img.id}.png`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="p-2 bg-white text-black rounded-full hover:bg-arch-accent transition-colors"
                                      >
                                          <Download className="w-4 h-4" />
                                      </a>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProjectLibrary;