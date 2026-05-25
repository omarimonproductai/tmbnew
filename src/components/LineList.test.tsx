import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LineList } from './LineList';
import type { Linia } from '../types/tmb';

const SAMPLE: Linia[] = [
  {
    id: 'metro-1',
    codi: 'L1',
    nom: 'Hospital de Bellvitge — Fondo',
    tipus: 'metro',
    color: '#C8001E',
    nomComplet: 'Metro L1',
  },
  {
    id: 'bus-7',
    codi: '7',
    nom: 'Barceloneta — Carmel',
    tipus: 'bus',
    color: '#E84E0F',
    nomComplet: 'Bus 7',
  },
];

describe('LineList', () => {
  it('mostra l’estat de càrrega', () => {
    render(
      <LineList
        linies={[]}
        selectedId={null}
        loading
        error={null}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText(/carregant línies/i)).toBeInTheDocument();
  });

  it('mostra error si la càrrega ha fallat', () => {
    render(
      <LineList
        linies={[]}
        selectedId={null}
        loading={false}
        error="boom"
        onSelect={() => {}}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/no s'han pogut carregar/i);
  });

  it('renderitza línies i emet selecció', () => {
    const onSelect = vi.fn();
    render(
      <LineList
        linies={SAMPLE}
        selectedId={null}
        loading={false}
        error={null}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText('L1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Barceloneta — Carmel'));
    expect(onSelect).toHaveBeenCalledWith(SAMPLE[1]);
  });
});
