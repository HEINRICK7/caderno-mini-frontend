import { describe, expect, it } from 'vitest';
import { countLabel, formatDate, pluralLabel } from './format-date';

describe('formatDate', () => {
  it('keeps date-only values on the same civil day', () => {
    expect(formatDate('2026-11-20')).toBe('20/11/2026');
  });

  it('formats timestamps in the local timezone', () => {
    expect(formatDate('2026-11-14T12:00:00.000Z')).toBe(new Intl.DateTimeFormat('pt-BR').format(new Date('2026-11-14T12:00:00.000Z')));
  });
});

describe('countLabel', () => {
  it('uses singular for one and plural otherwise', () => {
    expect(countLabel(1, 'cliente')).toBe('1 cliente');
    expect(countLabel(2, 'cliente', 'clientes')).toBe('2 clientes');
    expect(pluralLabel(1, 'venda registrada', 'vendas registradas')).toBe('venda registrada');
    expect(pluralLabel(2, 'venda registrada', 'vendas registradas')).toBe('vendas registradas');
  });
});
