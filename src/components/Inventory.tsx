import React, { useMemo } from 'react';
import type { Substance } from '../types';

interface InventoryProps {
    onAddItem: (substanceId: string) => void;
    substances: Record<string, Substance>;
}

export const Inventory: React.FC<InventoryProps> = ({ onAddItem, substances }) => {
    const groupedSubstances = useMemo(() => {
        const groups: { [category: string]: Substance[] } = {};
        Object.values(substances).forEach(substance => {
            const category = substance.category || 'Uncategorized';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(substance);
        });
        return groups;
    }, [substances]);

    const sortedCategories = useMemo(() => {
        return Object.keys(groupedSubstances).sort();
    }, [groupedSubstances]);

    return (
        <div className="w-64 bg-slate-900 border-l border-slate-700 p-4 overflow-y-auto h-full">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Substances</h2>
            {sortedCategories.map(category => (
                <div key={category} className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-3 capitalize">{category}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {groupedSubstances[category].map(substance => (
                            <button
                                key={substance.id}
                                onClick={() => onAddItem(substance.id)}
                                className="flex flex-col items-center p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 hover:border-blue-500"
                                title={substance.description}
                            >
                                <div
                                    className="w-10 h-10 rounded-full mb-2 shadow-sm"
                                    style={{ backgroundColor: substance.color }}
                                />
                                <span className="text-xs font-medium text-slate-300 text-center">{substance.name}</span>
                                <span className="text-[10px] text-slate-500">{substance.formula}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
