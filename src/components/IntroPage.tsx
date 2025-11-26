import React from 'react';
import { Beaker, FlaskConical, Flame, ArrowRight } from 'lucide-react';

interface IntroPageProps {
    onNext: () => void;
}

export const IntroPage: React.FC<IntroPageProps> = ({ onNext }) => {
    return (
        <div className="flex flex-col items-center justify中心 h-full p-4 md:p-8 text-center space-y-6 md:space-y-8 animate-fade-in">
            <div className="space-y-4">
                <h1 className="text-3xl md:text-5xl font-bold text-blue-400 drop-shadow-lg">化学实验室</h1>
                <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto">
                    欢迎来到虚拟化学实验室！在这里，你可以自由探索各种化学物质的反应。
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 w-full max-w-4xl mt-6 md:mt-8">
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm hover:border-blue-500 transition-all group">
                    <div className="bg-blue-500/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FlaskConical className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-200 mb-2">1. 选择材料</h3>
                    <p className="text-slate-400">从丰富的化学库中选择你想要实验的物质，放入烧杯中。</p>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm hover:border-orange-500 transition-all group">
                    <div className="bg-orange-500/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Flame className="w-8 h-8 text-orange-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-200 mb-2">2. 选择操作</h3>
                    <p className="text-slate-400">选择加热、点燃、混合等操作方式，触发化学反应。</p>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 backdrop-blur-sm hover:border-green-500 transition-all group">
                    <div className="bg-green-500/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Beaker className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-200 mb-2">3. 观察结果</h3>
                    <p className="text-slate-400">观看反应动画，观察生成的新物质，学习化学知识。</p>
                </div>
            </div>

            <button
                onClick={onNext}
                className="mt-8 md:mt-12 px-6 md:px-8 py-3 md:py-4 bg-blue-600 hover:bg-blue-500 text-white text-lg md:text-xl font-bold rounded-full shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2 group"
            >
                开始实验
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
};
