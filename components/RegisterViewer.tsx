
import React from 'react';
import { Z80Registers, RegisterName } from '../types';

interface RegisterViewerProps {
  registers: Z80Registers;
  onEdit: (reg: RegisterName, value: number) => void;
}

const RegisterViewer: React.FC<RegisterViewerProps> = ({ registers, onEdit }) => {
  const regGroups = [
    { title: 'Main Registers', regs: ['a', 'f', 'b', 'c', 'd', 'e', 'h', 'l'] as RegisterName[] },
    { title: 'Special Registers', regs: ['pc', 'sp', 'ix', 'iy', 'i', 'r'] as RegisterName[] }
  ];

  const renderFlags = () => {
    const f = registers.f;
    const flags = [
      { n: 'S', b: 7 }, { n: 'Z', b: 6 }, { n: 'Y', b: 5 }, { n: 'H', b: 4 },
      { n: 'X', b: 3 }, { n: 'P/V', b: 2 }, { n: 'N', b: 1 }, { n: 'C', b: 0 }
    ];
    return (
      <div className="flex gap-2 mt-4">
        {flags.map(flag => {
          const active = !!(f & (1 << flag.b));
          return (
            <div 
              key={flag.n} 
              className={`flex flex-col items-center p-1 border rounded w-8 ${active ? 'bg-blue-900 border-blue-500 text-blue-200' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
              title={`Bit ${flag.b}`}
            >
              <span className="text-[10px] font-bold">{flag.n}</span>
              <span className="text-xs">{active ? '1' : '0'}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-2xl space-y-4">
      <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest border-b border-zinc-800 pb-2">CPU Registers</h3>
      
      {regGroups.map(group => (
        <div key={group.title}>
          <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">{group.title}</p>
          <div className="grid grid-cols-4 gap-2">
            {group.regs.map(reg => {
              const val = registers[reg] as number;
              const is16Bit = ['pc', 'sp', 'ix', 'iy'].includes(reg);
              return (
                <div key={reg} className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase">{reg}</span>
                  <input 
                    type="text"
                    value={val.toString(16).toUpperCase().padStart(is16Bit ? 4 : 2, '0')}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 16);
                      if (!isNaN(v)) onEdit(reg, v);
                    }}
                    className="bg-black text-xs text-white border border-zinc-700 rounded px-1 py-1 w-full outline-none focus:border-green-500 font-mono text-center"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div>
        <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Flags (F Register)</p>
        {renderFlags()}
      </div>
    </div>
  );
};

export default RegisterViewer;
