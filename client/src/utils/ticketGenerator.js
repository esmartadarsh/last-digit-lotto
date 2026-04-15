const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Generate one fully random ticket: [NN][L][NNNNN] */
export function generateTicketId() {
  const prefix = String(Math.floor(10 + Math.random() * 90));
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const suffix = String(Math.floor(10000 + Math.random() * 90000));
  return `${prefix}${letter}${suffix}`;
}

/**
 * Generate `count` unique same-set tickets sharing the same last 4 digits.
 * Format: [NN][L][N][last4]  →  8 chars total
 */
export function generateSameSetTickets(count, last4) {
  const results = new Set();
  let safety = 0;
  while (results.size < count && safety < 1000) {
    safety++;
    const prefix = String(Math.floor(10 + Math.random() * 90));
    const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const middle = String(Math.floor(Math.random() * 10));
    results.add(`${prefix}${letter}${middle}${last4}`);
  }
  return [...results];
}

/**
 * Generate `count` unique 4-digit strings for the Same Set option grid.
 * Skips values already present in `exclude`.
 */
export function generateSameSetOptions(count = 6, exclude = []) {
  const seen = new Set(exclude);
  const options = [];
  let safety = 0;
  while (options.length < count && safety < 10000) {
    safety++;
    const n = String(Math.floor(1000 + Math.random() * 9000));
    if (!seen.has(n)) {
      seen.add(n);
      options.push(n);
    }
  }
  return options;
}

/**
 * Validate the 8 custom input boxes match [N][N][L][N][N][N][N][N].
 */
export function validateCustomTicket(boxes) {
  if (!boxes || boxes.length !== 8) return false;
  return (
    /^\d$/.test(boxes[0]) &&
    /^\d$/.test(boxes[1]) &&
    /^[A-Za-z]$/.test(boxes[2]) &&
    /^\d$/.test(boxes[3]) &&
    /^\d$/.test(boxes[4]) &&
    /^\d$/.test(boxes[5]) &&
    /^\d$/.test(boxes[6]) &&
    /^\d$/.test(boxes[7])
  );
}
