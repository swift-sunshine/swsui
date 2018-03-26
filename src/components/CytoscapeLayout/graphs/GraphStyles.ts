export class GraphStyles {
  static options() {
    return { wheelSensitivity: 0.1, autounselectify: false };
  }

  static styles() {
    return [
      {
        selector: 'node',
        css: {
          content: (ele: any) => {
            return ele.data('text') || ele.data('id');
          },
          color: '#030303', // pf-black
          'background-color': '#f9d67a', // pf-gold-200
          'border-width': '1px',
          'border-color': '#030303', // pf-black
          'font-size': '10px',
          'text-valign': 'center',
          'text-halign': 'center',
          'text-outline-color': '#f9d67a',
          'text-outline-width': '2px',
          'text-wrap': 'wrap',
          'overlay-padding': '6px',
          'z-index': '10'
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': '3px',
          'border-color': '#0088ce' // pf-blue
        }
      },
      {
        // version group boxes
        selector: '$node > node',
        css: {
          'padding-top': '5px',
          'padding-left': '5px',
          'padding-bottom': '5px',
          'padding-right': '5px',
          'text-valign': 'top',
          'text-halign': 'center',
          'background-color': '#fbeabc', // pf-gold-100
          'border-color': '#b58100', // pf-gold-500
          'border-width': '2px'
        }
      },
      {
        // versioned node in a group
        selector: 'node > $node',
        css: {
          'border-color': '#b58100', // pf-gold-500
          'border-width': '2px'
        }
      },
      {
        selector: 'edge',
        css: {
          width: 3,
          'font-size': '9px',
          'text-margin-x': '10px',
          'text-rotation': 'autorotate',
          content: 'data(text)',
          'target-arrow-shape': 'vee',
          'line-color': 'data(color)',
          'target-arrow-color': '#030303', // pf-black
          'curve-style': 'bezier'
        }
      },
      {
        selector: 'edge:selected',
        css: {
          'line-color': '#0088ce', // pf-blue
          'target-arrow-color': '#0088ce', // pf-blue
          'source-arrow-color': '#0088ce' // pf-blue
        }
      },
      // When you mouse over a node, all nodes other than the moused over node
      // and its direct incoming/outgoing edges/nodes are dimmed by these styles.
      {
        selector: 'node.mousedim',
        style: {
          opacity: '0.3'
        }
      },
      {
        selector: 'edge.mousedim',
        style: {
          opacity: '0.3'
        }
      }
    ];
  }
}
