import * as React from 'react';
import { Button, DropdownButton, Icon, MenuItem, OverlayTrigger, Popover } from 'patternfly-react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { serviceGraphFilterActions } from '../actions/ServiceGraphFilterActions';
import { KialiAppState, ServiceGraphFilterState } from '../store/Store';
import { style } from 'typestyle';
import GraphFilter from '../components/GraphFilter/GraphFilter';

interface ServiceGraphDispatch {
  // Dispatch methods
  toggleLegend(): void;
  toggleGraphNodeLabels(): void;
  toggleGraphCircuitBreakers(): void;
  toggleGraphRouteRules(): void;
  toggleGraphMissingSidecars(): void;
  toggleTrafficAnimation(): void;
  setGraphEdgeLabelMode(edgeMode: any): void;
}

// inherit all of our Reducer state section  and Dispatch methods for redux
type GraphLayersProps = ServiceGraphDispatch & ServiceGraphFilterState;

// Allow Redux to map sections of our global app state to our props
const mapStateToProps = (state: KialiAppState) => ({
  showLegend: state.serviceGraph.filterState.showLegend,
  showNodeLabels: state.serviceGraph.filterState.showNodeLabels,
  edgeLabelMode: state.serviceGraph.filterState.edgeLabelMode,
  showCircuitBreakers: state.serviceGraph.filterState.showCircuitBreakers,
  showRouteRules: state.serviceGraph.filterState.showRouteRules,
  showMissingSidecars: state.serviceGraph.filterState.showMissingSidecars,
  showTrafficAnimation: state.serviceGraph.filterState.showTrafficAnimation
});

// Map our actions to Redux
const mapDispatchToProps = (dispatch: any) => {
  return {
    toggleLegend: bindActionCreators(serviceGraphFilterActions.toggleLegend, dispatch),
    toggleGraphNodeLabels: bindActionCreators(serviceGraphFilterActions.toggleGraphNodeLabel, dispatch),
    setGraphEdgeLabelMode: bindActionCreators(serviceGraphFilterActions.setGraphEdgeLabelMode, dispatch),
    toggleGraphCircuitBreakers: bindActionCreators(serviceGraphFilterActions.toggleGraphCircuitBreakers, dispatch),
    toggleGraphRouteRules: bindActionCreators(serviceGraphFilterActions.toggleGraphRouteRules, dispatch),
    toggleGraphMissingSidecars: bindActionCreators(serviceGraphFilterActions.toggleGraphMissingSidecars, dispatch),
    toggleTrafficAnimation: bindActionCreators(serviceGraphFilterActions.toggleTrafficAnimation, dispatch)
  };
};

interface VisibilityLayersType {
  id: string;
  labelText: string;
  value: boolean;
  onChange: () => void;
}

// Show/Hide Graph Visibility Layers -- there will be many
// Right now it is a toolbar with Switch Buttons -- this will change once with UXD input
export const GraphLayers: React.SFC<GraphLayersProps> = props => {
  // map our attributes from redux
  const {
    showLegend,
    showCircuitBreakers,
    showRouteRules,
    showNodeLabels,
    edgeLabelMode,
    showMissingSidecars,
    showTrafficAnimation
  } = props;
  // // map or dispatchers for redux
  const {
    toggleLegend,
    toggleGraphCircuitBreakers,
    toggleGraphRouteRules,
    toggleGraphNodeLabels,
    setGraphEdgeLabelMode,
    toggleGraphMissingSidecars,
    toggleTrafficAnimation
  } = props;

  const visibilityLayers: VisibilityLayersType[] = [
    {
      id: 'toggleLegend',
      labelText: 'Legend',
      value: showLegend,
      onChange: toggleLegend
    },
    {
      id: 'filterCB',
      labelText: 'Circuit Breakers',
      value: showCircuitBreakers,
      onChange: toggleGraphCircuitBreakers
    },
    {
      id: 'filterRR',
      labelText: 'Route Rules',
      value: showRouteRules,
      onChange: toggleGraphRouteRules
    },
    {
      id: 'filterNodes',
      labelText: 'Node Labels',
      value: showNodeLabels,
      onChange: toggleGraphNodeLabels
    },
    {
      id: 'filterSidecars',
      labelText: 'Missing Sidecars',
      value: showMissingSidecars,
      onChange: toggleGraphMissingSidecars
    },
    {
      id: 'filterTrafficAnimation',
      labelText: 'Traffic Animation',
      value: showTrafficAnimation,
      onChange: toggleTrafficAnimation
    }
  ];

  const checkboxStyle = style({ marginLeft: 5 });
  const toggleItems = visibilityLayers.map((item: VisibilityLayersType) => (
    <div id={item.id} key={item.id}>
      <label>
        <input type="checkbox" checked={item.value} onChange={() => item.onChange()} />
        <span className={checkboxStyle}>{item.labelText}</span>
      </label>
    </div>
  ));

  const edgeLabelChangeHandler = (key: string) => {
    setGraphEdgeLabelMode(key);
  };

  const edgeItems = Object.keys(GraphFilter.EDGE_LABEL_MODES).map((edgeLabelModeKey: any) => (
    <MenuItem active={edgeLabelModeKey === edgeLabelMode} key={edgeLabelModeKey} eventKey={edgeLabelModeKey}>
      {GraphFilter.EDGE_LABEL_MODES[edgeLabelModeKey]}
    </MenuItem>
  ));

  const popover = (
    <Popover id="layers-popover" title={'Graph Filters'} style={{ width: '300px' }}>
      {toggleItems}
      <div>
        <label>Edge Labels:</label>
      </div>
      <div>
        <DropdownButton
          id="graph_filter_edges"
          bsStyle="default"
          title={GraphFilter.EDGE_LABEL_MODES[edgeLabelMode]}
          onSelect={edgeLabelChangeHandler}
        >
          {edgeItems}
        </DropdownButton>
      </div>
    </Popover>
  );

  return (
    <OverlayTrigger overlay={popover} placement="bottom" trigger={['click']} rootClose={true}>
      <Button>
        <Icon name="filter" />
      </Button>
    </OverlayTrigger>
  );
};

// hook up to Redux for our State to be mapped to props
const GraphLayersContainer = connect(mapStateToProps, mapDispatchToProps)(GraphLayers);
export default GraphLayersContainer;
