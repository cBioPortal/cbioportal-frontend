const MAX_PARAGRAPH_LENGTH = 300;

export default function parseNews(html: string) {
    const contentItems = $(html)
        .find('#docs-content')
        .children()
        .filter((i, el) => {
            return /^...-\d{1,2}-\d\d\d\d/.test(el.id) || el.tagName === 'UL';
        });

    contentItems.each((i, el) => {
        // Set target="_blank" for all links
        $(el).find('a').attr('target', '_blank');

        // Check if this item has tables before removing them
        const hasTables = $(el).find('table').length > 0;

        // Remove or hide tables as they don't render well in the news feed
        $(el).find('table').remove();

        // Remove images as they show "image" text and don't render well
        $(el).find('img').remove();

        // Also remove any paragraph or element that contains only "image" text
        $(el)
            .find('p, div, span')
            .each((k, elem) => {
                const $elem = $(elem);
                const text = $elem.text().trim().toLowerCase();
                if (text === 'image') {
                    $elem.remove();
                }
            });

        // Add "Read more" link only for items that had tables (since they're now removed)
        if (hasTables && /^...-\d{1,2}-\d\d\d\d/.test(el.id)) {
            const newsUrl = `https://docs.cbioportal.org/news/#${el.id}`;
            const readMoreLink = `<p style="margin: 10px 0 0 0; font-size: 12px;"><a href="${newsUrl}" target="_blank" style="color: #2986e2; text-decoration: none;">(Read more)</a></p>`;
            $(el).append(readMoreLink);
        }

        // Truncate long paragraphs to improve readability
        $(el)
            .find('p')
            .each((j, p) => {
                const $p = $(p);
                const text = $p.text();
                if (text.length > MAX_PARAGRAPH_LENGTH) {
                    // Truncate text content only, preserving simple HTML structure
                    const html = $p.html() || '';
                    if (html.length > MAX_PARAGRAPH_LENGTH) {
                        // Simple truncation - remove complex elements but preserve links
                        const truncated = text.substring(
                            0,
                            MAX_PARAGRAPH_LENGTH
                        );
                        const lastSpace = truncated.lastIndexOf(' ');
                        const finalText =
                            lastSpace > 0
                                ? truncated.substring(0, lastSpace)
                                : truncated;
                        $p.text(finalText + '...');
                    }
                }
            });
    });

    return $('<div/>').append(contentItems).html();
}
