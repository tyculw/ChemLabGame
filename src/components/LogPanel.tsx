import React, { useState } from 'react';
import type { LogEntry } from '../types';

interface LogPanelProps {
    logEntries?: LogEntry[];
    placement?: 'right' | 'bottom';
}

export const LogPanel: React.FC<LogPanelProps> = ({ logEntries = [], placement = 'right' }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className={
                placement === 'right'
                    ? `fixed right-0 top-0 h-full bg-slate-900 border-l border-slate-700 transition-all duration-300 ease-in-out z-50 flex flex-col ${isOpen ? 'w-96' : 'w-12'}`
                    : `fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 transition-all duration-300 ease-in-out z-50 flex flex-col ${isOpen ? 'h-72' : 'h-12'}`
            }
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={
                    placement === 'right'
                        ? "absolute -left-8 top-1/2 -translate-y-1/2 bg-slate-800 p-2 rounded-l-md border-y border-l border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                        : "mx-auto mt-1 bg-slate-800 px-3 py-1 rounded-md border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                }
                title={isOpen ? "收起日志" : "展开日志"}
            >
                {placement === 'right' ? (isOpen ? '→' : '←') : (isOpen ? '▼' : '▲')}
            </button>

            <div className={`p-4 ${placement === 'right' ? 'border-b' : 'border-t'} border-slate-800 flex items-center justify-between ${!isOpen && 'hidden'}`}>
                <h2 className="font-bold text-slate-200">实验日志</h2>
                <span className="text-xs text-slate-500">{logEntries.length} 条记录</span>
            </div>

            {!isOpen && placement === 'right' && (
                <div className="h-full flex flex-col items-center py-4 gap-4">
                    <div className="writing-vertical-rl text-slate-500 text-sm tracking-widest uppercase">Logs</div>
                    <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                </div>
            )}
            {!isOpen && placement === 'bottom' && (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Logs</div>
            )}

            {isOpen && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 safe-area-bottom">
                    {logEntries.length === 0 ? (
                        <div className="text-center text-slate-500 py-8 text-sm">
                            暂无实验记录
                        </div>
                    ) : (
                        logEntries.map((entry, index) => (
                            <div key={index} className="bg-slate-800 rounded-lg p-3 text-sm border border-slate-700 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs text-slate-500 font-mono">
                                        {new Date(entry.timestamp).toLocaleTimeString()}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${entry.source === 'cache'
                                            ? 'bg-green-900/50 text-green-400 border border-green-800'
                                            : 'bg-blue-900/50 text-blue-400 border border-blue-800'
                                        }`}>
                                        {entry.source === 'cache' ? 'CACHE' : 'AI'}
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 text-xs">输入:</span>
                                        <span className="text-slate-300 truncate" title={entry.inputs.join(', ')}>
                                            {entry.inputs.join(', ')}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 text-xs">操作:</span>
                                        <span className="text-slate-300">{entry.operation}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 text-xs">输出:</span>
                                        <span className="text-slate-300 truncate" title={entry.outputs.join(', ')}>
                                            {entry.outputs.length > 0 ? entry.outputs.join(', ') : '无生成物'}
                                        </span>
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-slate-700/50 text-slate-400 italic text-xs">
                                        "{entry.description}"
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default LogPanel;
