import * as React from 'react';
import { Card, CardBody, Grid, GridItem, Tab } from '@patternfly/react-core';
import * as AlertUtils from '../../utils/AlertUtils';
import {
  GraphDefinition,
  GraphEdgeWrapper,
  GraphNodeData,
  NodeType,
  DestService,
  ProtocolTraffic
} from '../../types/Graph';
import { RenderComponentScroll } from '../../components/Nav/Page';
import { MetricsObjectTypes } from '../../types/Metrics';
import GraphDataSource from 'services/GraphDataSource';
import { DurationInSeconds } from 'types/Common';
import { RightActionBar } from 'components/RightActionBar/RightActionBar';
import TimeControlsContainer from '../Time/TimeControls';

type AppProps = {
  itemType: MetricsObjectTypes.APP;
  namespace: string;
  appName: string;
};

type ServiceProps = {
  itemType: MetricsObjectTypes.SERVICE;
  namespace: string;
  serviceName: string;
};

type WorkloadProps = {
  itemType: MetricsObjectTypes.WORKLOAD;
  namespace: string;
  workloadName: string;
};

type TrafficDetailsProps = {
  duration: DurationInSeconds;
  itemName: string;
  itemType: MetricsObjectTypes;
  namespace: string;
};

type TrafficDetailsState = {
  inboundTraffic: TrafficItem[];
  outboundTraffic: TrafficItem[];
};

class TrafficDetails extends React.Component<TrafficDetailsProps, TrafficDetailsState> {
  private graphDataSource = new GraphDataSource();

  constructor(props: TrafficDetailsProps) {
    super(props);
    this.state = {
      inboundTraffic: [],
      outboundTraffic: []
    };
  }

  componentDidMount() {
    this.graphDataSource.on('fetchSuccess', this.graphDsFetchSuccess);
    this.graphDataSource.on('fetchError', this.graphDsFetchError);
    this.fetchDataSource();
  }

  componentWillUnmount() {
    this.graphDataSource.removeListener('fetchSuccess', this.graphDsFetchSuccess);
    this.graphDataSource.removeListener('fetchError', this.graphDsFetchError);
  }

  componentDidUpdate(prevProps: TrafficDetailsProps) {
    const durationChanged = prevProps.duration !== this.props.duration;
    const itemNameChanged = prevProps.itemName !== this.props.itemName;
    const itemTypeChanged = prevProps.itemType !== this.props.itemType;
    const namespaceChanged = prevProps.namespace !== this.props.namespace;

    if (durationChanged || itemNameChanged || itemTypeChanged || namespaceChanged) {
      this.fetchDataSource();
    }
  }

  render() {
    return (
      <>
        <RightActionBar>
          <DurationDropdownContainer id="service-traffic-duration-dropdown" prefix="Last" />
          <RefreshButtonContainer handleRefresh={this.fetchDataSource} />
        </RightActionBar>
        <RenderComponentScroll>
          <Grid style={{ padding: '10px' }}>
            <GridItem span={12}>
              <Card>
                <CardBody>
                  <SimpleTabs id="traffic_tabs" defaultTab={0} style={{ paddingBottom: '10px' }}>
                    <Tab title="Inbound" eventKey={0}>
                      <TrafficListComponent
                        currentSortField={FilterHelper.currentSortField(TrafficListFilters.sortFields)}
                        isSortAscending={FilterHelper.isCurrentSortAscending()}
                        direction="inbound"
                        trafficItems={this.state.inboundTraffic}
                      />
                    </Tab>
                    <Tab title="Outbound" eventKey={1}>
                      <TrafficListComponent
                        direction="outbound"
                        currentSortField={FilterHelper.currentSortField(TrafficListFilters.sortFields)}
                        isSortAscending={FilterHelper.isCurrentSortAscending()}
                        trafficItems={this.state.outboundTraffic}
                      />
                    </Tab>
                  </SimpleTabs>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </RenderComponentScroll>
      </>
    );
  }

  private fetchDataSource = () => {
    switch (this.props.itemType) {
      case MetricsObjectTypes.SERVICE:
        this.graphDataSource.fetchForService(this.props.duration, this.props.namespace, this.props.itemName, true);
        break;
      case MetricsObjectTypes.WORKLOAD:
        this.graphDataSource.fetchForWorkload(this.props.duration, this.props.namespace, this.props.itemName, false);
        break;
      case MetricsObjectTypes.APP:
        this.graphDataSource.fetchForApp(this.props.duration, this.props.namespace, this.props.itemName, false);
        break;
    }
  };

  private graphDsFetchSuccess = () => {
    this.processTrafficData(this.graphDataSource.graphDefinition);
  };

  private graphDsFetchError = (errorMessage: string | null) => {
    if (errorMessage !== '') {
      errorMessage = 'Could not fetch traffic data: ' + errorMessage;
    } else {
      errorMessage = 'Could not fetch traffic data.';
    }

    AlertUtils.addError(errorMessage);
  };

  render() {
    return (
      <>
        <RightActionBar>
          <TimeControlsContainer
            key={'DurationDropdown'}
            id="app-info-duration-dropdown"
            handleRefresh={this.fetchDataSource}
            disabled={false}
          />
        </RightActionBar>
        <RenderComponentScroll>
          <Grid style={{ padding: '10px' }}>
            <GridItem span={12}>
              <Card>
                <CardBody>
                  <DetailedTrafficList header="Inbound" direction="inbound" traffic={this.state.inboundTraffic} />
                  <div style={{ marginTop: '2em' }} />
                  <DetailedTrafficList header="Outbound" direction="outbound" traffic={this.state.outboundTraffic} />
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </RenderComponentScroll>
      </>
    );
  }

  private buildTrafficNode = (prefix: 'in' | 'out', node: GraphNodeData): TrafficNode => {
    // given restrictions on fetch options the node type should be either App, Workload or [outbound] service
    switch (node.nodeType) {
      case NodeType.APP:
        return {
          id: `${prefix}-${node.id}`,
          type: node.nodeType,
          namespace: node.namespace,
          name: node.app || 'unknown',
          version: node.version || '',
          isInaccessible: node.isInaccessible || false
        };
      case NodeType.SERVICE:
        return {
          id: `${prefix}-${node.id}`,
          type: node.nodeType,
          namespace: node.namespace,
          name: node.service || 'unknown',
          isServiceEntry: node.isServiceEntry,
          isInaccessible: node.isInaccessible || false,
          destServices: node.destServices
        };
      default:
        return {
          id: `${prefix}-${node.id}`,
          type: NodeType.WORKLOAD,
          namespace: node.namespace,
          name: node.workload || 'unknown',
          isInaccessible: node.isInaccessible || false
        };
    }
  };

  private processTraffic = (
    edges: GraphEdgeWrapper[],
    nodes: { [key: string]: GraphNodeData },
    myNode: GraphNodeData
  ) => {
    const inboundTraffic: TrafficItem[] = [];
    const outboundTraffic: TrafficItem[] = [];

    edges.forEach(edge => {
      const sourceNode = nodes['id-' + edge.data.source];
      const targetNode = nodes['id-' + edge.data.target];
      if (myNode.id === edge.data.source) {
        const trafficItem: TrafficItem = {
          traffic: edge.data.traffic!,
          node: this.buildTrafficNode('out', targetNode)
        };
        outboundTraffic.push(trafficItem);
      } else if (myNode.id === edge.data.target) {
        const trafficItem: TrafficItem = {
          traffic: edge.data.traffic!,
          node: this.buildTrafficNode('in', sourceNode)
        };
        inboundTraffic.push(trafficItem);
      }
    });

    return { inboundTraffic, outboundTraffic };
  };

  private processTrafficData = (traffic: GraphDefinition | null) => {
    if (
      !traffic ||
      !traffic.elements.nodes ||
      !traffic.elements.edges ||
      traffic.elements.nodes.length === 0 ||
      traffic.elements.edges.length === 0
    ) {
      this.setState({ inboundTraffic: [], outboundTraffic: [] });
      return;
    }

    // Index nodes by id and find the node of the queried item
    const nodes: { [key: string]: GraphNodeData } = {};
    let myNode: GraphNodeData = { id: '', nodeType: NodeType.UNKNOWN, namespace: '' };

    traffic.elements.nodes.forEach(element => {
      // Ignore group nodes. They are not relevant for the traffic list because we
      // are interested in the actual apps.
      if (!element.data.isGroup) {
        nodes['id-' + element.data.id] = element.data;
        if (element.data.namespace) {
          const isMyWorkload =
            this.props.itemType === MetricsObjectTypes.WORKLOAD &&
            element.data.nodeType === NodeType.WORKLOAD &&
            this.props.itemName === element.data.workload;
          const isMyApp =
            this.props.itemType === MetricsObjectTypes.APP &&
            element.data.nodeType === NodeType.APP &&
            this.props.itemName === element.data.app;
          const isMyService =
            this.props.itemType === MetricsObjectTypes.SERVICE &&
            element.data.nodeType === NodeType.SERVICE &&
            this.props.itemName === element.data.service;

          if (isMyWorkload || isMyApp || isMyService) {
            myNode = element.data;
          }
        }
      }
    });

    if (myNode.id === '') {
      // Graph endpoint didn't return a graph for the current node.
      this.setState({ inboundTraffic: [], outboundTraffic: [] });
      return;
    }

    // Process the direct inbound/outbound traffic to/from the item of interest.
    this.setState(this.processTraffic(traffic.elements.edges!, nodes, myNode));
  };
}

export default TrafficDetails;