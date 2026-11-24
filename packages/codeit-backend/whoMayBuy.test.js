'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { whoMayBuy } = require('./whoMayBuy');

const now = new Date('2026-11-23T12:00:00Z');

test('a pupil who joined a class has no birthday on record, and is not sold to', () => {
  assert.deepEqual(whoMayBuy({ managedProfile: false, role: 'student', dob: null }, now), { may: false, why: 'learner-age-unknown' });
  assert.equal(whoMayBuy({ role: 'Student', dob: '' }, now).may, false);
  assert.equal(whoMayBuy({ role: 'student', dob: 'not a date' }, now).may, false);
});

test('a managed profile never buys, whatever else is true', () => {
  assert.equal(whoMayBuy({ managedProfile: true, role: 'educator' }, now).may, false);
  assert.equal(whoMayBuy({ managedProfile: true, role: 'student', dob: '1990-01-01' }, now).may, false);
});

test('a learner under 18 does not buy, and one who is 18 today does', () => {
  assert.deepEqual(whoMayBuy({ role: 'student', dob: '2012-05-01' }, now), { may: false, why: 'under-18' });
  assert.equal(whoMayBuy({ role: 'student', dob: '2008-11-24' }, now).may, false);
  assert.equal(whoMayBuy({ role: 'student', dob: '2008-11-23' }, now).may, true);
});

test('an adult who learns on a learner account buys', () => {
  assert.deepEqual(whoMayBuy({ role: 'student', dob: '1988-03-09' }, now), { may: true, why: 'adult' });
});

test('a parent or teacher account, which is never asked for a birthday, buys', () => {
  assert.deepEqual(whoMayBuy({ role: 'educator', dob: null }, now), { may: true, why: 'adult-account' });
  assert.equal(whoMayBuy({ role: 'Admin' }, now).may, true);
});

test('a birthday from the database, as a date, is read the same as one typed', () => {
  assert.equal(whoMayBuy({ role: 'student', dob: new Date('2012-05-01T00:00:00Z') }, now).may, false);
  assert.equal(whoMayBuy({ role: 'student', dob: new Date('1988-03-09T00:00:00Z') }, now).may, true);
});
