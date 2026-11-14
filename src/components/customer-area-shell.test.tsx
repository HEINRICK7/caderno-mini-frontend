// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { pathname, replace, signOutCustomer } = vi.hoisted(() => ({
  pathname: vi.fn(() => '/painel'),
  replace: vi.fn(),
  signOutCustomer: vi.fn(),
}));

vi.mock('next/navigation', () => ({ usePathname: pathname, useRouter: () => ({ replace }) }));
vi.mock('next/link', () => ({ default: ({ children, href, onClick, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} onClick={(event) => { event.preventDefault(); onClick?.(event); }} {...props}>{children}</a> }));
vi.mock('@/lib/api-client', () => ({ api: { signOutCustomer } }));

import { CustomerAreaShell } from './customer-area-shell';

afterEach(cleanup);
afterEach(() => pathname.mockReturnValue('/painel'));

describe('navegação da área do cliente', () => {
  it('mostra quatro destinos de rotina e agrupa os demais em Mais recursos', () => {
    render(<CustomerAreaShell><p>Conteúdo</p></CustomerAreaShell>);
    const nav = screen.getByRole('navigation', { name: 'Navegação da área do cliente' });
    expect(nav.querySelectorAll(':scope > a')).toHaveLength(4);
    expect(screen.getByRole('link', { name: 'Visão geral' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Clientes' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Vendas e cobranças' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Mensagens' })).toBeTruthy();
    const more = screen.getByText('Mais recursos').closest('details')!;
    expect(more.open).toBe(false);
    expect(screen.getByRole('link', { name: 'Produtos e serviços' }).closest('details')).toBe(more);
    fireEvent.click(screen.getByText('Mais recursos'));
    expect(more.open).toBe(true);
    expect(screen.getByRole('link', { name: 'Produtos e serviços' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Cobranças recorrentes' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Criar QR Code' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Minha conta' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Criar mensagem' })).toBeTruthy();
  });

  it('marca cobranças recorrentes como ativas sem marcar o atalho combinado', () => {
    pathname.mockReturnValue('/recorrencias');
    render(<CustomerAreaShell><p>Conteúdo</p></CustomerAreaShell>);
    expect(screen.getByRole('link', { name: 'Vendas e cobranças' }).getAttribute('aria-current')).toBeNull();
    fireEvent.click(screen.getByText('Mais recursos'));
    expect(screen.getByRole('link', { name: 'Cobranças recorrentes' }).getAttribute('aria-current')).toBe('page');
  });

  it('recolhe os links no estado inicial mobile e fecha o menu após navegar', () => {
    render(<CustomerAreaShell><p>Conteúdo</p></CustomerAreaShell>);
    const menu = screen.getByRole('button', { name: 'Abrir menu' });
    expect(menu.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(menu);
    expect(screen.getByRole('button', { name: 'Fechar menu' }).getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(screen.getByRole('link', { name: 'Mensagens' }));
    expect(screen.getByRole('button', { name: 'Abrir menu' }).getAttribute('aria-expanded')).toBe('false');
  });
});
