'use strict';

// ── What a class account is ─────────────────────────────────────────────────
//
// A child who joins a class types a code and a first name. The account that
// makes has a first name, a username built from it, a password the child
// never sees, and nothing else: no email, no parent email, no date of birth.
//
// A person with their own real account can also join a class. They are a
// member too, but they are not a class account, and nothing about joining a
// class should take away anything that account could already do.
//
// So a class account is: a member of at least one class, with no email of
// any kind. One definition, used everywhere the difference matters, because
// two copies of a rule about children are two chances for them to disagree.

/**
 * SQL that is true when the user in `userColumn` is a class account.
 *
 * `userColumn` is a trusted, hard-coded column reference such as
 * 'p.user_id', never input.
 */
function isClassAccountSql(userColumn) {
  if (!/^[a-z_]+\.[a-z_]+$/i.test(userColumn)) {
    throw new Error(`isClassAccountSql takes a column reference, got ${userColumn}`);
  }
  return `EXISTS (
    SELECT 1 FROM class_members cam
      JOIN Users cau ON cau.user_id = cam.user_id
     WHERE cam.user_id = ${userColumn}
       AND cau.email IS NULL
       AND cau.parent_email IS NULL
  )`;
}

/** The same rule for a row already in hand. */
function isClassAccountRow(user) {
  return Boolean(user) && !user.email && !user.parent_email;
}

module.exports = { isClassAccountSql, isClassAccountRow };
