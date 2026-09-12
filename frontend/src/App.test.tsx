import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the document intelligence app shell', () => {
  render(<App />);

  expect(screen.getByText(/document intelligence workbench/i)).toBeInTheDocument();
  expect(screen.getByText(/upload documents/i)).toBeInTheDocument();
});
