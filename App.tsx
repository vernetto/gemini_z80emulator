import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Z80Emulator } from './services/z80';
import { assemble } from './services/assembler';
import { Z80State, RegisterName } from './types';
import RegisterViewer from './components/RegisterViewer';
import MemoryViewer from './components/MemoryViewer';
import CodeEditor from './components/CodeEditor';

const INITIAL_CODE = `; Z80 Retro Demo
; Clear Accumulator
XOR A
; Load A with 05h
LD A, 05
; Load B with 0Ah
LD B, 0A
; Add B to A
ADD A, B
; Increment result
INC A
; Loop back
JP 0000
HALT`;

const App: React.FC = () => {
  const [cpu] = useState(() => new Z80Emulator());
  const [state, setState] = useState<Z80State>(cpu.getState());
  const [code, setCode] = useState(INITIAL_CODE);
  const [isRunning, setIsRunning] = useState(false);
  const [addressToLineMap, setAddressToLineMap] = useState<Record<number, number>>({});
  const [previousPC, setPreviousPC] = useState<number>(0);
  const runInterval = useRef<number | null>(null);

  const updateState = useCallback(() => {
    setState(cpu.getState());
  }, [cpu]);

  const handleStep = useCallback(() => {
    setPreviousPC(cpu.getState().registers.pc);
    cpu.step();
    updateState();
  }, [cpu, updateState]);

  const handleRun = () => {
    if (runInterval.current) return;
    setIsRunning(true);
    runInterval.current = window.setInterval(() => {
      // Execute steps
      setPreviousPC(cpu.getState().registers.pc);
      for (let i = 0; i < 50; i++) {
        cpu.step();
      }
      updateState();
    }, 16);
  };

  const handlePause = () => {
    if (runInterval.current) {
      clearInterval(runInterval.current);
      runInterval.current = null;
    }
    setIsRunning(false);
    updateState();
  };

  const handleReset = () => {
    handlePause();
    cpu.loadProgram(0, []);
    cpu.setRegister('pc', 0);
    cpu.setRegister('sp', 0xFFFF);
    cpu.setRegister('a', 0);
    cpu.setRegister('f', 0);
    updateState();
  };

  const handleAssemble = () => {
    const { bytes, addressToLineMap: map } = assemble(code);
    cpu.loadProgram(0, bytes);
    setAddressToLineMap(map);
    // set previousPC to the current cpu PC (usually 0 after load)
    setPreviousPC(cpu.getState().registers.pc);
    updateState();
    console.log(`Assembled ${bytes.length} bytes.`);
  };

  const handleMemoryEdit = (addr: number, val: number) => {
    cpu.setMemory(addr, val);
    updateState();
  };

  const handleRegisterEdit = (reg: RegisterName, val: number) => {
    cpu.setRegister(reg, val);
    updateState();
  };

  useEffect(() => {
    return () => {
      if (runInterval.current) clearInterval(runInterval.current);
    };
  }, []);

  // Auto-assemble the initial code on first mount so stepping works immediately
  useEffect(() => {
    handleAssemble();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine which line is currently being executed
  // Prefer previousPC (the instruction that just executed) but fall back to current PC
  const activeLineIndex =
    addressToLineMap[previousPC] !== undefined
      ? addressToLineMap[previousPC]
      : addressToLineMap[state.registers.pc] !== undefined
      ? addressToLineMap[state.registers.pc]
      : null;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            Z80 PRO-DEBUGGER
          </h1>
          <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest">High-Fidelity Microprocessor Emulation</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4 text-[10px] font-mono">
          <div className="flex flex-col items-end">
             <span className="text-zinc-500">CYCLE COUNT</span>
             <span className="text-white text-lg">{state.cycles.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-zinc-500">STATUS</span>
             <span className={state.halted ? 'text-red-500' : 'text-green-500'}>
               {state.halted ? 'HALTED' : (isRunning ? 'RUNNING' : 'IDLE')}
             </span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        <div className="lg:col-span-4 h-[600px] lg:h-auto">
          <CodeEditor 
            code={code}
            setCode={setCode}
            onAssemble={handleAssemble}
            onStep={handleStep}
            onRun={handleRun}
            onPause={handlePause}
            onReset={handleReset}
            isRunning={isRunning}
            activeLineIndex={activeLineIndex}
          />
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RegisterViewer 
              registers={state.registers}
              onEdit={handleRegisterEdit}
            />
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-2xl overflow-hidden">
               <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4">Emulator Info</h3>
               <div className="text-[11px] text-zinc-400 space-y-2 font-mono">
                 <p><strong className="text-zinc-200">PC:</strong> 0x{state.registers.pc.toString(16).padStart(4, '0').toUpperCase()}</p>
                 <p><strong className="text-zinc-200">Next Opcode:</strong> 0x{state.memory[state.registers.pc].toString(16).padStart(2, '0').toUpperCase()}</p>
                 <p><strong className="text-zinc-200">Prev PC:</strong> 0x{previousPC.toString(16).padStart(4, '0').toUpperCase()}</p>
                 <p><strong className="text-zinc-200">Mapped at Prev PC:</strong> {addressToLineMap[previousPC] !== undefined ? (addressToLineMap[previousPC] + 1) : '—'}</p>
                 <p><strong className="text-zinc-200">Mapped at PC:</strong> {addressToLineMap[state.registers.pc] !== undefined ? (addressToLineMap[state.registers.pc] + 1) : '—'}</p>
                 <p><strong className="text-zinc-200">Mapped Bytes:</strong> {Object.keys(addressToLineMap).length}</p>
                 <div className="mt-6 p-2 bg-black border border-zinc-800 rounded text-green-600">
                    &gt; LOG: {activeLineIndex !== null ? `Executing line ${activeLineIndex + 1}` : 'CPU ready.'}
                 </div>
               </div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[400px]">
            <MemoryViewer 
              memory={state.memory}
              onEdit={handleMemoryEdit}
              pc={state.registers.pc}
            />
          </div>
        </div>
      </main>

      <footer className="text-center text-[10px] text-zinc-600 py-4 border-t border-zinc-900">
        &copy; 2024 VINTAGE COMPUTING INTERFACE &bull; GEMINI POWERED Z80 ENGINE
      </footer>
    </div>
  );
};

export default App;
