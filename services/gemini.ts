
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { BriefingData, ResearchData, GeneratedOption } from "../types";

// Always use the required initialization pattern with process.env.API_KEY.
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
};

// --- Research Phase ---

export const performContextResearch = async (data: BriefingData): Promise<ResearchData> => {
  const ai = getAI();
  
  const prompt = `
    Act as a senior architectural researcher. 
    Analyze the following project brief:
    - Typology: ${data.typology}
    - Location: ${data.location}
    - Specific Context: ${data.contextDetails}
    - User Vision: ${data.prompt}

    Provide a JSON response with:
    1. A short executive summary of the architectural approach suitable for this region.
    2. A list of 3-5 local materials typically used in high-end architecture here.
    3. A description of the natural lighting conditions (sun path, intensity) for this location.
    4. A note on the local vernacular style or zoning constraints.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            materials: { type: Type.ARRAY, items: { type: Type.STRING } },
            lighting: { type: Type.STRING },
            vernacular: { type: Type.STRING },
          },
          required: ["summary", "materials", "lighting", "vernacular"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from research API");
    return JSON.parse(text) as ResearchData;
  } catch (error) {
    console.error("Research API Error:", error);
    return {
      summary: "Could not generate research. Using default context parameters.",
      materials: ["Local Stone", "Glass", "Timber"],
      lighting: "Standard daylight conditions.",
      vernacular: "Modern contemporary adapted to local climate.",
    };
  }
};

// --- Proposal Phase ---

export const generateArchitecturalConcepts = async (
  brief: BriefingData,
  research: ResearchData
): Promise<GeneratedOption[]> => {
  const ai = getAI();
  
  const allMaterials = [...research.materials];
  if (brief.preferredMaterials) {
      allMaterials.unshift(brief.preferredMaterials); 
  }

  const generateOne = async (
    type: 'LITERAL' | 'INSPIRED' | 'WILDCARD',
    title: string,
    description: string,
    specificPrompt: string
  ): Promise<GeneratedOption> => {
    
    // STRICT GEOMETRY LOGIC
    let geometryInstruction = "";
    if (brief.massingImage) {
        geometryInstruction = `
        CRITICAL INSTRUCTION: STICT GEOMETRY PRESERVATION.
        The first image provided is a MASSING MODEL. 
        You must 100% ADHERE to the perspective, lines, volume, and foms of this image. 
        Do not add new wings, do not change the height, do not change the camera angle.
        Your task is purely TEXTURING and RENDERING the existing geometry provided.
        Treat this like a material overlay only.
        `;
        
        if (type === 'LITERAL') {
            geometryInstruction += " DO NOT ALTER THE FORM AT ALL.";
        } else {
            geometryInstruction += " Maintain the main volume strictly, but you may add minor surface articulation (windows, facade depth) within the existing bounds.";
        }
    }

    let fullPrompt = `
      Architectural Visualization, Photorealistic, 8k resolution, Masterpiece.
      Project: ${brief.typology} in ${brief.location}.
      Site Specifics: ${brief.contextDetails}.
      
      ${geometryInstruction}

      CORE REQUIREMENTS:
      - Materials: ${allMaterials.join(', ')}.
      - Lighting: ${research.lighting}.
      - Vernacular Reference: ${research.vernacular}.
      - User Vision: ${brief.prompt}
      
      Design Direction: ${specificPrompt}.
      
      Technical constraints:
      ${brief.builtUpArea ? `- Built-up Area: ${brief.builtUpArea}` : ''}
      ${brief.floorCount ? `- Number of Floors: ${brief.floorCount}` : ''}
      
      No text, no watermarks, realistic scale.
    `;

    try {
      const imageParts: any[] = [];

      // 1. Add Massing Image (Must be first for strict adherence)
      if (brief.massingImage) {
        const matches = brief.massingImage.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            imageParts.push({
                inlineData: { mimeType: matches[1], data: matches[2] }
            });
        }
      }

      // 2. Add Inspiration Images
      if (brief.inspirationImages && brief.inspirationImages.length > 0) {
        const shouldIncludeInspiration = type === 'INSPIRED' || brief.massingImage || (brief.moodMatchIntensity && brief.moodMatchIntensity > 50);

        if (shouldIncludeInspiration) {
            const inspParts = brief.inspirationImages.map(img => {
                const matches = img.match(/^data:(.+);base64,(.+)$/);
                if (matches) {
                    return {
                        inlineData: { mimeType: matches[1], data: matches[2] }
                    };
                }
                return null;
            }).filter(part => part !== null);
            
            if (inspParts.length > 0) {
                 imageParts.push(...inspParts);
                 // Append mood instruction to prompt
                 fullPrompt += " Use the additional provided images as strict reference for mood, lighting and material palette.";
            }
        }
      }

      const contents = {
        parts: [
            ...imageParts, // Massing is first
            { text: fullPrompt }
        ]
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: contents,
        config: {
            imageConfig: {
                aspectRatio: "16:9" 
            }
        }
      });

      let imageUrl = '';
      if (response.candidates && response.candidates[0].content.parts) {
          // Find the image part as recommended.
          for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                  imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              }
          }
      }

      return {
        id: crypto.randomUUID(),
        title,
        description,
        imageUrl,
        type
      };

    } catch (e) {
      console.error(`Error generating ${type} option:`, e);
      return {
        id: crypto.randomUUID(),
        title,
        description,
        imageUrl: '',
        type
      };
    }
  };

  // Adjust prompts if massing is present
  const wildcardDesc = brief.massingImage 
    ? 'Bold material application on the provided form.' 
    : 'A bold risk taking the local vernacular to an extreme avant-garde direction.';
    
  const wildcardPrompt = brief.massingImage
    ? `Keep the massing form strict, but apply unexpected, avant-garde materials and dramatic lighting inspired by ${brief.location} future aesthetics.`
    : `Ignore strict user style constraints. Focus purely on ${brief.location} cultural and climate identity merged with futuristic ${brief.typology} design.`;

  const promiseA = generateOne(
    'LITERAL', 
    'The Direct Vision', 
    brief.massingImage ? 'Exact replication of your massing model with requested materials.' : 'A literal interpretation of your specific prompt requirements.',
    brief.prompt
  );

  const promiseB = generateOne(
    'INSPIRED', 
    'The Muse', 
    brief.massingImage 
        ? 'Your massing model draped in the materials of your inspiration images.'
        : 'Heavily influenced by the mood and structure of your inspiration input.',
    `Ensure the aesthetic matches the uploaded inspiration while fitting the ${brief.typology} function.`
  );

  const promiseC = generateOne(
    'WILDCARD', 
    'The Local Evo', 
    wildcardDesc,
    wildcardPrompt
  );

  const results = await Promise.all([promiseA, promiseB, promiseC]);
  return results.filter(r => r.imageUrl !== '');
};

export const generateHybridConcepts = async (
    brief: BriefingData,
    research: ResearchData,
    options: GeneratedOption[],
    userGuidance: string
): Promise<GeneratedOption[]> => {
    const ai = getAI();
    
    const generateVariant = async (variantName: string, emphasis: string): Promise<GeneratedOption> => {
        const optionDescriptions = options.map(o => `${o.title} (${o.type}): ${o.description}`).join('\n');
        
        let geometryInstruction = "";
        if (brief.massingImage) {
            geometryInstruction = "CRITICAL: You must 100% ADHERE to the original massing geometry provided in the initial briefing. Do not alter the form, only blend the styles.";
        }

        const prompt = `
            Act as a Master Architect.
            Task: Create a HYBRID architectural design blending previous concepts.
            
            Location: ${brief.location}.
            Typology: ${brief.typology}.
            User Context: ${brief.contextDetails}.
            
            Previous Concepts Used:
            ${optionDescriptions}
            
            User's Specific Mix Instruction: "${userGuidance}"
            
            VARIANT DIRECTION: ${emphasis}
            
            ${geometryInstruction}
            
            Output: A single high-fidelity, photorealistic architectural rendering.
        `;

        const imageParts: any[] = options.map(opt => {
             const matches = opt.imageUrl.match(/^data:(.+);base64,(.+)$/);
             if (matches) {
                return { inlineData: { mimeType: matches[1], data: matches[2] } };
            }
            return null;
        }).filter(p => p !== null);

        // Include original massing if available for reinforcement
        if (brief.massingImage) {
            const matches = brief.massingImage.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
                imageParts.unshift({ inlineData: { mimeType: matches[1], data: matches[2] } });
            }
        }

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-image",
                contents: {
                    parts: [ ...imageParts, { text: prompt } ]
                },
                config: { imageConfig: { aspectRatio: "16:9" } }
            });

            let imageUrl = '';
            if (response.candidates && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }

            return {
                id: crypto.randomUUID(),
                title: `Hybrid: ${variantName}`,
                description: `${emphasis} based on: "${userGuidance}"`,
                imageUrl,
                type: 'HYBRID'
            };
        } catch (e) {
            console.error("Hybrid Gen Error", e);
            throw e;
        }
    };

    const promise1 = generateVariant("Balanced Synthesis", "Create a perfectly balanced mix of the input designs, harmonizing their best features.");
    const promise2 = generateVariant("Bold Interpretation", "Take the most dramatic elements from the inputs and amplify them. Focus on material contrast.");
    const promise3 = generateVariant("Subtle Integration", "Create a refined, understated version. Blend the concepts seamlessly with a focus on elegance and the prompt instructions.");

    const results = await Promise.all([promise1, promise2, promise3]);
    return results.filter(r => r.imageUrl !== '');
};

export const refineArchitecturalImage = async (
  currentImage: string,
  userInstruction: string,
  brief: BriefingData
): Promise<string> => {
  const ai = getAI();
  
  let geometryInstruction = "";
  if (brief.massingImage) {
      geometryInstruction = "CRITICAL: You must 100% ADHERE to the visual geometry of the input image. Do not change the camera, the volume, or the structure.";
  }

  const prompt = `
    Act as an architectural design assistant.
    Task: Redesign the architecture in the provided image based on the user's specific edit request.
    
    User Edit Request: "${userInstruction}"
    
    CRITICAL CONTEXT:
    - Project Location: ${brief.location}
    - Typology: ${brief.typology}
    - Ensure the building looks physically constructed in ${brief.location}.
    ${geometryInstruction}
    
    Output: High-quality photorealistic architectural visualization.
  `;

  try {
      const parts: any[] = [];
      
      const matches = currentImage.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
          parts.push({
              inlineData: {
                  mimeType: matches[1],
                  data: matches[2] 
              }
          });
      } else {
          throw new Error("Invalid image data format");
      }

      if (brief.inspirationImages && brief.inspirationImages.length > 0) {
          brief.inspirationImages.slice(0, 2).forEach(img => {
              const inspMatches = img.match(/^data:(.+);base64,(.+)$/);
              if (inspMatches) {
                  parts.push({
                      inlineData: { mimeType: inspMatches[1], data: inspMatches[2] }
                  });
              }
          });
      }

      parts.push({ text: prompt });

     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    let imageUrl = '';
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return imageUrl;

  } catch (error) {
    console.error("Refinement Error:", error);
    throw error;
  }
};

export const generateMultiAngleViews = async (
    baseImage: string,
    brief: BriefingData
): Promise<string[]> => {
    const ai = getAI();
    
    const generateAngle = async (angleName: string): Promise<string> => {
        const prompt = `
            Act as an architectural photographer.
            Task: Generate a new view of the EXACT SAME building shown in the reference image.
            
            View Angle: ${angleName}.
            
            Constraints:
            - Maintain the exact same architectural style, materials, and geometry.
            - Location: ${brief.location}.
            - Lighting must match the reference.
            
            Output: Photorealistic render.
        `;

        const parts: any[] = [];
        
        const matches = baseImage.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
            parts.push({
                inlineData: {
                    mimeType: matches[1],
                    data: matches[2] 
                }
            });
        }
        parts.push({ text: prompt });

        try {
             const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-image",
                contents: { parts },
                config: { imageConfig: { aspectRatio: "16:9" } }
            });
            
             if (response.candidates && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
            return '';
        } catch (e) {
            console.error("Angle Gen Error", e);
            return '';
        }
    };

    const angles = await Promise.all([
        generateAngle("Eye-level street view, emphasizing the entrance"),
        generateAngle("Aerial bird's eye view, showing context integration"),
        generateAngle("Close-up detail shot of the facade materials and texture")
    ]);

    return angles.filter(a => a !== '');
};
