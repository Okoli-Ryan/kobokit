import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { PdfSourceViewer } from '../src';

describe('PdfSourceViewer', () => {
  it('renders a region labelled with the document title', () => {
    render(<PdfSourceViewer documentTitle="Sample statement" />);

    expect(screen.getByRole('region', { name: 'Sample statement' })).toBeInTheDocument();
  });
});
