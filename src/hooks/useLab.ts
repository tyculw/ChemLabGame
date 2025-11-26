import { useState, useCallback, useEffect } from 'react';
import type { Substance, Operation } from '../types';
import { initializeData, getAllCompounds } from '../services/json-data-service';

export interface LabItem {
    id: string; // Unique instance ID
    substanceId: string;
    x: number;
    y: number;
}

export function useLab() {
    console.log('[useLab] Hook initializing');
    const [labItems, setLabItems] = useState<LabItem[]>([]);
    const [selectedTool, setSelectedTool] = useState<Operation | null>(null);
    const [substances, setSubstances] = useState<Record<string, Substance>>({});
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('[useLab] useEffect running');
        initializeData().then(async () => {
            console.log('[useLab] Data initialized, getting compounds');
            const loadedCompounds = await getAllCompounds();
            setSubstances(loadedCompounds);
            setIsReady(true);
            console.log('[useLab] Ready state set to true');
        }).catch(err => {
            console.error("[useLab] Failed to init data:", err);
            setError(err instanceof Error ? err.message : String(err));
        });
    }, []);

    const addSubstance = useCallback((substanceId: string, x: number, y: number) => {
        const newItem: LabItem = {
            id: crypto.randomUUID(),
            substanceId,
            x,
            y,
        };
        setLabItems(prev => [...prev, newItem]);
    }, []);

    const moveItem = useCallback((id: string, x: number, y: number) => {
        setLabItems(prev => prev.map(item =>
            item.id === id ? { ...item, x, y } : item
        ));
    }, []);

    const removeItem = useCallback((id: string) => {
        setLabItems(prev => prev.filter(item => item.id !== id));
    }, []);

    // Note: performOperation is kept for backward compatibility but reactions are now handled by AI
    const performOperation = useCallback((_targetItemIds: string[], _operation: Operation) => {
        console.log('[useLab] performOperation called - but reactions now handled by AI service');
        // This function is kept for interface compatibility but is no longer used
        // All reactions are now handled through the AI service in App.tsx
        return null;
    }, []);

    return {
        labItems,
        selectedTool,
        setSelectedTool,
        addSubstance,
        moveItem,
        removeItem,
        performOperation,
        substances,
        setSubstances,
        isReady,
        error
    };
}
