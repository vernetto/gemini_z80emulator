
import React, { useState, useEffect } from 'react';

interface MemoryViewerProps {
  memory: Uint8Array;
  onEdit: (address: number, value: number) => void;
  pc: number;
}

const MemoryViewer: React.FC<MemoryViewerProps> = ({ memory, onEdit, pc }) => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 16;
  const totalPages = Math.ceil(memory.length / (rowsPerPage * 16));

  const handlePageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPage(parseInt(e.target.value));
  };

  const renderMemory = () => {
    const start = page * rowsPerPage * 16;
    const end = start + rowsPerPage * 16;
    const rows = [];

    for (let i = start; i < end; i += 16) {
      const rowBytes = [];
      for (let j = 0; j < 16; j++) {
        const addr = i + j;
        const val = memory[addr];
        const isPC = addr === pc;
        rowBytes.push(
          <div 
            key={addr} 
            className={`p-1 text-xs border border-transparent hover:border-blue-500 cursor-pointer transition-colors ${isPC ? 'bg-blue-900 text-white font-bold animate-pulse' : 'text-zinc-400'}`}
            title={`Address: 0x${addr.toString(16).padStart(4, '0')}`}
            onClick={() => {
              const newVal = prompt(`Enter hex value for 0x${addr.toString(16).padStart(4, '0')}:`, val.toString(16));
              if (newVal !== null) {
                onEdit(addr, parseInt(newVal, 16));
              }
            }}
          >
            {val.toString(16).padStart(2, '0').toUpperCase()}
          </div>
        );
      }
      rows.push(
        <div key={i} className="flex gap-1 items-center">
          <span className="text-zinc-600 text-[10px] w-12 font-bold select-none">
            {i.toString(16).padStart(4, '0').toUpperCase()}
          </span>
          {rowBytes}
        </div>
      );
    }
    return rows;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col h-full shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest">Memory Map (RAM)</h3>
        <select 
          value={page} 
          onChange={handlePageChange}
          className="bg-zinc-800 text-xs text-zinc-300 border border-zinc-700 rounded px-2 py-1 outline-none"
        >
          {Array.from({ length: totalPages }).map((_, i) => (
            <option key={i} value={i}>Page {i.toString(16).padStart(2, '0').toUpperCase()} (0x{(i * 256).toString(16).padStart(4, '0')})</option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar font-mono bg-black rounded p-2 border border-zinc-950">
        <div className="flex gap-1 items-center mb-2 border-b border-zinc-800 pb-1">
          <span className="w-12"></span>
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="w-6 text-center text-[9px] text-zinc-500 font-bold">{i.toString(16).toUpperCase()}</span>
          ))}
        </div>
        <div className="space-y-1">
          {renderMemory()}
        </div>
      </div>
    </div>
  );
};

export default MemoryViewer;
