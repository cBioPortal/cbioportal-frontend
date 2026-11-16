/** Block label without a leading "Block", which some sources already include. */
export function blockName(label: string): string {
    return label.replace(/^block\s+/i, '');
}

/**
 * De-identified exports replace the part description with a "Part <n>" ordinal
 * ("Specimen <n>" before 2026-10-21) that equals the part number; it names no
 * anatomical site.
 */
export function isGeneratedPartDescription(
    description: string | null | undefined
): boolean {
    return !!description && /^(specimen|part) \d+$/i.test(description.trim());
}

/** The part description when it is a real one, otherwise null. */
export function realPartDescription(
    description: string | null | undefined
): string | null {
    return description && !isGeneratedPartDescription(description)
        ? description
        : null;
}

/** How the UI names a slide's part: "Part <n>", or its real description. */
export function partDisplayName(slide: {
    part_number?: string | null;
    part_description?: string | null;
}): string | null {
    if (slide.part_number) return `Part ${slide.part_number}`;
    return realPartDescription(slide.part_description);
}
