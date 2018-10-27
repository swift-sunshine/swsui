import graphFilterState from '../GraphFilterState';
import { GraphFilterActionKeys } from '../../actions/GraphFilterActions';

describe('GraphFilterState reducer', () => {
  it('should return the initial state', () => {
    expect(graphFilterState(undefined, {})).toEqual({
      showLegend: false,
      showNodeLabels: true,
      showCircuitBreakers: true,
      showVirtualServices: true,
      showMissingSidecars: true,
      showSecurity: false,
      showTrafficAnimation: false,
      showServiceNodes: false,
      showUnusedNodes: false,
      graphLayout: 'dagre'
    });
  });

  it('should handle TOGGLE_LEGEND', () => {
    expect(
      graphFilterState(
        {
          showLegend: false,
          showNodeLabels: true,
          showCircuitBreakers: false,
          showVirtualServices: true,
          showMissingSidecars: true,
          showSecurity: false,
          showTrafficAnimation: false,
          showServiceNodes: false,
          showUnusedNodes: false,
          graphLayout: 'dagre'
        },
        {
          type: GraphFilterActionKeys.TOGGLE_LEGEND
        }
      )
    ).toEqual({
      showLegend: true,
      showNodeLabels: true,
      showCircuitBreakers: false,
      showVirtualServices: true,
      showMissingSidecars: true,
      showSecurity: false,
      showTrafficAnimation: false,
      showServiceNodes: false,
      showUnusedNodes: false,
      graphLayout: 'dagre'
    });
  });

  it('should handle TOGGLE_GRAPH_NODE_LABEL', () => {
    expect(
      graphFilterState(
        {
          showLegend: false,
          showNodeLabels: true,
          showCircuitBreakers: false,
          showVirtualServices: true,
          showMissingSidecars: true,
          showSecurity: false,
          showTrafficAnimation: false,
          showServiceNodes: false,
          showUnusedNodes: false,
          graphLayout: 'dagre'
        },
        {
          type: GraphFilterActionKeys.TOGGLE_GRAPH_NODE_LABEL
        }
      )
    ).toEqual({
      showLegend: false,
      showNodeLabels: false,
      showCircuitBreakers: false,
      showVirtualServices: true,
      showMissingSidecars: true,
      showSecurity: false,
      showTrafficAnimation: false,
      showServiceNodes: false,
      showUnusedNodes: false,
      graphLayout: 'dagre'
    });
  });

  it('should handle TOGGLE_GRAPH_CIRCUIT_BREAKERS', () => {
    expect(
      graphFilterState(
        {
          showLegend: false,
          showNodeLabels: true,
          showCircuitBreakers: false,
          showVirtualServices: true,
          showMissingSidecars: true,
          showSecurity: false,
          showTrafficAnimation: false,
          showServiceNodes: false,
          showUnusedNodes: false,
          graphLayout: 'dagre'
        },
        {
          type: GraphFilterActionKeys.TOGGLE_GRAPH_CIRCUIT_BREAKERS
        }
      )
    ).toEqual({
      showLegend: false,
      showNodeLabels: true,
      showCircuitBreakers: true,
      showVirtualServices: true,
      showMissingSidecars: true,
      showSecurity: false,
      showTrafficAnimation: false,
      showServiceNodes: false,
      showUnusedNodes: false,
      graphLayout: 'dagre'
    });
  });
  it('should handle TOGGLE_GRAPH_VIRTUAL_SERVICES', () => {
    expect(
      graphFilterState(
        {
          showLegend: false,
          showNodeLabels: true,
          showCircuitBreakers: false,
          showVirtualServices: true,
          showMissingSidecars: true,
          showSecurity: false,
          showTrafficAnimation: false,
          showServiceNodes: false,
          showUnusedNodes: false,
          graphLayout: 'dagre'
        },
        {
          type: GraphFilterActionKeys.TOGGLE_GRAPH_VIRTUAL_SERVICES
        }
      )
    ).toEqual({
      showLegend: false,
      showNodeLabels: true,
      showCircuitBreakers: false,
      showVirtualServices: false,
      showMissingSidecars: true,
      showSecurity: false,
      showTrafficAnimation: false,
      showServiceNodes: false,
      showUnusedNodes: false,
      graphLayout: 'dagre'
    });
  });
  it('should handle TOGGLE_GRAPH_MISSING_SIDECARS', () => {
    expect(
      graphFilterState(
        {
          showLegend: false,
          showNodeLabels: true,
          showCircuitBreakers: false,
          showVirtualServices: true,
          showMissingSidecars: true,
          showSecurity: false,
          showTrafficAnimation: false,
          showServiceNodes: false,
          showUnusedNodes: false,
          graphLayout: 'dagre'
        },
        {
          type: GraphFilterActionKeys.TOGGLE_GRAPH_MISSING_SIDECARS
        }
      )
    ).toEqual({
      showLegend: false,
      showNodeLabels: true,
      showCircuitBreakers: false,
      showVirtualServices: true,
      showMissingSidecars: false,
      showSecurity: false,
      showTrafficAnimation: false,
      showServiceNodes: false,
      showUnusedNodes: false,
      graphLayout: 'dagre'
    });
  });
  it('should handle TOGGLE_GRAPH_SECURITY', () => {
    expect(
      graphFilterState(
        {
          showLegend: false,
          showNodeLabels: true,
          showCircuitBreakers: false,
          showVirtualServices: true,
          showMissingSidecars: true,
          showSecurity: false,
          showTrafficAnimation: false,
          showServiceNodes: false,
          showUnusedNodes: false,
          graphLayout: 'dagre'
        },
        {
          type: GraphFilterActionKeys.TOGGLE_GRAPH_SECURITY
        }
      )
    ).toEqual({
      showLegend: false,
      showNodeLabels: true,
      showCircuitBreakers: false,
      showVirtualServices: true,
      showMissingSidecars: true,
      showSecurity: true,
      showTrafficAnimation: false,
      showServiceNodes: false,
      showUnusedNodes: false,
      graphLayout: 'dagre'
    });
  });
  it('should handle TOGGLE_TRAFFIC_ANIMATION', () => {
    expect(
      graphFilterState(
        {
          showLegend: false,
          showNodeLabels: true,
          showCircuitBreakers: false,
          showVirtualServices: true,
          showMissingSidecars: true,
          showSecurity: false,
          showTrafficAnimation: false,
          showServiceNodes: false,
          showUnusedNodes: false,
          graphLayout: 'dagre'
        },
        {
          type: GraphFilterActionKeys.TOGGLE_TRAFFIC_ANIMATION
        }
      )
    ).toEqual({
      showLegend: false,
      showNodeLabels: true,
      showCircuitBreakers: false,
      showVirtualServices: true,
      showMissingSidecars: true,
      showSecurity: false,
      showTrafficAnimation: true,
      showServiceNodes: false,
      showUnusedNodes: false,
      graphLayout: 'dagre'
    });
  });
  it('should handle TOGGLE_SERVICE_NODES', () => {
    expect(
      graphFilterState(
        {
          showLegend: false,
          showNodeLabels: true,
          showCircuitBreakers: false,
          showVirtualServices: true,
          showMissingSidecars: true,
          showSecurity: false,
          showTrafficAnimation: false,
          showServiceNodes: false,
          showUnusedNodes: false,
          graphLayout: 'dagre'
        },
        {
          type: GraphFilterActionKeys.TOGGLE_SERVICE_NODES
        }
      )
    ).toEqual({
      showLegend: false,
      showNodeLabels: true,
      showCircuitBreakers: false,
      showVirtualServices: true,
      showMissingSidecars: true,
      showSecurity: false,
      showTrafficAnimation: false,
      showServiceNodes: true,
      showUnusedNodes: false,
      graphLayout: 'dagre'
    });
  });
  it('should handle TOGGLE_UNUSED_NODES', () => {
    expect(
      graphFilterState(
        {
          showLegend: false,
          showNodeLabels: true,
          showCircuitBreakers: false,
          showVirtualServices: true,
          showMissingSidecars: true,
          showSecurity: false,
          showTrafficAnimation: false,
          showServiceNodes: false,
          showUnusedNodes: false,
          graphLayout: 'dagre'
        },
        {
          type: GraphFilterActionKeys.TOGGLE_UNUSED_NODES
        }
      )
    ).toEqual({
      showLegend: false,
      showNodeLabels: true,
      showCircuitBreakers: false,
      showVirtualServices: true,
      showMissingSidecars: true,
      showSecurity: false,
      showTrafficAnimation: false,
      showServiceNodes: false,
      showUnusedNodes: true,
      graphLayout: 'dagre'
    });
  });
  it('should handle SET_GRAPH_REFRESH_RATE', () => {
    expect(
      graphFilterState(
        {
          showLegend: false,
          showNodeLabels: true,
          showCircuitBreakers: false,
          showVirtualServices: true,
          showMissingSidecars: true,
          showSecurity: false,
          showTrafficAnimation: false,
          showServiceNodes: false,
          showUnusedNodes: false,
          graphLayout: 'dagre'
        },
        {
          type: GraphFilterActionKeys.SET_GRAPH_REFRESH_RATE,
          payload: 10000
        }
      )
    ).toEqual({
      showLegend: false,
      showNodeLabels: true,
      showCircuitBreakers: false,
      showVirtualServices: true,
      showMissingSidecars: true,
      showSecurity: false,
      showTrafficAnimation: false,
      showServiceNodes: false,
      showUnusedNodes: false,
      graphLayout: 'dagre'
    });
  });
});
