
import React, { useState, useEffect } from 'react';
import { BriefingData, ResearchData, ChatMessage, ArchivedImage } from '../types';
import { Download, Share2, Check, Loader2, Camera, PlusCircle, MessageSquare } from 'lucide-react';
import { generateMultiAngleViews } from '../services/gemini';
import { jsPDF } from "jspdf";

interface FinalStepProps {
  finalImage: string;
  briefData: BriefingData;
  researchData: ResearchData;
  history: ChatMessage[];
  onArchive: (img: Partial<ArchivedImage>) => void;
  onStartNew: () => void;
}

const FinalStep: React.FC<FinalStepProps> = ({ finalImage, briefData, researchData, history, onArchive, onStartNew }) => {
  const [angles, setAngles] = useState<string[]>([]);
  const [loadingAngles, setLoadingAngles] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadAngles = async () => {
        try {
            const newAngles = await generateMultiAngleViews(finalImage, briefData);
            if (mounted) {
                setAngles(newAngles);
                newAngles.forEach((url, idx) => {
                    onArchive({
                        id: `angle-${idx}-${Date.now()}`,
                        url: url,
                        type: 'ANGLE',
                        metadata: `Final View: Angle ${idx + 1}`
                    });
                });
            }
        } catch (e) {
            console.error("Angle error", e);
        } finally {
            if (mounted) setLoadingAngles(false);
        }
    };
    loadAngles();
    return () => { mounted = false; };
  }, [finalImage, briefData, onArchive]);

  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const margin = 15;
    
    // Page 1: Cover & Main Visual
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, width, height, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("Dar's Design Lab", margin, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 205, 184); // DAR Teal
    doc.text("ARCHITECTURAL MANIFEST & DESIGN LOG", margin, 28);
    
    try {
        // High-res main image
        doc.addImage(finalImage, 'JPEG', margin, 40, width - (margin * 2), 100);
    } catch(e) { console.error("Img error", e); }
    
    let yPos = 155;
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("Project Identity", margin, yPos);
    
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    yPos += 10;
    doc.text(`Typology: ${briefData.typology}`, margin, yPos);
    yPos += 7;
    doc.text(`Location: ${briefData.location}`, margin, yPos);
    yPos += 7;
    doc.text(`Site Context: ${briefData.contextDetails}`, margin, yPos);
    yPos += 7;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);

    yPos += 15;
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("Executive Summary", margin, yPos);
    yPos += 8;
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    const summaryLines = doc.splitTextToSize(researchData.summary, width - (margin * 2));
    doc.text(summaryLines, margin, yPos);

    // Page 2: Design Evolution (The "Bodies of Text" from Chat History)
    doc.addPage();
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, width, height, 'F');
    
    yPos = 25;
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Design Evolution Log", margin, yPos);
    yPos += 5;
    doc.setDrawColor(0, 205, 184);
    doc.line(margin, yPos, 60, yPos);
    
    yPos += 15;
    doc.setFontSize(10);
    
    // Filter out initial messages if they are generic, then list the refinement steps
    const significantHistory = history.filter(h => h.id !== 'init');
    
    if (significantHistory.length === 0) {
        doc.setTextColor(100, 100, 100);
        doc.text("Project was finalized based on initial conceptual proposal with no iterations.", margin, yPos);
    } else {
        significantHistory.forEach((msg, idx) => {
            // Check if we need a new page
            if (yPos > height - 30) {
                doc.addPage();
                doc.setFillColor(0, 0, 0);
                doc.rect(0, 0, width, height, 'F');
                yPos = 20;
            }

            const isUser = msg.role === 'user';
            doc.setFontSize(8);
            doc.setTextColor(0, 205, 184);
            doc.text(isUser ? "USER INSTRUCTION:" : "SYSTEM ADAPTATION:", margin, yPos);
            
            yPos += 5;
            doc.setFontSize(10);
            doc.setTextColor(isUser ? 255 : 180, isUser ? 255 : 180, isUser ? 255 : 180);
            const msgLines = doc.splitTextToSize(msg.text, width - (margin * 2.5));
            doc.text(msgLines, margin + 5, yPos);
            
            yPos += (msgLines.length * 5) + 8;
        });
    }

    // Page 3: Contextual Research & Additional Views
    doc.addPage();
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, width, height, 'F');
    
    yPos = 25;
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Contextual Research", margin, yPos);
    
    yPos += 15;
    doc.setFontSize(12);
    doc.setTextColor(0, 205, 184);
    doc.text("Vernacular & Materials", margin, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text("Primary Materials:", margin, yPos);
    doc.setTextColor(255, 255, 255);
    doc.text(researchData.materials.join(', '), margin + 35, yPos);
    
    yPos += 8;
    doc.setTextColor(200, 200, 200);
    doc.text("Environmental Logic:", margin, yPos);
    doc.setTextColor(255, 255, 255);
    doc.text(researchData.lighting, margin + 35, yPos);
    
    yPos += 15;
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    const vernLines = doc.splitTextToSize(researchData.vernacular, width - (margin * 2));
    doc.text(vernLines, margin, yPos);

    if (angles.length > 0) {
        yPos += (vernLines.length * 5) + 20;
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text("Alternative Site Views", margin, yPos);
        
        // Fix: Declare angleY to resolve reference error.
        let angleY = yPos + 10;
        angles.forEach((img) => {
             if (angleY > height - 100) {
                 doc.addPage();
                 doc.setFillColor(0, 0, 0);
                 doc.rect(0, 0, width, height, 'F');
                 angleY = 20;
             }
             try {
                 doc.addImage(img, 'JPEG', margin, angleY, width - (margin * 2), 90);
                 angleY += 100;
             } catch(e) {}
        });
    }

    doc.save(`DAR_Design_Lab_${briefData.typology}_Manifest.pdf`);
  };

  return (
    <div className="min-h-screen bg-arch-black text-white p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-light">Project Manifest</h1>
            <p className="text-neutral-500 text-sm">Dar's Design Lab • Final Output</p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={onStartNew}
                className="flex items-center px-4 py-2 bg-neutral-800 rounded hover:bg-neutral-700 transition-colors"
            >
                <PlusCircle className="w-4 h-4 mr-2" /> New Project
            </button>
            <button 
                onClick={handleExportPDF}
                className="flex items-center px-4 py-2 bg-white text-black rounded hover:bg-neutral-200 transition-colors font-medium"
            >
                <Download className="w-4 h-4 mr-2" /> Export PDF Package
            </button>
        </div>
      </header>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl overflow-hidden border border-neutral-800 shadow-2xl">
                <img src={finalImage} alt="Final Render" className="w-full h-auto" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800">
                    <h3 className="text-arch-accent text-xs font-bold uppercase tracking-widest mb-4">Context Logic</h3>
                    <ul className="space-y-3 text-sm text-neutral-300">
                        <li className="flex items-start">
                            <Check className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                            <span>Lighting adapted for {briefData.location} solar path ({researchData.lighting})</span>
                        </li>
                        <li className="flex items-start">
                            <Check className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                            <span>Materiality: {researchData.materials.join(', ')}</span>
                        </li>
                    </ul>
                </div>
                <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800">
                    <h3 className="text-arch-accent text-xs font-bold uppercase tracking-widest mb-4">Design DNA</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                        {briefData.prompt}
                    </p>
                    <div className="mt-4 pt-4 border-t border-neutral-800">
                        <span className="text-xs text-neutral-500 uppercase">Typology</span>
                        <p className="text-white">{briefData.typology}</p>
                    </div>
                </div>
            </div>

            {/* Design Evolution Preview */}
            {history.length > 1 && (
                <div className="bg-neutral-900/50 p-6 rounded-lg border border-neutral-800">
                    <h3 className="text-xl font-light mb-4 flex items-center">
                        <MessageSquare className="w-5 h-5 mr-3 text-arch-accent" />
                        Design Evolution Log
                    </h3>
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-4 scrollbar-thin">
                        {history.filter(h => h.id !== 'init').map((msg) => (
                            <div key={msg.id} className="border-l-2 border-neutral-700 pl-4 py-1">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-arch-accent' : 'text-neutral-500'}`}>
                                    {msg.role === 'user' ? 'Instruction' : 'System Response'}
                                </span>
                                <p className="text-sm text-neutral-300">{msg.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-8 border-t border-neutral-800">
                <h3 className="text-xl font-light mb-4 flex items-center">
                    <Camera className="w-5 h-5 mr-3 text-arch-accent" />
                    Additional Angles
                </h3>
                {loadingAngles ? (
                    <div className="flex items-center justify-center h-32 bg-neutral-900 rounded-lg">
                        <Loader2 className="w-6 h-6 text-arch-accent animate-spin mr-3" />
                        <span className="text-neutral-500 text-sm">Generating site views...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {angles.map((angleImg, idx) => (
                            <div key={idx} className="aspect-video rounded-lg overflow-hidden border border-neutral-800 hover:border-arch-accent transition-colors group">
                                <img src={angleImg} alt={`View ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800 h-full">
                <h3 className="text-xl font-light mb-6">Architectural Summary</h3>
                
                <div className="space-y-6 text-sm">
                    <div>
                        <h4 className="text-white font-medium mb-1">Vernacular Alignment</h4>
                        <p className="text-neutral-400">{researchData.vernacular}</p>
                    </div>
                    
                    <div>
                        <h4 className="text-white font-medium mb-1">Executive Summary</h4>
                        <p className="text-neutral-400">{researchData.summary}</p>
                    </div>

                    <div className="pt-6 border-t border-neutral-800">
                        <h4 className="text-white font-medium mb-2">Technical Specs</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs text-neutral-500">
                            <div>Resolution: 4K</div>
                            <div>Render Engine: Gemini 2.5</div>
                            <div>Format: PNG/PDF</div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-12">
                     <button onClick={onStartNew} className="w-full py-3 border border-neutral-700 text-neutral-400 hover:text-white hover:border-white transition-colors rounded text-sm uppercase tracking-wider">
                        Archive & New Project
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FinalStep;
