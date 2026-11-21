/** Exact backward dynamic programming. The goal cell performs no arithmetic. */
export function shortestPath(matrix: number[], cols: number, target: number): number {
  if (!Number.isInteger(cols) || cols < 2 || matrix.length % cols !== 0 || matrix.length / cols < 2 ||
      !Number.isSafeInteger(target) || target < 1 || matrix.some(value => !Number.isSafeInteger(value) || value < 1)) {
    return Infinity;
  }
  const rows = matrix.length / cols;
  const memo = new Map<string, number>();
  const visit = (row: number, col: number, total: number): number => {
    if (row < 0 || col < 0 || total < 1) { return Infinity; }
    if (row === 0 && col === 0) { return total === matrix[0] ? 1 : Infinity; }
    const key = `${row},${col},${total}`;
    if (memo.has(key)) { return memo.get(key); }
    const value = matrix[row * cols + col];
    const best = 1 + Math.min(
      visit(row - 1, col, total - value),
      visit(row, col - 1, total - value),
      total % value === 0 ? visit(row - 1, col - 1, total / value) : Infinity
    );
    // Cache an exact answer, independent of traversal order or a global cutoff.
    memo.set(key, best);
    return best;
  };
  return Math.min(visit(rows - 1, cols - 2, target), visit(rows - 2, cols - 1, target),
    visit(rows - 2, cols - 2, target));
}
