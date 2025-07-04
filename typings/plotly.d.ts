declare module 'plotly.js-gl2d-dist' {
  export = Plotly;
  
  namespace Plotly {
    interface Layout {
      title?: { text?: string };
      xaxis?: { title?: { text?: string } };
      yaxis?: { title?: { text?: string } };
      autosize?: boolean;
      margin?: { l?: number; r?: number; t?: number; b?: number };
      plot_bgcolor?: string;
      paper_bgcolor?: string;
      hovermode?: string;
    }
    
    interface Config {
      displayModeBar?: boolean;
      displaylogo?: boolean;
      responsive?: boolean;
      toImageButtonOptions?: {
        format?: 'png' | 'jpeg' | 'svg' | 'pdf';
        filename?: string;
        height?: number;
        width?: number;
        scale?: number;
      };
    }
    
    function newPlot(div: HTMLElement, data: any[], layout?: Partial<Layout>, config?: Partial<Config>): void;
    function purge(div: HTMLElement): void;
  }
}