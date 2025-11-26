import React, { useEffect, useState, useRef } from 'react';
import type { Substance, AIReactionResult } from '../types';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { effectSystem } from '../services/effects-system';

interface ResultPageProps {
    reaction: AIReactionResult | null;
    inputSubstances: Substance[];
    isAnalyzing: boolean;
    onRestart: () => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({
    reaction,
    inputSubstances,
    isAnalyzing,
    onRestart,
}) => {
    const [stage, setStage] = useState<'animating' | 'result'>('animating');
    const effectContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!reaction || isAnalyzing) {
            setStage('animating');
            return;
        }

        // 播放特效
        let cleanup: (() => void) | null = null;

        const playEffectTimer = setTimeout(() => {
            if (effectContainerRef.current && reaction.effectType && reaction.effectType !== 'none') {
                console.log('[ResultPage] Playing effect:', reaction.effectType);
                cleanup = effectSystem.playEffect(reaction.effectType, effectContainerRef.current);
            }
        }, 500);

        // 3秒后显示结果
        const resultTimer = setTimeout(() => {
            setStage('result');
        }, 3000);

        return () => {
            clearTimeout(playEffectTimer);
            clearTimeout(resultTimer);
            if (cleanup) cleanup();
        };
    }, [reaction, isAnalyzing]);

    // 分析中或动画阶段
    if (isAnalyzing || stage === 'animating') {
        return (
            <div className="flex flex-col items-center justify-center h-full relative p-4 md:p-0" ref={effectContainerRef}>
                <div className="relative w-64 h-64 flex items-center justify-center z-10">
                    <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 border-4 border-blue-500/50 rounded-full animate-pulse"></div>
                    <div className="text-6xl animate-bounce">⚗️</div>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-blue-400 mt-6 md:mt-8 animate-pulse z-10">
                    {isAnalyzing ? '正在分析反应...' : '正在反应中...'}
                </h2>
                <p className="text-slate-400 mt-1 md:mt-2 z-10 text-sm md:text-base">请耐心等待化学变化发生</p>
            </div>
        );
    }

    // 没有反应结果
    if (!reaction) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="bg-red-500/20 p-6 rounded-full mb-6">
                    <XCircle size={64} className="text-red-400" />
                </div>
                <h2 className="text-4xl font-bold text-red-400 mb-4">分析失败</h2>
                <p className="text-xl text-slate-500 mb-8">无法获取反应结果</p>

                <button
                    onClick={onRestart}
                    className="mt-4 px-8 py-3 bg-slate-700 hover:bg-blue-600 text-white text-lg font-bold rounded-full shadow-lg transition-all flex items-center gap-2"
                >
                    <RefreshCw size={20} />
                    重新开始
                </button>
            </div>
        );
    }

    return (
            <div className="flex flex-col items-center justify-center h-full p-4 md:p-8 animate-fade-in overflow-y-auto">
            {reaction.hasReaction ? (
                <>
                    <div className="bg-green-500/20 p-6 rounded-full mb-6 animate-bounce-subtle">
                        <CheckCircle size={64} className="text-green-400" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-green-400 mb-4">反应成功！</h2>
                    <p className="text-base md:text-xl text-slate-300 mb-2 text-center max-w-2xl">{reaction.description}</p>
                    {reaction.chemicalEquation && (
                        <div className="bg-slate-800/80 px-6 py-3 rounded-lg border border-slate-600 my-4 shadow-inner">
                            <code className="text-base md:text-xl font-mono text-blue-300 tracking-wide">
                                {reaction.chemicalEquation}
                            </code>
                        </div>
                    )}

                    {reaction.safetyWarning && (
                        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6 max-w-2xl">
                            <p className="text-yellow-300 text-xs md:text-sm">
                                ⚠️ 安全提示: {reaction.safetyWarning}
                            </p>
                        </div>
                    )}

                    <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700 backdrop-blur-sm max-w-2xl w-full mt-4">
                        <h3 className="text-lg font-semibold text-slate-400 mb-6 text-center">生成物质</h3>
                        <div className="flex justify-center gap-8 flex-wrap">
                            {reaction.outputSubstances.map((sub, idx) => (
                                <div key={idx} className="flex flex-col items-center animate-scale-in" style={{ animationDelay: `${idx * 200}ms` }}>
                                    <div
                                        className="w-20 h-20 md:w-24 md:h-24 rounded-full mb-3 md:mb-4 shadow-lg border-4 border-slate-600"
                                        style={{ backgroundColor: sub.color }}
                                    />
                                    <div className="text-lg md:text-xl font-bold text-slate-100">{sub.name}</div>
                                    <div className="text-sm md:text-md text-slate-400">{sub.formula}</div>
                                    <div className="text-[10px] md:text-xs text-slate-500 mt-1 text-center max-w-[150px]">{sub.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="bg-slate-700/50 p-6 rounded-full mb-6">
                        <XCircle size={64} className="text-slate-400" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-400 mb-4">无明显反应</h2>
                    <p className="text-base md:text-xl text-slate-500 mb-2 text-center max-w-2xl">{reaction.description}</p>
                    {reaction.chemicalEquation && (
                        <div className="bg-slate-800/80 px-6 py-3 rounded-lg border border-slate-600 my-4 shadow-inner">
                            <code className="text-base md:text-xl font-mono text-blue-300 tracking-wide">
                                {reaction.chemicalEquation}
                            </code>
                        </div>
                    )}

                    {reaction.safetyWarning && (
                        <div className="bg黄色-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6 max-w-2xl">
                            <p className="text-yellow-300 text-xs md:text-sm">
                                ⚠️ 安全提示: {reaction.safetyWarning}
                            </p>
                        </div>
                    )}

                    <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700 backdrop-blur-sm max-w-2xl w-full mt-8 opacity-50">
                        <h3 className="text-lg font-semibold text-slate-400 mb-6 text-center">剩余物质</h3>
                        <div className="flex justify-center gap-8 flex-wrap">
                            {inputSubstances.map((sub, idx) => (
                                <div key={idx} className="flex flex-col items-center">
                                    <div
                                        className="w-14 h-14 md:w-16 md:h-16 rounded-full mb-2 shadow-sm grayscale"
                                        style={{ backgroundColor: sub.color }}
                                    />
                                    <div className="text-xs md:text-sm font-medium text-slate-300">{sub.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <button
                onClick={onRestart}
                className="mt-8 md:mt-12 px-6 md:px-8 py-2 md:py-3 bg-slate-700 hover:bg-blue-600 text-white text-base md:text-lg font-bold rounded-full shadow-lg transition-all flex items-center gap-2"
            >
                <RefreshCw size={20} />
                重新开始
            </button>
        </div>
    );
};
