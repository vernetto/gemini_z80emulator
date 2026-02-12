
export interface Z80Registers {
  a: number;
  f: number;
  b: number;
  c: number;
  d: number;
  e: number;
  h: number;
  l: number;
  pc: number;
  sp: number;
  ix: number;
  iy: number;
  i: number;
  r: number;
  iff1: boolean;
  iff2: boolean;
  im: number;
}

export interface Z80State {
  registers: Z80Registers;
  memory: Uint8Array;
  halted: boolean;
  cycles: number;
}

export interface Flags {
  s: boolean; // Sign
  z: boolean; // Zero
  y: boolean; // Undocumented bit 5
  h: boolean; // Half Carry
  x: boolean; // Undocumented bit 3
  pv: boolean; // Parity or Overflow
  n: boolean; // Add/Subtract
  c: boolean; // Carry
}

export type RegisterName = keyof Z80Registers;

export enum DebuggerState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  STEPPING = 'STEPPING'
}
