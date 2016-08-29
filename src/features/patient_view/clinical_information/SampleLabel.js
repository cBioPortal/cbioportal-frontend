import React from 'react';

export default class SampleLabel extends React.Component {
  constructor(props) {
    super(props)
    this.render = this.render.bind(this)
  }

  render() {
    const { label, color, x, y } = this.props
    return <g>
             <circle cx={x} cy={y} fill={color} r={10}></circle>
             <text x={x} y={y+5} fill={'white'} fontSize={10} textAnchor={'middle'}>{label}</text>
           </g>
  }
} 

SampleLabel.propTypes = {
  label: React.PropTypes.string.isRequired,
  color: React.PropTypes.string.isRequired,
  x: React.PropTypes.number.isRequired,
  y: React.PropTypes.number.isRequired,
}
