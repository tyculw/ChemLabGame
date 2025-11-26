import React from 'react';
import type { Operation } from '../types';
import { Flame, Wind, Zap } from 'lucide-react';

interface OperationSelectionPageProps {
    selectedOperation: Operation | null;
    onSelectOperation: (op: Operation) => void;
    onStart: () => void;
    onBack: () => void;
}

export const OperationSelectionPage: React.FC<OperationSelectionPageProps> = ({
    selectedOperation,
    onSelectOperation,
    onStart,
    onBack,
}) => {
    const operations: { id: Operation; name: string; icon: React.ElementType; desc: string }[] = [
        { id: 'mix', name: '常温静置/混合', icon: Wind, desc: '将物质混合在一起，在常温下反应' },
        { id: 'heat', name: '高温加热', icon: Flame, desc: '使用酒精灯或喷灯进行高温加热' },
        { id: 'ignite', name: '点燃', icon: Flame, desc: '直接点燃物质，通常涉及氧气' },
        { id: 'electrolyze', name: '电解', icon: Zap, desc: '通电分解物质，常用于电解水或盐溶液' },
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full p-4 md:p-8 relative">
            <div className="absolute top-4 left-4">
                <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
                    &larr; 返回
                </button>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-slate-100 mb-8 md:mb-12">选择实验操作</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl w-full mb-8 md:mb-12">
                {operations.map(op => (
                    <button
                        key={op.id}
                        onClick={() => onSelectOperation(op.id)}
                        className={`flex items-center p-4 md:p-6 rounded-xl border-2 transition-all group text-left ${selectedOperation === op.id
                            ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20'
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                            }`}
                    >
                        <div className={`p-3 md:p-4 rounded-full mr-4 md:mr-6 ${selectedOperation === op.id ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600 group-hover:text-slate-200'
                            }`}>
                            <op.icon size={32} />
                        </div>
                        <div>
                            <h3 className={`text-lg md:text-xl font-bold mb-1 md:mb-2 ${selectedOperation === op.id ? 'text-blue-400' : 'text-slate-200'}`}>
                                {op.name}
                            </h3>
                            <p className="text-slate-400 text-xs md:text-sm">{op.desc}</p>
                        </div>
                    </button>
                ))}
            </div>

            <button
                onClick={onStart}
                disabled={!selectedOperation}
                className="px-10 md:px-12 py-3 md:py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-lg md:text-xl font-bold rounded-full shadow-lg transition-all animate-bounce-subtle"
            >
                开始实验
            </button>
        </div>
    );
};
