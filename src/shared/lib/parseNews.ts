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

        // Remove or hide tables as they don't render well in the news feed
        $(el).find('table').remove();

        // Add "Read more" link to each news item (h2 headers with date IDs)
        if (/^...-\d{1,2}-\d\d\d\d/.test(el.id)) {
            const newsUrl = `https://docs.cbioportal.org/news/#${el.id}`;
            const readMoreLink = `<div style="text-align: right; margin-top: 5px; font-size: 12px;"><a href="${newsUrl}" target="_blank" style="color: #2986e2;">(Read more)</a></div>`;
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
