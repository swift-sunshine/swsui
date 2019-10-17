import * as React from 'react';
import { Icon } from 'patternfly-react';
import { style } from 'typestyle';
import { NodeType, SummaryPanelPropType, Protocol, DecoratedGraphNodeData } from '../../types/Graph';
import { Health, healthNotAvailable } from '../../types/Health';
import { IstioMetricsOptions, Reporter, Direction } from '../../types/MetricsOptions';
import * as API from '../../services/Api';
import * as M from '../../types/Metrics';
import { Metric } from '../../types/Metrics';
import { Response } from '../../services/Api';
import { serverConfig } from '../../config/ServerConfig';
import { decoratedNodeData } from 'components/CytoscapeGraph/CytoscapeGraphUtils';
import { Badge } from '@patternfly/react-core';
import { PfColors } from 'components/Pf/PfColors';

export enum NodeMetricType {
  APP = 1,
  WORKLOAD = 2,
  SERVICE = 3
}

export const summaryHeader: React.CSSProperties = {
  backgroundColor: PfColors.White
};

export const summaryBodyTabs = style({
  padding: '0 15px 15px'
});

export const summaryNavTabs = style({
  fontSize: '13px',
  paddingLeft: '1.5em'
});

export const shouldRefreshData = (prevProps: SummaryPanelPropType, nextProps: SummaryPanelPropType) => {
  return (
    // Verify the time of the last request
    prevProps.queryTime !== nextProps.queryTime ||
    // Check if going from no data to data
    (!prevProps.data.summaryTarget && nextProps.data.summaryTarget) ||
    // Check if the target changed
    prevProps.data.summaryTarget !== nextProps.data.summaryTarget
  );
};

type HealthState = {
  health?: Health;
  healthLoading: boolean;
};

export const updateHealth = (summaryTarget: any, stateSetter: (hs: HealthState) => void) => {
  const healthPromise = summaryTarget.data('healthPromise');
  if (healthPromise) {
    stateSetter({ health: undefined, healthLoading: true });
    healthPromise
      .then(h => stateSetter({ health: h, healthLoading: false }))
      .catch(_err => stateSetter({ health: healthNotAvailable(), healthLoading: false }));
  } else {
    stateSetter({ health: undefined, healthLoading: false });
  }
};

export const getNodeMetricType = (nodeData: DecoratedGraphNodeData): NodeMetricType => {
  switch (nodeData.nodeType) {
    case NodeType.APP:
      // treat versioned app like a workload to narrow to the specific version
      return nodeData.workload ? NodeMetricType.WORKLOAD : NodeMetricType.APP;
    case NodeType.SERVICE:
      return NodeMetricType.SERVICE;
    default:
      // treat UNKNOWN as a workload with name="unknown"
      return NodeMetricType.WORKLOAD;
  }
};

export const getNodeMetrics = (
  nodeMetricType: NodeMetricType,
  node: any,
  props: SummaryPanelPropType,
  filters: Array<string>,
  direction: Direction,
  reporter: Reporter,
  requestProtocol?: string,
  quantiles?: Array<string>,
  byLabels?: Array<string>
): Promise<Response<M.Metrics>> => {
  const nodeData = decoratedNodeData(node);
  const options: IstioMetricsOptions = {
    queryTime: props.queryTime,
    duration: props.duration,
    step: props.step,
    rateInterval: props.rateInterval,
    filters: filters,
    quantiles: quantiles,
    byLabels: byLabels,
    direction: direction,
    reporter: reporter,
    requestProtocol: requestProtocol
  };

  switch (nodeMetricType) {
    case NodeMetricType.APP:
      return API.getAppMetrics(nodeData.namespace, nodeData.app!, options);
    case NodeMetricType.SERVICE:
      return API.getServiceMetrics(nodeData.namespace, nodeData.service!, options);
    case NodeMetricType.WORKLOAD:
      return API.getWorkloadMetrics(nodeData.namespace, nodeData.workload!, options);
    default:
      return Promise.reject(new Error(`Unknown NodeMetricType: ${nodeMetricType}`));
  }
};

export const mergeMetricsResponses = (promises: Promise<Response<M.Metrics>>[]): Promise<Response<M.Metrics>> => {
  return Promise.all(promises).then(responses => {
    const metrics: M.Metrics = {
      metrics: {},
      histograms: {}
    };
    responses.forEach(r => {
      Object.keys(r.data.metrics).forEach(k => {
        metrics.metrics[k] = r.data.metrics[k];
      });
      Object.keys(r.data.histograms).forEach(k => {
        metrics.histograms[k] = r.data.histograms[k];
      });
    });
    return {
      data: metrics
    };
  });
};

export const getFirstDatapoints = (metric: M.MetricGroup): M.Datapoint[] => {
  return metric.matrix.length > 0 ? metric.matrix[0].values : [];
};

export const getDatapoints = (
  mg: M.MetricGroup,
  comparator: (metric: Metric, protocol?: Protocol) => boolean,
  protocol?: Protocol
): M.Datapoint[] => {
  if (mg && mg.matrix) {
    const tsa: M.TimeSeries[] = mg.matrix;
    for (let i = 0; i < tsa.length; ++i) {
      const ts = tsa[i];
      if (comparator(ts.metric, protocol)) {
        return ts.values;
      }
    }
  }
  return [];
};

export const renderNodeInfo = (nodeData: DecoratedGraphNodeData) => {
  const hasNamespace =
    nodeData.nodeType !== NodeType.UNKNOWN && !(nodeData.nodeType === NodeType.SERVICE && nodeData.isServiceEntry);
  const hasVersion = hasNamespace && nodeData.version;
  return (
    <>
      <div style={{ paddingBottom: '3px', paddingTop: '3px' }}>
        {hasNamespace && <Badge>Namespace: {nodeData.namespace}</Badge>}
        {hasVersion && (
          <Badge>
            {serverConfig.istioLabels.versionLabelName}: {nodeData.version!}
          </Badge>
        )}
      </div>
    </>
  );
};

export const renderNoTraffic = (protocol?: string) => {
  return (
    <>
      <div>
        <Icon type="pf" name="info" /> No {protocol ? protocol : ''} traffic logged.
      </div>
    </>
  );
};
