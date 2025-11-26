
import { useState } from 'react';
import { IntroPage } from './components/IntroPage';
import { MaterialSelectionPage } from './components/MaterialSelectionPage';
import { OperationSelectionPage } from './components/OperationSelectionPage';
import { ResultPage } from './components/ResultPage';
import LogPanel from './components/LogPanel';
import MoleculeViewerPage from './components/MoleculeViewerPage';
import { useDeviceInfo } from './hooks/useDeviceInfo';
import { useLab } from './hooks/useLab';
import type { Operation, AIReactionResult, LogEntry, Substance } from './types';
import { analyzeReactionWithCache, OPERATION_MAP } from './services/ai-service';
import { addCompound, getAllCompounds } from './services/json-data-service';

type WizardStep = 'intro' | 'material' | 'operation' | 'result' | 'molecule';

interface SelectedMaterial {
  substanceId: string;
  preProcess: 'none' | 'crush' | 'heat';
}

function App() {
  console.log('[App] Component function called');
  const { substances, setSubstances, isReady, error } = useLab();

  console.log('[App] useLab result:', { substances: Object.keys(substances).length, isReady, error });
  const [step, setStep] = useState<WizardStep>('intro');
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(null);
  const [reactionResult, setReactionResult] = useState<AIReactionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reactionLog, setReactionLog] = useState<LogEntry[]>([]);
  const { isMobilePhone, isPortrait } = useDeviceInfo();
  const [hideRotateTip, setHideRotateTip] = useState(false);
  const [previewFormula, setPreviewFormula] = useState<string | null>(null);
  const handleRestart = () => {
    setSelectedMaterials([]);
    setSelectedOperation(null);
    setReactionResult(null);
    setIsAnalyzing(false);
    setStep('material');
    // Keep reaction log for the session
  };

  const handleSelectMaterial = (substanceId: string) => {
    if (selectedMaterials.length < 4) {
      setSelectedMaterials([...selectedMaterials, { substanceId, preProcess: 'none' }]);
    }
  };

  const handleRemoveMaterial = (index: number) => {
    const newMaterials = [...selectedMaterials];
    newMaterials.splice(index, 1);
    setSelectedMaterials(newMaterials);
  };

  const handleUpdatePreProcess = (index: number, preProcess: 'none' | 'crush' | 'heat') => {
    const newMaterials = [...selectedMaterials];
    newMaterials[index].preProcess = preProcess;
    setSelectedMaterials(newMaterials);
  };

  const handlePreviewMaterial = (substanceId: string) => {
    const sub = substances[substanceId];
    const formula = sub?.formula || sub?.name || '未知物质';
    setPreviewFormula(formula);
    setStep('molecule');
  };

  const handleStartExperiment = async () => {
    if (!selectedOperation) return;

    setIsAnalyzing(true);
    setStep('result');

    try {
      // Gather full substance info with preprocessing states
      const inputSubstances = selectedMaterials.map(m => {
        const substance = substances[m.substanceId];
        if (!substance) return null;

        // Create modified substance with preprocessing info
        let modifiedSubstance = { ...substance };

        if (m.preProcess === 'crush') {
          // For crushed substances, append "_powder" to ID and update type
          modifiedSubstance = {
            ...substance,
            id: `${substance.formula || substance.id}_powder`,
            name: `${substance.name}（粉末）`,
            type: 'powder' as const,
            description: `${substance.description}（已粉碎）`
          };
        } else if (m.preProcess === 'heat') {
          // For preheated substances, add note to description
          modifiedSubstance = {
            ...substance,
            id: `${substance.formula || substance.id}_heated`,
            name: `${substance.name}（预热）`,
            description: `${substance.description}（已预热）`
          };
        }

        return modifiedSubstance;
      }).filter(Boolean) as Substance[];


      console.log('[App] Starting analysis with cache...', inputSubstances, selectedOperation);

      // Use cache-aware analysis
      const { result, source } = await analyzeReactionWithCache(inputSubstances, selectedOperation);
      console.log('[App] Analysis result:', result, 'source:', source);
      setReactionResult(result);

      // Add log entry
      setReactionLog(prev => [{
        timestamp: new Date().toISOString(),
        source,
        inputs: inputSubstances.map(s => s.name),
        operation: OPERATION_MAP[selectedOperation],
        outputs: result.outputSubstances.map(o => o.name),
        description: result.description,
      }, ...prev]);

      // Save new substances to storage and refresh list
      if (result.hasReaction && result.outputSubstances.length > 0) {
        const currentCompounds = await getAllCompounds();

        for (const sub of result.outputSubstances) {
          // Check if substance with same formula already exists
          const exists = Object.values(currentCompounds).some(
            existing => existing.formula === sub.formula
          );

          if (exists) {
            console.log(`[App] Substance ${sub.name} (${sub.formula}) already exists, skipping add.`);
            continue;
          }

          // Generate a unique ID based on formula or name
          const substanceId = sub.formula || sub.name.replace(/\s+/g, '_');
          const substanceToSave: Substance = {
            id: substanceId,
            name: sub.name,
            formula: sub.formula,
            color: sub.color,
            type: sub.type,
            description: sub.description,
          };
          await addCompound(substanceToSave);
        }
        // Refresh substances list
        const updatedSubstances = await getAllCompounds();
        setSubstances(updatedSubstances);
      }
    } catch (error) {
      console.error('[App] Error analyzing reaction:', error);
      setReactionResult({
        hasReaction: false,
        outputSubstances: [],
        effectType: 'none',
        description: '反应分析出错，请稍后重试',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-red-500">
        <div className="text-xl font-bold">Error loading database: {error}</div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-100">
        <div className="text-xl font-bold animate-pulse">正在加载化学数据...</div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen bg-slate-950 text-slate-200 font-sans ${isMobilePhone ? 'flex flex-col overflow-hidden' : 'flex overflow-hidden'}`}>
      <div className="flex-1 flex flex-col overflow-y-auto">
        {step === 'intro' && (
          <IntroPage onNext={() => setStep('material')} />
        )}

        {step === 'material' && (
          <MaterialSelectionPage
            substances={substances}
            selectedMaterials={selectedMaterials}
            onSelectMaterial={handleSelectMaterial}
            onRemoveMaterial={handleRemoveMaterial}
            onUpdatePreProcess={handleUpdatePreProcess}
            onPreviewMaterial={handlePreviewMaterial}
            onNext={() => setStep('operation')}
            onBack={() => setStep('intro')}
          />
        )}

        {step === 'operation' && (
          <OperationSelectionPage
            selectedOperation={selectedOperation}
            onSelectOperation={setSelectedOperation}
            onStart={handleStartExperiment}
            onBack={() => setStep('material')}
          />
        )}

        {step === 'result' && (
          <ResultPage
            reaction={reactionResult}
            inputSubstances={selectedMaterials.map(m => substances[m.substanceId])}
            isAnalyzing={isAnalyzing}
            onRestart={handleRestart}
          />
        )}

        {step === 'molecule' && previewFormula && (
          <MoleculeViewerPage
            formula={previewFormula}
            onBack={() => setStep('material')}
          />
        )}
      </div>
      <LogPanel logEntries={reactionLog} placement={isMobilePhone && isPortrait ? 'bottom' : 'right'} />
      {(isMobilePhone && !isPortrait && !hideRotateTip) && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-center max-w-xs">
            <div className="text-slate-200 font-bold mb-2">为获得更好体验</div>
            <div className="text-slate-400 text-sm mb-4">请将手机旋转至竖屏模式</div>
            <button onClick={() => setHideRotateTip(true)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md">我知道了</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
