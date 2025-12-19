export default function parseNews(html: string) {
    const contentItems = $(html)
        .find('#docs-content')
        .children()
        .filter((i, el) => {
            return /^...-\d{1,2}-\d\d\d\d/.test(el.id) || el.tagName === 'UL';
        });

    contentItems.each((i, el) => {
        // Set target="_blank" for all links
        $(el)
            .find('a')
            .attr('target', '_blank');

        // Remove or hide tables as they don't render well in the news feed
        $(el)
            .find('table')
            .remove();

        // Truncate long paragraphs to improve readability
        $(el)
            .find('p')
            .each((j, p) => {
                const $p = $(p);
                const text = $p.text();
                if (text.length > 300) {
                    // Truncate and add ellipsis
                    $p.text(text.substring(0, 300) + '...');
                }
            });
    });

    return $('<div/>')
        .append(contentItems)
        .html();
}
