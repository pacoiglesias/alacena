import { afterEach, vi } from 'vitest';
import { cleanup, configure } from '@testing-library/react';
configure({asyncUtilTimeout:10000});
afterEach(() => {cleanup();localStorage.clear();vi.useRealTimers();});
Element.prototype.scrollIntoView=vi.fn();
vi.mock('../src/services/audioService', () => ({audio:new Proxy({}, {get:() => vi.fn()})}));
vi.mock('canvas-confetti', () => ({default:vi.fn()}));
