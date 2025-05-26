import '@testing-library/jest-dom';

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: function MockMotionDiv(props) {
      const { children, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    form: function MockMotionForm(props) {
      const { children, ...rest } = props;
      return <form {...rest}>{children}</form>;
    },
    button: function MockMotionButton(props) {
      const { children, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
  },
  AnimatePresence: function MockAnimatePresence(props) {
    return props.children;
  },
}));

// Mock Firebase
jest.mock('@/lib/firebase/config', () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
  },
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  },
})); 