/**
 * Checks if a string fuzzy-matches a pattern.
 * A fuzzy match means all characters in the pattern appear
 * in the string in the same relative order, though not necessarily contiguously.
 *
 * @param pattern the search query
 * @param text the target string to search within
 * @returns true if the pattern fuzzy-matches the string, false otherwise.
 */
export function fuzzyMatch(pattern: string, text: string): boolean {
    if (pattern.length === 0) {
        return true;
    }
    if (text.length === 0) {
        return false;
    }

    pattern = pattern.toLowerCase();
    text = text.toLowerCase();

    let patternIdx = 0;
    let textIdx = 0;

    while (patternIdx < pattern.length && textIdx < text.length) {
        if (pattern[patternIdx] === text[textIdx]) {
            patternIdx++;
        }
        textIdx++;
    }

    return patternIdx === pattern.length;
}

/**
 * Calculates a fuzzy match score (lower is better, meaning closer match).
 * Returns Infinity if it's not a fuzzy match.
 *
 * Ideal for sorting search results.
 * This particular algorithm rewards matches that are closer to the beginning of the string,
 * and matches where the matching characters are close together.
 */
export function fuzzyMatchScore(pattern: string, text: string): number {
    if (!fuzzyMatch(pattern, text)) {
        return Infinity;
    }

    if (pattern.length === 0) {
        return 0;
    }

    pattern = pattern.toLowerCase();
    text = text.toLowerCase();

    // Find the first index where the pattern starts matching
    const firstMatchIdx = text.indexOf(pattern[0]);
    if (firstMatchIdx === -1) return Infinity; // shouldn't happen based on fuzzyMatch check

    let score = firstMatchIdx; // penalty for starting later
    let patternIdx = 0;
    let textIdx = firstMatchIdx;
    let lastMatchIdx = firstMatchIdx;

    while (patternIdx < pattern.length && textIdx < text.length) {
        if (pattern[patternIdx] === text[textIdx]) {
            // add penalty for gaps between matched characters
            const gap = textIdx - lastMatchIdx - 1;
            if (gap > 0) {
                score += gap * 2;
            }
            lastMatchIdx = textIdx;
            patternIdx++;
        }
        textIdx++;
    }

    return score;
}
