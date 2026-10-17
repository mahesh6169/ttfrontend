// Pure-function checks (no page, no server) for event utilities.
import { test, expect } from '@playwright/test';
import { nextRowLabel } from '../../utils/events/seatBuilder.js';

test('row labels increment A->B, Z->AA, AA->AB, AZ->BA, and a custom label falls back to the next free letter', () => {
  expect(nextRowLabel('A')).toBe('B');
  expect(nextRowLabel('Y')).toBe('Z');
  expect(nextRowLabel('Z')).toBe('AA');
  expect(nextRowLabel('AA')).toBe('AB');
  expect(nextRowLabel('AZ')).toBe('BA');
  expect(nextRowLabel('VIP', ['VIP'])).toBe('A');
  expect(nextRowLabel('VIP', ['A', 'B', 'VIP'])).toBe('C');
});
