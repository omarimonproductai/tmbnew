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
  it('mostra la capçalera i el toggle de mode', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /tu et mous bé/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /línies/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /aprop meu/i })).toBeInTheDocument();
  });
});
