// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getCustomerPortal, getMerchantLedgerOverview, getMerchantRecurringOverview, replace } = vi.hoisted(() => ({
  getCustomerPortal: vi.fn(), getMerchantLedgerOverview: vi.fn(), getMerchantRecurringOverview: vi.fn(), replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/components/customer-area-shell', () => ({ CustomerAreaShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/customer-profile-form', () => ({ CustomerProfileForm: () => <div /> }));
vi.mock('@/lib/api-client', () => ({
  ApiError: class ApiError extends Error { constructor(message: string, readonly status = 400, readonly code = 'TEST_ERROR') { super(message); } },
  api: { getCustomerPortal, getMerchantLedgerOverview, getMerchantRecurringOverview },
}));

import CustomerDashboardPage from './page';

const draft = (id: string, templateName: string) => ({ id, templateId: 'cobranca-pix', templateName, updatedAt: '2026-11-14T12:00:00.000Z' });
const portal = {
  user: { name: 'Carlos Henrique', email: 'carlos@example.com', whatsapp: '+5585999991234', birthDate: null, profileComplete: true },
  platformAccess: { active: true, accessPlan: 'annual', expiresAt: null },
  accountAccess: [], drafts: [draft('00000000-0000-4000-8000-000000000001', 'Cobrança Pix'), draft('00000000-0000-4000-8000-000000000002', 'Pagamento confirmado')],
} as never;

afterEach(cleanup);
beforeEach(() => {
  getCustomerPortal.mockReset().mockResolvedValue(portal);
  getMerchantLedgerOverview.mockReset().mockResolvedValue({ customerCount: 1, saleCount: 1, dueToday: [], overdue: [], upcoming: [], recentPayments: [] });
  getMerchantRecurringOverview.mockReset().mockResolvedValue({ activePlanCount: 0, dueToday: [], overdue: [], upcoming: [] });
  replace.mockReset();
});

describe('painel do cliente', () => {
  it('uses the saved drafts as the count and as the visible message list', async () => {
    const { container } = render(<CustomerDashboardPage />);
    expect(await screen.findByText(/O Cadernô organiza seus clientes, vendas e cobranças em um só lugar\./)).toBeTruthy();
    expect(screen.getByText('Outras opções')).toBeTruthy();
    await waitFor(() => expect(container.querySelector('.customer-panel-count')?.textContent).toBe('2'));
    expect(screen.getByText('Cobrança Pix')).toBeTruthy();
    expect(screen.getByText('Pagamento confirmado')).toBeTruthy();
    expect(screen.queryByText('Sua primeira mensagem começa aqui')).toBeNull();
    expect(screen.getByText('cliente')).toBeTruthy();
    expect(screen.getByText('venda registrada')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Registrar uma venda/ })).toBeTruthy();
  });

  it('recommends registering the first customer when the business has none', async () => {
    getMerchantLedgerOverview.mockResolvedValueOnce({ customerCount: 0, saleCount: 0, dueToday: [], overdue: [], upcoming: [], recentPayments: [] });
    render(<CustomerDashboardPage />);
    expect(await screen.findByRole('link', { name: /Cadastrar primeiro cliente/ })).toBeTruthy();
  });

  it('keeps a safe sales next step while the customer count is unknown', async () => {
    let resolveLedger!: (value: { customerCount: number; saleCount: number; dueToday: never[]; overdue: never[]; upcoming: never[]; recentPayments: never[] }) => void;
    getMerchantLedgerOverview.mockReturnValueOnce(new Promise((resolve) => { resolveLedger = resolve; }));
    render(<CustomerDashboardPage />);
    expect(await screen.findByRole('link', { name: /Registrar uma venda/ })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Cadastrar primeiro cliente/ })).toBeNull();
    resolveLedger({ customerCount: 2, saleCount: 1, dueToday: [], overdue: [], upcoming: [], recentPayments: [] });
  });

  it('shows an error with retry and recovers after the next session request', async () => {
    getCustomerPortal.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(portal);
    render(<CustomerDashboardPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    await screen.findByText(/Olá, Carlos\./);
    expect(getCustomerPortal.mock.calls.length).toBeGreaterThan(1);
  });
});
