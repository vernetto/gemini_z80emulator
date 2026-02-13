
export interface AssemblyResult {
  bytes: number[];
  addressToLineMap: Record<number, number>;
}

/**
 * A very basic line-by-line assembler to convert human-readable 
 * assembly into Z80 opcodes with source mapping.
 */
export const assemble = (code: string): AssemblyResult => {
  const lines = code.split('\n');
  const program: number[] = [];
  const addressToLineMap: Record<number, number> = {};

  const regMap: Record<string, number> = {
    'B': 0x06, 'C': 0x0E, 'D': 0x16, 'E': 0x1E, 'H': 0x26, 'L': 0x2E, 'A': 0x3E
  };

  let currentAddress = 0;

  lines.forEach((line, lineIndex) => {
    const clean = line.trim().toUpperCase().split(';')[0].trim();
    if (!clean) {
      // Skip empty or comment-only lines
      return;
    }

    const startAddr = currentAddress;
    const parts = clean.split(/\s+/);
    const inst = parts[0];
    const args = parts.slice(1).join('').split(',').map(a => a.trim());

    let bytesForThisLine: number[] = [];

    if (inst === 'NOP') {
      bytesForThisLine = [0x00];
    } else if (inst === 'HALT') {
      bytesForThisLine = [0x76];
    } else if (inst === 'XOR' && args[0] === 'A') {
      bytesForThisLine = [0xAF];
    } else if (inst === 'LD') {
      const reg = args[0];
      const val = parseInt(args[1], 16);
      if (regMap[reg] !== undefined && !isNaN(val)) {
        bytesForThisLine = [regMap[reg], val & 0xFF];
      }
    } else if (inst === 'INC' && args[0] === 'A') {
      bytesForThisLine = [0x3C];
    } else if (inst === 'DEC' && args[0] === 'A') {
      bytesForThisLine = [0x3D];
    } else if (inst === 'ADD' && args[0] === 'A' && args[1] === 'B') {
      bytesForThisLine = [0x80];
    } else if (inst === 'JP') {
      const addr = parseInt(args[0], 16);
      if (!isNaN(addr)) {
        bytesForThisLine = [0xC3, addr & 0xFF, (addr >> 8) & 0xFF];
      }
    }

    if (bytesForThisLine.length > 0) {
      // Map every byte of this instruction to this line
      for (let i = 0; i < bytesForThisLine.length; i++) {
        addressToLineMap[currentAddress + i] = lineIndex;
      }
      program.push(...bytesForThisLine);
      currentAddress += bytesForThisLine.length;
    }
  });

  return { bytes: program, addressToLineMap };
};
