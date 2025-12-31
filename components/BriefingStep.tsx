import React, { useState, useRef } from 'react';
import { BriefingData } from '../types';
import { Upload, MapPin, Building, Image as ImageIcon, X, Plus, Box, Ruler, Layers, Palette, Sliders } from 'lucide-react';

interface BriefingStepProps {
  onComplete: (data: BriefingData) => void;
}

const BriefingStep: React.FC<BriefingStepProps> = ({ onComplete }) => {
  const [data, setData] = useState<BriefingData>({
    typology: 'Museum',
    location: '',
    contextDetails: '',
    prompt: '',
    inspirationImages: [],
    massingImage: undefined,
    builtUpArea: '',
    floorCount: '',
    preferredMaterials: '',
    moodMatchIntensity: 50,
  });

  const inspirationInputRef = useRef<HTMLInputElement>(null);
  const massingInputRef = useRef<HTMLInputElement>(null);

  const handleInspirationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);
      const remainingSlots = 10 - data.inspirationImages.length;
      
      if (remainingSlots <= 0) return;

      const filesToProcess = files.slice(0, remainingSlots);

      Promise.all(filesToProcess.map((file: File) => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      }))).then(newImages => {
        setData(prev => ({
          ...prev, 
          inspirationImages: [...prev.inspirationImages, ...newImages]
        }));
      });
    }
  };

  const handleMassingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({ ...prev, massingImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeInspirationImage = (index: number) => {
    setData(prev => ({
      ...prev,
      inspirationImages: prev.inspirationImages.filter((_, i) => i !== index)
    }));
  };

  const removeMassingImage = () => {
    setData(prev => ({ ...prev, massingImage: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in pb-20">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-light text-white mb-2 tracking-wide">Studio Briefing</h1>
        <p className="text-arch-light opacity-60">Define the constraints. Dar's Design Lab will handle the reality.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 bg-arch-dark p-8 rounded-xl border border-arch-gray">
        
        {/* Row 1: Typology & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-arch-accent">
              <Building className="w-4 h-4 mr-2" /> Typology
            </label>
            <select
              value={data.typology}
              onChange={(e) => setData({ ...data, typology: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-arch-accent outline-none"
            >
              <option value="Museum">Museum / Cultural</option>
              <option value="Healthcare">Healthcare / Hospital</option>
              <option value="Residential High-Rise">Residential High-Rise</option>
              <option value="Private Villa">Private Villa</option>
              <option value="Boutique Hotel">Boutique Hotel</option>
              <option value="Luxury Resort">Luxury Resort / Hotel</option>
              <option value="Office Tower">Office Tower</option>
              <option value="School">School / University</option>
              <option value="Daycare">Daycare / Early Education</option>
              <option value="Stadium">Stadium / Sports Arena</option>
              <option value="Entertainment District">Entertainment District</option>
              <option value="Urban Park">Urban Park / Public Space</option>
              <option value="Mixed Use">Mixed Use Development</option>
              <option value="Transport Hub">Transport Hub / Airport</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-arch-accent">
              <MapPin className="w-4 h-4 mr-2" /> Regional Context
            </label>
            <input
              type="text"
              placeholder="e.g. Riyadh, Saudi Arabia"
              required
              value={data.location}
              onChange={(e) => setData({ ...data, location: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-arch-accent outline-none placeholder-neutral-600"
            />
          </div>
        </div>

        {/* Row 2: Micro Details */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-arch-light">Specific Context (Neighborhood/Terrain)</label>
          <input
            type="text"
            placeholder="e.g. Limestone cliffside, facing the Red Sea, arid climate"
            required
            value={data.contextDetails}
            onChange={(e) => setData({ ...data, contextDetails: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-arch-accent outline-none placeholder-neutral-600"
          />
        </div>

        {/* Optional Technical Factors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-800">
           <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-arch-light">
                   <Ruler className="w-4 h-4 mr-2" /> Built-Up Area (Optional)
                </label>
                <input
                    type="text"
                    placeholder="e.g. 50,000 sqm"
                    value={data.builtUpArea}
                    onChange={(e) => setData({ ...data, builtUpArea: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-arch-accent outline-none placeholder-neutral-600"
                />
           </div>
           <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-arch-light">
                   <Layers className="w-4 h-4 mr-2" /> Number of Floors (Optional)
                </label>
                <input
                    type="number"
                    placeholder="e.g. 45"
                    value={data.floorCount}
                    onChange={(e) => setData({ ...data, floorCount: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-arch-accent outline-none placeholder-neutral-600"
                />
           </div>
        </div>

         <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-arch-light">
                <Palette className="w-4 h-4 mr-2" /> Preferred Materials (Optional)
            </label>
            <input
                type="text"
                placeholder="e.g. Cross-laminated timber, local sandstone, brushed bronze"
                value={data.preferredMaterials}
                onChange={(e) => setData({ ...data, preferredMaterials: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-arch-accent outline-none placeholder-neutral-600"
            />
        </div>

        {/* Vision Prompt */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-arch-light">The Micro Prompt (Vision)</label>
          <textarea
            rows={4}
            placeholder="Describe your vision: parametric shading, sustainable timber, heavy use of vertical gardens..."
            required
            value={data.prompt}
            onChange={(e) => setData({ ...data, prompt: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-arch-accent outline-none placeholder-neutral-600 resize-none"
          />
        </div>

        {/* Massing Model Upload (Optional) */}
        <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-arch-light mb-2">
              <Box className="w-4 h-4 mr-2" /> Geometry Base / Massing (Optional)
            </label>
            <p className="text-xs text-neutral-500 mb-3">
                Upload a SketchUp export or massing model. The AI will strictly preserve this geometry and apply materials to it.
            </p>

            {data.massingImage ? (
                <div className="relative w-48 aspect-video rounded-lg overflow-hidden border border-arch-accent shadow-lg group">
                    <img src={data.massingImage} alt="Massing Model" className="w-full h-full object-cover" />
                    <button
                        type="button"
                        onClick={removeMassingImage}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 transition-colors backdrop-blur-sm"
                    >
                        <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] uppercase text-center py-1">
                        Geometry Locked
                    </div>
                </div>
            ) : (
                 <div 
                    onClick={() => massingInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-neutral-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-arch-accent hover:bg-neutral-800/50 transition-all group"
                  >
                    <Upload className="w-6 h-6 text-neutral-600 group-hover:text-arch-accent mb-2" />
                    <span className="text-xs text-neutral-500 group-hover:text-neutral-300">Upload SketchUp View / Massing Model</span>
                  </div>
            )}
             <input 
                type="file" 
                ref={massingInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleMassingChange}
              />
        </div>

        {/* Inspiration Upload */}
        <div className="space-y-2">
           <label className="flex items-center text-sm font-medium text-arch-light mb-2">
              <ImageIcon className="w-4 h-4 mr-2" /> Inspiration Injection (Max 10)
            </label>
            
             {data.inspirationImages.length > 0 && (
                 <div className="mb-4 bg-neutral-900 p-4 rounded-lg border border-neutral-800">
                    <label className="flex items-center text-sm text-arch-light mb-2">
                        <Sliders className="w-4 h-4 mr-2" /> Mood Fidelity
                    </label>
                    <div className="flex items-center space-x-4">
                        <span className="text-xs text-neutral-500">Subtle</span>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={data.moodMatchIntensity} 
                            onChange={(e) => setData({...data, moodMatchIntensity: parseInt(e.target.value)})}
                            className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-arch-accent"
                        />
                        <span className="text-xs text-neutral-500">Exact Match</span>
                    </div>
                     <p className="text-[10px] text-neutral-500 mt-1 text-center">
                        {data.moodMatchIntensity < 33 ? 'Loose inspiration' : data.moodMatchIntensity < 66 ? 'Balanced influence' : 'Strict mood adherence'}
                    </p>
                 </div>
             )}
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
            {data.inspirationImages.map((img, idx) => (
              <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-neutral-700">
                <img src={img} alt={`Inspiration ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeInspirationImage(idx)}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 transition-colors backdrop-blur-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {data.inspirationImages.length < 10 && (
              <div 
                onClick={() => inspirationInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-neutral-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-arch-accent hover:bg-neutral-800/50 transition-all group"
              >
                <Plus className="w-8 h-8 text-neutral-600 group-hover:text-arch-accent mb-2" />
                <span className="text-xs text-neutral-500 group-hover:text-neutral-300">Add Image</span>
              </div>
            )}
          </div>
          
          <input 
            type="file" 
            ref={inspirationInputRef} 
            className="hidden" 
            accept="image/*"
            multiple
            onChange={handleInspirationChange}
          />
          <p className="text-xs text-neutral-500 text-right">{data.inspirationImages.length} / 10 images</p>
        </div>

        <button 
          type="submit"
          className="w-full bg-arch-light text-black font-bold py-4 rounded-lg hover:bg-white transition-all transform active:scale-[0.99] mt-4"
        >
          Initialize Design Engine
        </button>
      </form>
    </div>
  );
};

export default BriefingStep;