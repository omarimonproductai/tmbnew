import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ViewToggle } from './ViewToggle';

describe('ViewToggle', () => {
  it('shows the list icon (label) when in map mode', () => {
    render(<ViewToggle value="map" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /llista/i })).toBeInTheDocument();
  });

  it('shows the map icon (label) when in list mode', () => {
    render(<ViewToggle value="list" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /mapa/i })).toBeInTheDocument();
  });

  it('flips to the opposite mode on click', () => {
    const onChange = vi.fn();
    render(<ViewToggle value="map" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /llista/i }));
    expect(onChange).toHaveBeenCalledWith('list');
  });
});
