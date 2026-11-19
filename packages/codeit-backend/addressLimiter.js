'use strict';

// ── A school is one address ─────────────────────────────────────────────────
//
// Every pupil in a school reaches the site from the school's one public
// address. A limit counted by address is a limit on the whole school, and two
// of ours were set as if an address were a person.
//
// Measured 19 November 2026 against this backend, as three classes of thirty
// from one address, each pupil joining, doing a lesson and its quiz:
//
//   · joining a class was limited to 80 an hour from an address, so ten
//     pupils in the third class were told "That is a lot of joins from one
//     place";
//   · the page's own counting (analytics) was limited to 30 events a minute
//     from an address: 460 of 490 events were refused. Nobody in the room
//     sees that, but it is how a school's whole hour on the site became a
//     handful of events in the numbers this product is steered by.
//
// So: each browser gets its own allowance, named by the journey id every page
// sends (the builder's limiter has done this since October, "so a classroom
// is thirty children rather than one address"), and the address keeps a
// ceiling high enough for a school and low enough to bound a script. A caller
// that sends no journey id is one browser, as before.
//
// In memory, per server process, like the limiters it replaces: it bounds
// accidents and casual abuse. It is not a wall.

function createAddressLimiter({ perBrowser, perAddress, windowMs }) {
  const buckets = new Map();

  function take(key, limit, now) {
    const entry = buckets.get(key);
    if (!entry || entry.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return true; }
    if (entry.count >= limit) return false;
    entry.count += 1;
    return true;
  }

  /**
   * @param {{ address: string, browser?: string|null }} who
   * @returns {boolean} whether this request is within the limits
   */
  function allow({ address, browser }, now = Date.now()) {
    if (buckets.size > 5000) for (const [key, entry] of buckets) if (entry.resetAt <= now) buckets.delete(key);
    const where = address || 'unknown';
    if (!browser) return take(`address-as-browser:${where}`, perBrowser, now);
    // The browser's own allowance first: one that has used it up does not
    // also use up the school's.
    if (!take(`browser:${browser}`, perBrowser, now)) return false;
    return take(`address:${where}`, perAddress, now);
  }

  return { allow, size: () => buckets.size };
}

module.exports = { createAddressLimiter };
