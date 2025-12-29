import './macro!';

export { default as borrow } from 'lib/checks/borrow/borrow!';
export { default as $ } from 'lib/checks/borrow/$!';
export { default as borrowMutable } from 'lib/checks/borrow/borrowMutable!';
export { default as $$ } from 'lib/checks/borrow/$$!';
export { default as stack } from 'lib/checks/static/stack!';
export { default as move } from 'lib/checks/move/move!';
export { default as local } from 'lib/checks/local/local!';

export { default as err } from 'lib/core/result/err!';
export { default as ok } from 'lib/core/result/ok!';
export { default as return } from 'lib/core/result/return!';
