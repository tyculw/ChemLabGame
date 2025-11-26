// src/services/json-data-service.ts
import type { Substance, AIReactionResult, EffectType } from '../types';

// LocalStorage keys
const STORAGE_KEYS = {
    USER_COMPOUNDS: 'chemlab_user_compounds',
    AI_REACTIONS: 'chemlab_ai_reactions',
};

// Cache for loaded data
let compoundsCache: Record<string, Substance> | null = null;
let reactionsCache: StoredReaction[] | null = null;

export interface StoredReaction {
    id: string;
    inputs: string[]; // Array of compound names (Chinese)
    operation: string; // Chinese operation name
    outputs: AIReactionResult['outputSubstances'];
    effectType: EffectType;
    description: string;
    chemicalEquation?: string;
    safetyWarning?: string;
    timestamp: string;
}

/**
 * Initialize data by loading from JSON files and localStorage
 */
export async function initializeData(): Promise<void> {
    if (compoundsCache && reactionsCache) {
        console.log('[JSON Service] Data already initialized');
        return;
    }

    console.log('[JSON Service] Initializing data...');

    // Load static compounds from JSON file
    const compoundsResponse = await fetch('/data/compounds.json');
    const staticCompounds: Record<string, Substance> = await compoundsResponse.json();

    // Load user-added compounds from localStorage
    const userCompoundsJson = localStorage.getItem(STORAGE_KEYS.USER_COMPOUNDS);
    const userCompounds: Record<string, Substance> = userCompoundsJson
        ? JSON.parse(userCompoundsJson)
        : {};

    // Merge compounds
    compoundsCache = { ...staticCompounds, ...userCompounds };

    // Load AI reactions from localStorage
    const reactionsJson = localStorage.getItem(STORAGE_KEYS.AI_REACTIONS);
    reactionsCache = reactionsJson ? JSON.parse(reactionsJson) : [];

    console.log('[JSON Service] Loaded:', {
        staticCompounds: Object.keys(staticCompounds).length,
        userCompounds: Object.keys(userCompounds).length,
        reactions: reactionsCache!.length,
    });
}

/**
 * Get all compounds (static + user-added)
 */
export async function getAllCompounds(): Promise<Record<string, Substance>> {
    if (!compoundsCache) {
        await initializeData();
    }
    // After initialization, compoundsCache is guaranteed to be non-null
    return { ...compoundsCache! };
}

/**
 * Add a new compound to user storage
 */
export async function addCompound(compound: Substance): Promise<void> {
    if (!compoundsCache) {
        await initializeData();
    }

    // Check if already exists
    if (compoundsCache![compound.id]) {
        console.log('[JSON Service] Compound already exists:', compound.id);
        return;
    }

    // Add to cache
    compoundsCache![compound.id] = compound;

    // Update localStorage
    const userCompoundsJson = localStorage.getItem(STORAGE_KEYS.USER_COMPOUNDS);
    const userCompounds: Record<string, Substance> = userCompoundsJson
        ? JSON.parse(userCompoundsJson)
        : {};

    userCompounds[compound.id] = compound;
    localStorage.setItem(STORAGE_KEYS.USER_COMPOUNDS, JSON.stringify(userCompounds));

    console.log('[JSON Service] Added new compound:', compound.name);
}

/**
 * Find a cached reaction by inputs and operation
 */
export async function findReactionInCache(
    inputNames: string[], // Array of Chinese compound names
    operation: string // Chinese operation name
): Promise<AIReactionResult | null> {
    if (!reactionsCache) {
        await initializeData();
    }

    const sortedInputs = [...inputNames].sort().join('|');
    const reaction = reactionsCache!.find(r => {
        const sortedReactionInputs = [...r.inputs].sort().join('|');
        return sortedReactionInputs === sortedInputs && r.operation === operation;
    });

    if (!reaction) {
        return null;
    }

    // Convert StoredReaction to AIReactionResult
    return {
        hasReaction: true,
        outputSubstances: reaction.outputs,
        effectType: reaction.effectType,
        description: reaction.description,
        chemicalEquation: reaction.chemicalEquation,
        safetyWarning: reaction.safetyWarning,
    };
}

/**
 * Save a reaction to cache
 */
export async function saveReactionToCache(
    result: AIReactionResult,
    operation: string, // Chinese operation name
    inputNames: string[] // Array of Chinese compound names
): Promise<void> {
    if (!reactionsCache) {
        await initializeData();
    }

    const reaction: StoredReaction = {
        id: `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        inputs: inputNames,
        operation,
        outputs: result.outputSubstances,
        effectType: result.effectType,
        description: result.description,
        chemicalEquation: result.chemicalEquation,
        safetyWarning: result.safetyWarning,
        timestamp: new Date().toISOString(),
    };

    reactionsCache!.push(reaction);
    localStorage.setItem(STORAGE_KEYS.AI_REACTIONS, JSON.stringify(reactionsCache));

    console.log('[JSON Service] Saved reaction to cache:', {
        inputs: inputNames,
        operation,
        outputs: result.outputSubstances.map(s => s.name),
    });
}

/**
 * Export all data (for user backup)
 */
export async function exportData(): Promise<string> {
    if (!compoundsCache || !reactionsCache) {
        await initializeData();
    }

    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        compounds: compoundsCache,
        reactions: reactionsCache,
    };

    return JSON.stringify(exportData, null, 2);
}

/**
 * Import data (restore from backup)
 */
export async function importData(jsonString: string): Promise<void> {
    try {
        const data = JSON.parse(jsonString);

        if (!data.compounds || !data.reactions) {
            throw new Error('Invalid data format');
        }

        // Extract user compounds (exclude static ones)
        const staticResponse = await fetch('/data/compounds.json');
        const staticCompounds: Record<string, Substance> = await staticResponse.json();

        const userCompounds: Record<string, Substance> = {};
        for (const [id, compound] of Object.entries(data.compounds)) {
            if (!staticCompounds[id]) {
                userCompounds[id] = compound as Substance;
            }
        }

        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.USER_COMPOUNDS, JSON.stringify(userCompounds));
        localStorage.setItem(STORAGE_KEYS.AI_REACTIONS, JSON.stringify(data.reactions));

        // Clear cache to force reload
        compoundsCache = null;
        reactionsCache = null;

        console.log('[JSON Service] Data imported successfully');
    } catch (error) {
        console.error('[JSON Service] Failed to import data:', error);
        throw error;
    }
}

/**
 * Clear all user data (reset to defaults)
 */
export function clearUserData(): void {
    localStorage.removeItem(STORAGE_KEYS.USER_COMPOUNDS);
    localStorage.removeItem(STORAGE_KEYS.AI_REACTIONS);
    compoundsCache = null;
    reactionsCache = null;
    console.log('[JSON Service] User data cleared');
}
