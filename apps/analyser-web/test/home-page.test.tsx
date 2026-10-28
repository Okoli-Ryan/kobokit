import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomePage } from '../src/home-page';

describe('HomePage', () => {
  it('shows the app heading', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Kobokit statement analyser' }),
    ).toBeInTheDocument();
  });
});
