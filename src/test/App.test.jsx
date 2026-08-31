import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('testing setup', () => {
  it('can render a React component and query the DOM', () => {
    render(<h1>Hello</h1>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
