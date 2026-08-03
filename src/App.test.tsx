import React from 'react';
import { render } from '@testing-library/react';
import { ToastContainer } from 'react-toastify';

test('renders the global toast container used by the application shell', () => {
  render(<ToastContainer />);
  expect(document.querySelector('.Toastify')).toBeInTheDocument();
});
