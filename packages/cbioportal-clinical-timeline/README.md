# cBioPortal Clinical Timeline

The Clinical Timeline is a React component for visualizing patient clinical timelines extracted from the cBioPortal cancer genomics platform. It provides an interactive visualization of clinical events, treatments, and samples along a chronological timeline, enabling researchers to understand how a patient's disease changes over time.


## Features

- Chronological visualization of patient clinical events across multiple tracks
- Interactive zooming and navigation capabilities
- Tooltips for detailed event information
- Collapsible/expandable hierarchical track structure
- Support for point events and range (duration) events
- Custom event rendering and coloring
- Export to PDF, PNG, SVG, or raw data formats
- Line chart visualization for numeric values over time

## Installation

```bash
npm install cbioportal-clinical-timeline
# or
yarn add cbioportal-clinical-timeline
```

## Basic Usage

Here's how to use the clinical timeline component in a React application:

```jsx
import React, { useEffect, useState } from 'react';
import { Timeline, TimelineStore } from 'cbioportal-clinical-timeline';


import 'cbioportal-clinical-timeline/dist/styles.css';

function App() {
  
  const [store, setStore] = useState(null);

  useEffect(() => {
    
    const tracks = [
      {
        type: 'TREATMENT',
        label: 'Treatments',
        items: [
          {
            start: 0, 
            end: 120,
            eventType: 'TREATMENT',
            attributes: [
              { key: 'AGENT', value: 'Temozolomide' },
              { key: 'DOSE', value: '150mg/m²' }
            ]
          }
        ]
      },
      {
        type: 'SPECIMEN',
        label: 'Samples',
        items: [
          {
            start: 0,
            end: 0, 
            eventType: 'SPECIMEN',
            attributes: [
              { key: 'SAMPLE_ID', value: 'P-0001-T1' },
              { key: 'STATUS', value: 'Primary Diagnosis' }
            ]
          }
        ]
      }
    ];

    
    setStore(new TimelineStore(tracks));
  }, []);

  
  const handleDownload = () => {
    console.log('Download data');
    
  };

  return (
    
      Patient Clinical Timeline
      
        {store && (
          
        )}
      
    
  );
}

export default App;
```

## Data Model

### Track Structure

The timeline visualization is organized into tracks, each containing related events. Tracks can be nested to create hierarchical organization.

```typescript
interface TimelineTrackSpecification {
  // Required fields
  type: string;        // Track identifier (e.g., 'TREATMENT', 'SPECIMEN')
  items: TimelineEvent[]; // Events to display on this track

  // Optional fields
  label?: string;      // Display name (defaults to type if not provided)
  tracks?: TimelineTrackSpecification[]; // Nested tracks (for hierarchical structure)
  trackType?: TimelineTrackType; // Visualization style ('default' or 'LINE_CHART')
  trackConf?: ITrackEventConfig; // Track-specific configuration
  
  // Custom renderers
  renderEvents?: (events: TimelineEvent[], y: number) => JSX.Element | null;
  renderTooltip?: (event: TimelineEvent) => JSX.Element | null;
  sortSimultaneousEvents?: (events: TimelineEvent[]) => TimelineEvent[];
}
```

### Event Structure

Events are the individual data points displayed on the timeline.

```typescript
interface TimelineEvent {
  // Required fields
  start: number;       // Start day/time (relative to diagnosis date)
  end?: number;        // End day/time (for range events; use same as start for point events)
  eventType: string;   // Type of event (e.g., 'TREATMENT', 'SPECIMEN', 'STATUS')
  
  // Event metadata
  attributes: Array;
  
  // Special attributes
  // Use STYLE_COLOR and STYLE_SHAPE attributes to customize event appearance
  // Example: { key: 'STYLE_COLOR', value: '#ff0000' }
}
```

## API Reference

### Timeline Component Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `store` | TimelineStore | Yes | - | Instance of TimelineStore containing track data |
| `width` | number | Yes | - | Width of the timeline component in pixels |
| `onClickDownload` | function | Yes | - | Callback function for the download button |
| `customTracks` | CustomTrackSpecification[] | No | [] | Additional custom tracks to display |
| `hideLabels` | boolean | No | false | When true, hides track labels |
| `visibleTracks` | string[] | No | undefined | Array of track types to display (others will be hidden) |
| `hideXAxis` | boolean | No | false | When true, hides the X-axis |
| `disableZoom` | boolean | No | false | When true, disables zoom functionality |
| `headerWidth` | number | No | - | Width of the track header section |

### TimelineStore

The TimelineStore manages timeline state and data. Initialize it with an array of track specifications:

```javascript
const store = new TimelineStore(tracks);
```

Key methods and properties:

| Method/Property | Description |
|----------------|-------------|
| `data` | Access to the processed track data |
| `setZoomBounds(start, end)` | Set the visible time range |
| `toggleTrackCollapse(trackId)` | Collapse/expand a track |
| `isTrackCollapsed(trackId)` | Check if a track is collapsed |
| `enableCollapseTrack` | Toggle to enable/disable track collapsing |

### Custom Track Specification

For advanced use cases, you can create custom tracks with your own rendering logic:

```typescript
interface CustomTrackSpecification {
  renderHeader: (store: TimelineStore) => React.ReactNode;
  renderTrack: (store: TimelineStore) => React.ReactElement;
  height: (store: TimelineStore) => number;
  labelForExport: string;
  disableHover?: boolean;
}
```

## Advanced Usage

### Custom Event Coloring

You can customize event colors by adding a special attribute:

```javascript
{
  // ...event data
  attributes: [
    
    { key: 'AGENT', value: 'Temozolomide' },
    
    { key: 'STYLE_COLOR', value: '#E41A1C' }
  ]
}
```

### Custom Track Configuration

```javascript

const trackConfig = {
  trackEventRenderers: [
    {
      trackTypeMatch: /TREATMENT/i,
      configureTrack: (track) => {
        // Custom configuration for treatment tracks
      },
      legend: [
        { label: 'Chemotherapy', color: '#E41A1C' },
        { label: 'Targeted Therapy', color: '#377EB8' }
      ],
      eventColorGetter: (event) => {
        /
        return getAttributeValue('TREATMENT_TYPE', event) === 'Chemotherapy' 
          ? '#E41A1C' 
          : '#377EB8';
      }
    }
  ]
};
```

### Line Chart Visualization

For numeric values over time, you can use the line chart track type:

```javascript
{
  type: 'LAB_TEST',
  label: 'Lab Values',
  trackType: 'LINE_CHART',
  items: [
    {
      start: 0,
      end: 0,
      eventType: 'LAB_TEST',
      attributes: [
        { key: 'TEST', value: 'WBC' },
        { key: 'VALUE', value: '5.3' },
        { key: 'UNIT', value: 'K/µL' }
      ]
    }
    // More data points...
  ],
  getLineChartValue: (event) => {
    return parseFloat(getAttributeValue('VALUE', event));
  }
}
```

### Event Tooltip Customization

You can provide custom tooltip rendering logic:

```javascript
{
  // ...track data
  renderTooltip: (event) => {
    return (
      
        {getAttributeValue('AGENT', event)}
        Dose: {getAttributeValue('DOSE', event)}
        Duration: {formatDuration(event.start, event.end)}
      
    );
  }
}
```

## User Interactions

The Clinical Timeline component supports several user interactions:

- **Zoom**: Click and drag horizontally to select a region to zoom into
- **Reset Zoom**: Click the "reset zoom" button to return to the full timeline view
- **Tooltips**: Hover over events to see detailed information
- **Pin Tooltips**: Click on an event to pin its tooltip (click again to unpin)
- **Navigate Events**: Use left/right arrow keys to navigate between events at the same position
- **Collapse/Expand Tracks**: Click on the arrow icon next to a track label to collapse/expand nested tracks

## Contributing

Contributions to the Clinical Timeline component are welcome!

1. Fork the repository: https://github.com/cBioPortal/cbioportal-frontend
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/cbioportal-frontend.git`
3. Navigate to the package directory: `cd packages/cbioportal-clinical-timeline`
4. Install dependencies: `yarn install`
5. Make your changes
6. Test your changes
7. Submit a pull request

Please follow the existing code style and include appropriate tests for your changes.

## Acknowledgments

- This component was developed as part of the [cBioPortal project](https://github.com/cBioPortal/cbioportal)
