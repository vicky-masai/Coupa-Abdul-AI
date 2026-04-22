import '@testing-library/jest-dom';

jest.mock('./features/oaf/viteEnv.js', () =>
  jest.requireActual('./features/oaf/viteEnv.jest.js')
);