// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// ── How long "not there yet" is allowed to mean "not there" ──────────────────
//
// Testing Library waits one second by default for findBy* to resolve. That is
// plenty when a suite runs alone and not always enough when 53 of them run at
// once on a shared machine: one Builder test failed twice, hours apart, always
// inside a full run and never once in five isolated runs. The product was fine
// — the code panel has a loading state and an error state, and both work. The
// test simply asked before jsdom had finished.
//
// A test that fails at random is worse than one that fails: it teaches whoever
// reads the build to shrug at red, and there is now CI publishing that red on
// every push. Five seconds costs nothing when a test passes, and only spends
// the extra four when something is genuinely wrong.
import { configure } from '@testing-library/react';

configure({ asyncUtilTimeout: 5000 });
