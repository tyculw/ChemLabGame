import type { Substance, Operation, AIReactionResult } from '../types';
import { findReactionInCache, saveReactionToCache } from './json-data-service';

const API_KEY = import.meta.env.VITE_AI_API_KEY || 'lm-sk-gvirepishumttbsbpvhtozfzufiwudyczhdspjfjtkvbftje';
const MODEL = import.meta.env.VITE_AI_MODEL || 'Qwen/Qwen3-Next-80B-A3B-Instruct';
const API_URL = import.meta.env.VITE_AI_API_URL || 'https://api.siliconflow.cn/v1/chat/completions';

/**
 * 构建化学反应分析的提示词
 */
export const OPERATION_MAP: Record<Operation, string> = {
    mix: '常温下混合',
    heat: '加热',
    ignite: '点燃',
    electrolyze: '电解',
    crush: '研磨'
};

/**
 * 构建化学反应分析的提示词
 */
function buildPrompt(substances: Substance[], operation: Operation): string {
    const substanceInfo = substances.map(s =>
        `${s.name} (${s.formula}) - ${s.type}, ${s.description}`
    ).join('\n');

    return `你是一位化学专家。请分析以下化学实验并判断是否会发生反应。

**参与反应的物质：**
${substanceInfo}

**操作方式：** ${OPERATION_MAP[operation]}

请按照以下JSON格式严格返回结果（不要添加任何markdown格式或额外文字）：

{
  "hasReaction": true或false,
  "outputSubstances": [
    {
      "name": "生成物中文名",
      "formula": "化学式",
      "color": "#颜色代码",
      "type": "solid/liquid/gas/powder之一",
      "description": "简短描述"
    }
  ],
  "effectType": "combustion/explosion/bubbling/color_change/smoke/sparks/none之一",
  "description": "反应过程的中文描述（1-2句话）",
  "chemicalEquation": "化学方程式（如 2H2 + O2 = 2H2O），无反应则省略",
  "safetyWarning": "如有危险请说明，否则省略此字段"
}

**重要说明：**
- 如果没有反应，hasReaction为false，outputSubstances为空数组，effectType为"none"
- effectType含义：combustion=燃烧，explosion=爆炸，bubbling=冒泡，color_change=变色，smoke=冒烟，sparks=火花，none=无特效
- 颜色代码使用十六进制格式如 #FF0000
- 只返回JSON，不要任何其他文字`;
}

/**
 * 解析AI返回的JSON结果
 */
function parseAIResponse(responseText: string): AIReactionResult {
    try {
        // 移除可能的markdown代码块标记
        let cleanText = responseText.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/```json\n?/, '').replace(/\n?```$/, '');
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/```\n?/, '').replace(/\n?```$/, '');
        }

        const result = JSON.parse(cleanText);

        // 验证必需字段
        if (typeof result.hasReaction !== 'boolean') {
            throw new Error('Invalid response: missing hasReaction');
        }

        return {
            hasReaction: result.hasReaction,
            outputSubstances: result.outputSubstances || [],
            effectType: result.effectType || 'none',
            description: result.description || '未知反应',
            chemicalEquation: result.chemicalEquation,
            safetyWarning: result.safetyWarning
        };
    } catch (error) {
        console.error('Failed to parse AI response:', error, '\nResponse:', responseText);
        // 返回默认的"无反应"结果
        return {
            hasReaction: false,
            outputSubstances: [],
            effectType: 'none',
            description: '无法分析反应结果',
        };
    }
}

/**
 * 调用Gemini API分析化学反应
 */
export async function analyzeChemicalReaction(
    substances: Substance[],
    operation: Operation
): Promise<AIReactionResult> {
    console.log('[AI] Analyzing reaction:', substances.map(s => s.name), 'with operation:', operation);

    // Local API doesn't strictly require a key, but we check for config
    if (!API_URL) {
        console.warn('[AI] No API URL configured');
        return {
            hasReaction: false,
            outputSubstances: [],
            effectType: 'none',
            description: '请配置VITE_AI_API_URL环境变量',
        };
    }

    try {
        const prompt = buildPrompt(substances, operation);
        console.log('[AI] Prompt:', prompt);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: "system", content: "You are a helpful chemistry expert. You must output JSON only." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI] API error:', response.status, errorText);
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('[AI] Raw API response:', data);

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid API response structure');
        }

        const responseText = data.choices[0].message.content;
        console.log('[AI] Response text:', responseText);

        const result = parseAIResponse(responseText);
        console.log('[AI] Parsed result:', result);

        return result;

    } catch (error) {
        console.error('[AI] Error analyzing reaction:', error);
        // Return default error result with more info if available
        return {
            hasReaction: false,
            outputSubstances: [],
            effectType: 'none',
            description: `反应分析失败: ${error instanceof Error ? error.message : '未知错误'}`,
        };
    }
}

/**
 * Analyze reaction with cache: first try to get from DB, otherwise call AI and cache result.
 * Returns the AIReactionResult and indicates whether it came from cache or AI.
 */
export async function analyzeReactionWithCache(inputSubstances: Substance[], operation: Operation): Promise<{ result: AIReactionResult; source: 'cache' | 'ai' }> {
    // Use Chinese names for cache key as requested
    const inputNames = inputSubstances.map(s => s.name).sort();
    const operationName = OPERATION_MAP[operation];

    // Try cache
    const cached = await findReactionInCache(inputNames, operationName);
    if (cached) {
        console.log('[Cache] Hit for reaction', { inputNames, operationName });
        return { result: cached, source: 'cache' };
    }
    // Not cached, call AI
    const result = await analyzeChemicalReaction(inputSubstances, operation);
    // Save to cache (regardless of whether reaction occurred, to avoid repeated AI calls)
    await saveReactionToCache(result, operationName, inputNames);
    return { result, source: 'ai' };
}

export interface MoleculeStructure {
    atoms: { element: string; x: number; y: number; z: number }[];
    bonds: { a: number; b: number; order?: number }[];
}

function buildMoleculePrompt(formula: string): string {
    return `你是一位化学专家与分子建模助手。请根据分子式 "${formula}" 给出一个合理的三维空间结构的近似坐标与成键信息，用于教学演示（不需要量化计算精度）。

严格返回如下JSON（不要任何其他文字）：
{
  "atoms": [ { "element": "C", "x": 0.0, "y": 0.0, "z": 0.0 }, ... ],
  "bonds": [ { "a": 0, "b": 1, "order": 1 }, ... ]
}

要求：
- 原子列表按索引排列；元素使用化学元素符号；坐标单位为任意相对单位，体现空间构型（如键角/键长大致合理）。
- 键的 order 取 1/2/3 表示单/双/三键。
- 对于含氢的分子，包含氢原子并成键；对于常见有机与无机小分子给出典型构型（如水的近似104.5°）。
`;
}

export async function fetchMoleculeStructure(formula: string): Promise<MoleculeStructure | null> {
    try {
        const prompt = buildMoleculePrompt(formula);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: 'You output JSON only.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 1200
            })
        });
        if (!response.ok) {
            const text = await response.text();
            console.error('[AI] Molecule API error', response.status, text);
            return null;
        }
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content?.trim() || '';
        let clean = content;
        if (clean.startsWith('```')) {
            clean = clean.replace(/```json\n?/, '').replace(/```$/, '');
        }
        const parsed = JSON.parse(clean);
        if (!parsed.atoms || !Array.isArray(parsed.atoms)) return null;
        return parsed as MoleculeStructure;
    } catch (e) {
        console.error('[AI] fetchMoleculeStructure error', e);
        return null;
    }
}
