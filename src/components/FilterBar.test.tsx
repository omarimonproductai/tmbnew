import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FilterBar } from './FilterBar';

describe('FilterBar', () => {
  it('marca tots dos botons quan el valor es tots', () => {
    render(<FilterBar value="tots" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Metro' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Bus' })).toHaveAttribute('aria-pressed', 'true');
  });

  it("desactivar Bus quan tots dos estan actius deixa nomes Metro", () => {
    const onChange = vi.fn();
    render(<FilterBar value="tots" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bus' }));
    expect(onChange).toHaveBeenCalledWith('metro');
  });

  it('reactivar Bus quan nomes Metro estava actiu torna a tots', () => {
    const onChange = vi.fn();
    render(<FilterBar value="metro" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bus' }));
    expect(onChange).toHaveBeenCalledWith('tots');
  });

  it("desactivar l'unic mode actiu deixa tot desmarcat (cap)", () => {
    const onChange = vi.fn();
    render(<FilterBar value="metro" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Metro' }));
    expect(onChange).toHaveBeenCalledWith('cap');
  });

  it('cap deixa tots dos botons sense marcar', () => {
    render(<FilterBar value="cap" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Metro' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Bus' })).toHaveAttribute('aria-pressed', 'false');
  });
});
