
import { Z80Registers, Z80State, Flags } from '../types';

/**
 * A simplified Z80 Emulator service.
 * Note: A complete Z80 implementation has 700+ opcode variations.
 * This handles the core instruction set (loads, arithmetic, jumps, logic).
 */
export class Z80Emulator {
  private state: Z80State;

  constructor() {
    this.state = this.resetState();
  }

  private resetState(): Z80State {
    return {
      registers: {
        a: 0, f: 0, b: 0, c: 0, d: 0, e: 0, h: 0, l: 0,
        pc: 0, sp: 0xFFFF, ix: 0, iy: 0, i: 0, r: 0,
        iff1: false, iff2: false, im: 0
      },
      memory: new Uint8Array(65536),
      halted: false,
      cycles: 0
    };
  }

  getState(): Z80State {
    return { ...this.state, memory: new Uint8Array(this.state.memory) };
  }

  setMemory(address: number, value: number) {
    this.state.memory[address & 0xFFFF] = value & 0xFF;
  }

  setRegister(reg: keyof Z80Registers, value: number) {
    if (typeof this.state.registers[reg] === 'boolean') {
      (this.state.registers as any)[reg] = !!value;
    } else {
      (this.state.registers as any)[reg] = value & (reg === 'pc' || reg === 'sp' || reg === 'ix' || reg === 'iy' ? 0xFFFF : 0xFF);
    }
  }

  loadProgram(origin: number, bytes: number[]) {
    bytes.forEach((b, i) => {
      this.state.memory[(origin + i) & 0xFFFF] = b;
    });
    this.state.registers.pc = origin;
  }

  getFlags(): Flags {
    const f = this.state.registers.f;
    return {
      s: !!(f & 0x80),
      z: !!(f & 0x40),
      y: !!(f & 0x20),
      h: !!(f & 0x10),
      x: !!(f & 0x08),
      pv: !!(f & 0x04),
      n: !!(f & 0x02),
      c: !!(f & 0x01)
    };
  }

  private setFlags(flags: Partial<Flags>) {
    const current = this.getFlags();
    const updated = { ...current, ...flags };
    let f = 0;
    if (updated.s) f |= 0x80;
    if (updated.z) f |= 0x40;
    if (updated.y) f |= 0x20;
    if (updated.h) f |= 0x10;
    if (updated.x) f |= 0x08;
    if (updated.pv) f |= 0x04;
    if (updated.n) f |= 0x02;
    if (updated.c) f |= 0x01;
    this.state.registers.f = f;
  }

  step(): number {
    if (this.state.halted) return 0;

    const pc = this.state.registers.pc;
    const opcode = this.state.memory[pc];
    this.state.registers.pc = (pc + 1) & 0xFFFF;

    // Simplified Instruction Dispatch
    switch (opcode) {
      case 0x00: // NOP
        return 4;
      
      // 8-bit Loads LD r, n
      case 0x06: this.state.registers.b = this.fetchByte(); return 7;
      case 0x0E: this.state.registers.c = this.fetchByte(); return 7;
      case 0x16: this.state.registers.d = this.fetchByte(); return 7;
      case 0x1E: this.state.registers.e = this.fetchByte(); return 7;
      case 0x26: this.state.registers.h = this.fetchByte(); return 7;
      case 0x2E: this.state.registers.l = this.fetchByte(); return 7;
      case 0x3E: this.state.registers.a = this.fetchByte(); return 7;

      // Arithmetic
      case 0x3C: // INC A
        this.inc8('a');
        return 4;
      case 0x3D: // DEC A
        this.dec8('a');
        return 4;
      
      case 0x80: // ADD A, B
        this.add8(this.state.registers.b);
        return 4;
      
      case 0xAF: // XOR A
        this.state.registers.a ^= this.state.registers.a;
        this.updateFlagsXor(this.state.registers.a);
        return 4;

      case 0xC3: // JP nn
        this.state.registers.pc = this.fetchWord();
        return 10;
      
      case 0x18: // JR e
        const offset = this.fetchSignedByte();
        this.state.registers.pc = (this.state.registers.pc + offset) & 0xFFFF;
        return 12;

      case 0x76: // HALT
        this.state.halted = true;
        return 4;

      default:
        // For unhandled opcodes, we just NOP for now to prevent app crash
        console.warn(`Opcode 0x${opcode.toString(16).toUpperCase()} not implemented`);
        return 4;
    }
  }

  private fetchByte(): number {
    const b = this.state.memory[this.state.registers.pc];
    this.state.registers.pc = (this.state.registers.pc + 1) & 0xFFFF;
    return b;
  }

  private fetchSignedByte(): number {
    const b = this.fetchByte();
    return b > 127 ? b - 256 : b;
  }

  private fetchWord(): number {
    const low = this.fetchByte();
    const high = this.fetchByte();
    return (high << 8) | low;
  }

  private inc8(reg: keyof Z80Registers) {
    const val = (this.state.registers as any)[reg];
    const res = (val + 1) & 0xFF;
    (this.state.registers as any)[reg] = res;
    this.setFlags({
      s: !!(res & 0x80),
      z: res === 0,
      h: (val & 0x0F) === 0x0F,
      pv: val === 0x7F,
      n: false
    });
  }

  private dec8(reg: keyof Z80Registers) {
    const val = (this.state.registers as any)[reg];
    const res = (val - 1) & 0xFF;
    (this.state.registers as any)[reg] = res;
    this.setFlags({
      s: !!(res & 0x80),
      z: res === 0,
      h: (val & 0x0F) === 0x00,
      pv: val === 0x80,
      n: true
    });
  }

  private add8(val: number) {
    const a = this.state.registers.a;
    const res = a + val;
    this.state.registers.a = res & 0xFF;
    this.setFlags({
      s: !!(this.state.registers.a & 0x80),
      z: this.state.registers.a === 0,
      h: ((a & 0x0F) + (val & 0x0F)) > 0x0F,
      pv: ((a ^ res) & (val ^ res) & 0x80) !== 0,
      n: false,
      c: res > 0xFF
    });
  }

  private updateFlagsXor(res: number) {
    this.setFlags({
      s: !!(res & 0x80),
      z: res === 0,
      h: false,
      pv: this.calculateParity(res),
      n: false,
      c: false
    });
  }

  private calculateParity(val: number): boolean {
    let p = 0;
    for (let i = 0; i < 8; i++) {
      if ((val >> i) & 1) p++;
    }
    return p % 2 === 0;
  }
}
