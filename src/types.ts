export type SubstanceType = 'solid' | 'liquid' | 'gas' | 'powder';

export interface Substance {
    id: string;
    name: string;
    formula: string;
    color: string; // Hex code or CSS color
    type: SubstanceType;
    category?: string;
    description: string;
    texture?: string; // Optional texture path or css pattern
}

export type Operation = 'mix' | 'heat' | 'ignite' | 'electrolyze' | 'crush';

export type EffectType = 'combustion' | 'explosion' | 'bubbling' | 'color_change' | 'smoke' | 'sparks' | 'none';

export interface Reaction {
    inputs: string[]; // Array of Substance IDs
    operation: Operation;
    outputs: string[]; // Array of Substance IDs
    hasReaction?: boolean;
    effectType?: EffectType;
    requiresHeat?: boolean;
    visualEffect?: string; // e.g., "bubbles", "explosion", "steam"
    description?: string;
    safetyWarning?: string;
}

// AI生成的反应结果
export interface AIReactionResult {
    hasReaction: boolean;
    outputSubstances: Array<{
        name: string;
        formula: string;
        color: string;
        type: SubstanceType;
        description: string;
    }>;
    effectType: EffectType;
    description: string;
    chemicalEquation?: string;
    safetyWarning?: string;
}
export interface LogEntry {
    timestamp: string; // ISO string
    source: 'cache' | 'ai';
    inputs: string[];
    operation: string;
    outputs: string[];
    description: string;
}
