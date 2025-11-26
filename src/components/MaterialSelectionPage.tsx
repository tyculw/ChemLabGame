import React, { useMemo } from 'react';
import type { Substance } from '../types';
import { X, Hammer, Eye } from 'lucide-react';

interface MaterialSelectionPageProps {
    substances: Record<string, Substance>;
    selectedMaterials: { substanceId: string; preProcess: 'none' | 'crush' | 'heat' }[];
    onSelectMaterial: (substanceId: string) => void;
    onRemoveMaterial: (index: number) => void;
    onUpdatePreProcess: (index: number, preProcess: 'none' | 'crush' | 'heat') => void;
    onPreviewMaterial: (substanceId: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export const MaterialSelectionPage: React.FC<MaterialSelectionPageProps> = ({
    substances,
    selectedMaterials,
    onSelectMaterial,
    onRemoveMaterial,
    onUpdatePreProcess,
    onPreviewMaterial,
    onNext,
    onBack,
}) => {
    const groupedSubstances = useMemo(() => {
        const groups: { [category: string]: Substance[] } = {};
        Object.values(substances).forEach(substance => {
            const category = substance.category || '未分类';
            if (!groups[category]) groups[category] = [];
            groups[category].push(substance);
        });
        return groups;
    }, [substances]);

    const sortedCategories = Object.keys(groupedSubstances).sort();

    return (
        <div className="flex h-full flex-col md:flex-row">
            {/* Left: Inventory */}
            <div className="w-full md:w-1/3 bg-slate-900/80 border-r md:border-r border-slate-700 p-4 overflow-y-auto backdrop-blur-sm">
                <h2 className="text-xl font-bold text-slate-100 mb-4">材料库</h2>
                {sortedCategories.map(category => (
                    <div key={category} className="mb-6">
                        <h3 className="text-md font-semibold text-blue-400 mb-3 border-b border-slate-700 pb-1">{category}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                            {groupedSubstances[category].map(substance => (
                                <button
                                    key={substance.id}
                                    onClick={() => onSelectMaterial(substance.id)}
                                    disabled={selectedMaterials.length >= 4}
                                    className="flex items-center p-2 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left group"
                                >
                                    <div
                                        className="w-8 h-8 rounded-full mr-3 shadow-sm flex-shrink-0"
                                        style={{ backgroundColor: substance.color }}
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-slate-200 group-hover:text-white">{substance.name}</div>
                                        <div className="text-[10px] text-slate-500">{substance.formula}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Right: Beaker/Selection Area */}
            <div className="w-full md:w-2/3 p-4 md:p-8 flex flex-col items-center justify-between relative">
                <div className="absolute top-4 left-4">
                    <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
                        &larr; 返回
                    </button>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-slate-100 mb-6 md:mb-8">选择反应材料 (最多4种)</h2>

                <div className="flex gap-4 md:gap-6 mb-8 md:mb-12 flex-wrap justify-center">
                    {[0, 1, 2, 3].map(index => {
                        const selection = selectedMaterials[index];
                        const substance = selection ? substances[selection.substanceId] : null;

                        return (
                            <div key={index} className="w-32 h-48 md:w-48 md:h-64 bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center relative group hover:border-slate-500 transition-all">
                                {substance ? (
                                    <>
                                        <button
                                            onClick={() => onRemoveMaterial(index)}
                                            className="absolute top-2 right-2 p-1 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                                        >
                                            <X size={16} />
                                        </button>

                                        <div
                                            className="w-16 h-16 md:w-20 md:h-20 rounded-full mb-3 md:mb-4 shadow-lg"
                                            style={{ backgroundColor: substance.color }}
                                        />
                                        <div className="text-base md:text-lg font-bold text-slate-100">{substance.name}</div>
                                        <div className="text-xs md:text-sm text-slate-400 mb-3 md:mb-4">{substance.formula}</div>

                                        {/* Pre-processing Options */}
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => onUpdatePreProcess(index, selection.preProcess === 'crush' ? 'none' : 'crush')}
                                                className={`p-2 rounded-lg transition-colors ${selection.preProcess === 'crush' ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                                title="粉碎"
                                            >
                                                <Hammer size={16} />
                                            </button>
                                            <button
                                                onClick={() => onPreviewMaterial(selection.substanceId)}
                                                className="p-2 rounded-lg transition-colors bg-slate-700 text-slate-400 hover:bg-slate-600"
                                                title="预览三维结构"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                        <div className="text-[10px] md:text-xs text-slate-500 mt-1">
                                            {selection.preProcess === 'crush' ? '已粉碎' : '无预处理'}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-slate-600 font-medium">空槽位</div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={onNext}
                    disabled={selectedMaterials.length === 0}
                    className="px-10 md:px-12 py-3 md:py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-lg md:text-xl font-bold rounded-full shadow-lg transition-all"
                >
                    下一步：选择操作
                </button>
            </div>
        </div>
    );
};
