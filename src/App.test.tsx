import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // 导入 jest-dom 扩展以支持 toBeInTheDocument
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
