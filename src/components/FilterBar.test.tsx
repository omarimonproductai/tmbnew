import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FilterBar } from './FilterBar';

describe('FilterBar', () => {
  it('marca el filtre actiu', () => {
    render(<FilterBar value="metro" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Metro' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('crida onChange amb el nou valor', () => {
    const onChange = vi.fn();
    render(<FilterBar value="tots" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Bus' }));
    expect(onChange).toHaveBeenCalledWith('bus');
  });
});
