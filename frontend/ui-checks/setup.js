import { afterEach, vi } from 'vitest';
import { cleanup, configure } from '@testing-library/react';
configure({ asyncUtilTimeout: 10000 });
afterEach(() => { cleanup(); localStorage.clear(); });
Element.prototype.scrollIntoView = vi.fn();
vi.mock('../src/services/audioService', () => ({ audio: {
  click: vi.fn(), cook: vi.fn(), haptic: vi.fn(), success: vi.fn(), superCheck: vi.fn(), isMuted: () => true,
} }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
