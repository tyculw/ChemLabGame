import React from 'react';
import type { Operation } from '../types';
import { Flame, Hammer, FlaskConical, Thermometer } from 'lucide-react';
import clsx from 'clsx';

interface ToolBarProps {
    selectedTool: Operation | null;
    onSelectTool: (tool: Operation | null) => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({ selectedTool, onSelectTool }) => {
    const tools: { id: Operation; icon: React.ReactNode; label: string }[] = [
        { id: 'mix', icon: <FlaskConical className="w-6 h-6" />, label: 'Mix' },
        { id: 'heat', icon: <Thermometer className="w-6 h-6" />, label: 'Heat' },
        { id: 'crush', icon: <Hammer className="w-6 h-6" />, label: 'Crush' },
        { id: 'ignite', icon: <Flame className="w-6 h-6" />, label: 'Ignite' },
        // { id: 'electrolyze', icon: <Zap className="w-6 h-6" />, label: 'Electrolyze' },
    ];

    return (
        <div className="h-20 bg-slate-900 border-b border-slate-700 flex items-center justify-center gap-4 px-4">
            {tools.map(tool => (
                <button
                    key={tool.id}
                    onClick={() => onSelectTool(selectedTool === tool.id ? null : tool.id)}
                    className={clsx(
                        "flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all",
                        selectedTool === tool.id
                            ? "bg-blue-600 text-white shadow-lg scale-105"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                    )}
                >
                    {tool.icon}
                    <span className="text-[10px] mt-1 font-medium">{tool.label}</span>
                </button>
            ))}
        </div>
    );
};
