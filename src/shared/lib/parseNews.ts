export default function parseNews(html: string) {
    const contentItems = $(html)
        .find('#docs-content')
        .children()
        .filter((i, el) => {
            return /^...-\d{1,2}-\d\d\d\d/.test(el.id) || el.tagName === 'UL';
        });

    contentItems.each((i, el) => {
        $(el)
            .find('a')
            .attr('target', '_blank');
    });

    return $('<div/>')
        .append(contentItems)
        .html();
}
