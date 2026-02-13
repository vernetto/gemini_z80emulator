import React, { useRef, useEffect } from 'react';

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  onAssemble: () => void;
  onStep: () => void;
  onRun: () => void;
  onPause: () => void;
  onReset: () => void;
  isRunning: boolean;
  activeLineIndex: number | null;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, setCode, onAssemble, onStep, onRun, onPause, onReset, isRunning, activeLineIndex 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');

  // Sync scrolling between textarea and gutter
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Auto-scroll to active line when stepping
  useEffect(() => {
    if (activeLineIndex !== null && activeLineIndex >= 0 && textareaRef.current) {
      const lineHeight = 1.25 * 16; // 1.25rem in pixels (assuming 16px base)
      const targetScrollTop = activeLineIndex * lineHeight - 100; // Center line with some offset
      const newScrollTop = Math.max(0, targetScrollTop);
      textareaRef.current.scrollTop = newScrollTop;
      // Also sync gutter scroll so the arrow remains visible
      if (gutterRef.current) {
        gutterRef.current.scrollTop = newScrollTop;
      }
    }
  }, [activeLineIndex]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col h-full shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-widest">Assembly Editor</h3>
        <div className="flex gap-2">
          <button 
            onClick={onReset}
            className="text-[10px] px-2 py-1 bg-red-900 hover:bg-red-800 text-red-100 rounded border border-red-700 transition-colors"
          >
            RESET
          </button>
          <button 
            onClick={onAssemble}
            className="text-[10px] px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded border border-zinc-600 transition-colors"
          >
            LOAD/ASM
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex overflow-hidden border border-zinc-800 rounded bg-black">
        {/* Gutter with Line Numbers and Pointer */}
        <div 
          ref={gutterRef}
          className="w-12 bg-zinc-950 border-r border-zinc-800 flex flex-col font-mono text-[10px] text-zinc-600 select-none overflow-auto pt-4"
        >
          {lines.map((_, i) => (
            <div key={i} className="h-[1.25rem] flex items-center justify-end pr-1 relative">
              {activeLineIndex === i && (
                <span className="text-green-500 font-bold text-[14px] animate-pulse mr-1">▶</span>
              )}
              <span className={activeLineIndex === i ? 'text-green-500' : ''}>{i + 1}</span>
            </div>
          ))}
        </div>

        {/* Text Area */}
        <div className="flex-1 relative group">
          {/* Background Highlight for active line */}
          <div className="absolute inset-0 pointer-events-none pt-4">
             {activeLineIndex !== null && activeLineIndex >= 0 && (
               <div 
                 className="absolute w-full bg-blue-900/20 border-y border-blue-500/30"
                 style={{ 
                   top: `${activeLineIndex * 1.25 + 1}rem`, 
                   height: '1.25rem',
                   transform: `translateY(-${textareaRef.current?.scrollTop || 0}px)`
                 }}
               />
             )}
          </div>
          <textarea 
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onScroll={handleScroll}
            spellCheck={false}
            className="w-full h-full bg-transparent text-xs text-zinc-300 font-mono p-4 outline-none resize-none custom-scrollbar relative z-10 leading-[1.25rem]"
            placeholder="; Z80 Assembly Example..."
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {isRunning ? (
          <button 
            onClick={onPause}
            className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded border border-zinc-600 font-bold text-xs"
          >
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
            PAUSE
          </button>
        ) : (
          <button 
            onClick={onRun}
            className="flex items-center justify-center gap-2 bg-green-900 hover:bg-green-800 text-green-100 py-2 rounded border border-green-700 font-bold text-xs"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            RUN
          </button>
        )}
        <button 
          onClick={onStep}
          disabled={isRunning}
          className="flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-blue-100 py-2 rounded border border-blue-700 font-bold text-xs"
        >
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          STEP
        </button>
        <div className="bg-zinc-950 flex items-center justify-center rounded border border-zinc-800">
           <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">
             {isRunning ? 'Executing...' : 'Ready'}
           </span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
