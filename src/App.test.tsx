import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  ) as unknown as typeof fetch;
});

describe('App', () => {
  it('mostra la capçalera i el panell de filtres', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /línies de transport/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tots' })).toBeInTheDocument();
    expect(screen.getByText(/selecciona una línia/i)).toBeInTheDocument();
  });
});
