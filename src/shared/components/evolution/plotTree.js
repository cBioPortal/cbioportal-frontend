import * as d3 from 'd3';

export const drawTreePlot = (function (component, data) {

    const div = component;

    let height = 300,
        width = 500,
        margin = 20;

    const svg = d3.select(div).append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g');

    const r = 5;

    let x1 = r + margin,
        y1 = height / 2 - r / 2;
    svg.append('circle')
        .attr('cx', x1)
        .attr('cy', y1)
        .attr('r', r)
        .style('fill', 'red');

    var d = 10 * 20,
        x2 = x1 + d,
        y2 = y1;
    svg.append('circle')
        .attr('cx', x2)
        .attr('cy', y2)
        .attr('r', r)
        .style('fill', 'red');

    svg.append('g')
        .attr('class', 'line')
        .append('line')
        .attr('id', 'cluster0')
        .attr('x1', x1)
        .attr('x2', x2)
        .attr('y1', y1)
        .attr('y2', y2)
        .attr('stroke-width', 5)
        .attr('stroke', 'black')
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);

    var d = 3 * 20,
        x3 = x2 + d * Math.sin(3.14 / 6),
        y3 = y2 + d * Math.cos(3.14 / 3);
    svg.append('circle')
        .attr('cx', x3)
        .attr('cy', y3)
        .attr('r', r)
        .style('fill', 'red');

    svg.append('g')
        .attr('class', 'line')
        .append('line')
        .attr('id', 'cluster1')
        .attr('x1', x2)
        .attr('x2', x3)
        .attr('y1', y2)
        .attr('y2', y3)
        .attr('stroke-width', 5)
        .attr('stroke', 'black')
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);


    var d = 1 * 20,
        x4 = x2 + d * Math.sin(3.14 / 6),
        y4 = y2 - d * Math.cos(3.14 / 3);
    svg.append('circle')
        .attr('cx', x4)
        .attr('cy', y4)
        .attr('r', r)
        .style('fill', 'red');

    svg.append('g')
        .attr('class', 'line')
        .append('line')
        .attr('id', 'cluster4')
        .attr('x1', x2)
        .attr('x2', x4)
        .attr('y1', y2)
        .attr('y2', y4)
        .attr('stroke-width', 5)
        .attr('stroke', 'black')
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);

    var d = 1 * 20,
        x5 = x4 + d * Math.sin(3.14 / 6),
        y5 = y4 - d * Math.cos(3.14 / 3);
    svg.append('circle')
        .attr('cx', x5)
        .attr('cy', y5)
        .attr('r', r)
        .style('fill', 'red');

    svg.append('g')
        .attr('class', 'line')
        .append('line')
        .attr('id', 'cluster4')
        .attr('x1', x4)
        .attr('x2', x5)
        .attr('y1', y4)
        .attr('y2', y5)
        .attr('stroke-width', 5)
        .attr('stroke', 'black')
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);


    var d = 6 * 20,
        x6 = x5 + d * Math.sin(3.14 / 6),
        y6 = y5 - d * Math.cos(3.14 / 3);
    svg.append('circle')
        .attr('cx', x6)
        .attr('cy', y6)
        .attr('r', r)
        .style('fill', 'red');

    svg.append('g')
        .attr('class', 'line')
        .append('line')
        .attr('id', 'cluster2')
        .attr('x1', x5)
        .attr('x2', x6)
        .attr('y1', y5)
        .attr('y2', y6)
        .attr('stroke-width', 5)
        .attr('stroke', 'black')
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);

    function handleMouseOver() {
        const class_name = $(this).attr('id');
//        $(`tr.${class_name}`).css({ background: 'red' });
    }


    function handleMouseOut() {
//        const class_name = $(this).attr('id');
//        $(`tr.${class_name}`).css({ background: 'white' });
    }
    return div;
});

