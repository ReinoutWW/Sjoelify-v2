import '@testing-library/jest-dom';
import React, { ReactElement, PropsWithChildren } from 'react';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
    }
  }
}

type MotionProps = PropsWithChildren<{
  [key: string]: any;
  variants?: any;
  initial?: any;
  animate?: any;
  whileHover?: any;
  whileTap?: any;
}>;

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: function MockMotionDiv({ children, variants, initial, animate, whileHover, whileTap, ...rest }: MotionProps): ReactElement {
      return React.createElement('div', rest, children);
    },
    form: function MockMotionForm({ children, variants, initial, animate, whileHover, whileTap, ...rest }: MotionProps): ReactElement {
      return React.createElement('form', rest, children);
    },
    button: function MockMotionButton({ children, variants, initial, animate, whileHover, whileTap, ...rest }: MotionProps): ReactElement {
      return React.createElement('button', rest, children);
    },
  },
  AnimatePresence: function MockAnimatePresence({ children }: MotionProps): ReactElement {
    return React.createElement(React.Fragment, null, children);
  },
})); 