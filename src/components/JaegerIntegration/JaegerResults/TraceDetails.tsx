import * as React from 'react';
import { connect } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import _round from 'lodash/round';
import { Button, ButtonVariant, Card, CardBody, Grid, GridItem, Tooltip } from '@patternfly/react-core';

import { JaegerTrace, RichSpanData } from 'types/JaegerInfo';
import { JaegerTraceTitle } from './JaegerTraceTitle';
import { CytoscapeGraphSelectorBuilder } from 'components/CytoscapeGraph/CytoscapeGraphSelector';
import { GraphType, NodeType } from 'types/Graph';
import { FormattedTraceInfo, shortIDStyle } from './FormattedTraceInfo';
import { formatDuration } from './transform';
import { PFAlertColor, PfColors } from 'components/Pf/PfColors';
import { KialiAppState } from 'store/Store';
import { KialiAppAction } from 'actions/KialiAppAction';
import { JaegerThunkActions } from 'actions/JaegerThunkActions';
import { getTraceId } from 'utils/SearchParamUtils';
import { average } from 'utils/MathUtils';
import { averageSpanDuration, isSimilarTrace, reduceMetricsStats } from 'utils/TraceStats';
import { TraceLabels } from './TraceLabels';
import { TargetKind } from 'types/Common';
import { MetricsStatsQuery } from 'types/MetricsOptions';
import MetricsStatsThunkActions from 'actions/MetricsStatsThunkActions';
import { buildQueriesFromSpans, StatsMatrix, renderTraceHeatMap } from './StatsComparison';
import { sameSpans } from '../JaegerHelper';
import { HeatMap } from 'components/HeatMap/HeatMap';

interface Props {
  otherTraces: JaegerTrace[];
  jaegerURL: string;
  namespace: string;
  target: string;
  targetKind: TargetKind;
  setTraceId: (traceId?: string) => void;
  trace?: JaegerTrace;
  loadMetricsStats: (queries: MetricsStatsQuery[]) => void;
  statsMatrix?: StatsMatrix;
  isStatsMatrixComplete: boolean;
}

interface State {}
export const heatmapIntervals = ['10m', '60m', '6h'];

class TraceDetails extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const urlTrace = getTraceId();
    if (urlTrace && urlTrace !== props.trace?.traceID) {
      props.setTraceId(urlTrace);
    } else if (!urlTrace && props.trace) {
      // Remove old stored selected trace
      props.setTraceId(undefined);
    }
    this.state = { completeMetricsStats: false };
  }

  componentDidMount() {
    if (this.props.trace) {
      this.fetchComparisonMetrics(this.props.trace.spans);
    }
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    if (this.props.trace && !sameSpans(prevProps.trace?.spans || [], this.props.trace.spans)) {
      this.fetchComparisonMetrics(this.props.trace.spans);
    }
  }

  private fetchComparisonMetrics(spans: RichSpanData[]) {
    const queries = buildQueriesFromSpans(spans);
    this.props.loadMetricsStats(queries);
  }

  private getGraphURL = (traceID: string) => {
    let cytoscapeGraph = new CytoscapeGraphSelectorBuilder().namespace(this.props.namespace);
    let graphType: GraphType = GraphType.APP;

    switch (this.props.targetKind) {
      case 'app':
        cytoscapeGraph = cytoscapeGraph.app(this.props.target).nodeType(NodeType.APP).isGroup(null);
        break;
      case 'service':
        graphType = GraphType.SERVICE;
        cytoscapeGraph = cytoscapeGraph.service(this.props.target);
        break;
      case 'workload':
        graphType = GraphType.WORKLOAD;
        cytoscapeGraph = cytoscapeGraph.workload(this.props.target);
        break;
    }

    return `/graph/namespaces?graphType=${graphType}&injectServiceNodes=true&namespaces=${
      this.props.namespace
    }&traceId=${traceID}&focusSelector=${encodeURI(cytoscapeGraph.build())}`;
  };

  render() {
    const { trace, otherTraces, jaegerURL } = this.props;
    if (!trace) {
      return null;
    }
    const formattedTrace = new FormattedTraceInfo(trace);

    // Compute a bunch of stats
    const otherMeanDuration = average(otherTraces, trace => trace.duration);
    const avgSpanDuration = averageSpanDuration(trace);
    const otherSpanDurations = otherTraces.map(t => averageSpanDuration(t)).filter(d => d !== undefined) as number[];
    const otherMeanAvgSpanDuration = average(otherSpanDurations, d => d);
    const similarTraces = otherTraces.filter(t => t.traceID !== trace.traceID && isSimilarTrace(t, trace));
    const similarMeanDuration = average(similarTraces, trace => trace.duration);
    const similarSpanDurations = similarTraces
      .map(t => averageSpanDuration(t))
      .filter(d => d !== undefined) as number[];
    const similarMeanAvgSpanDuration = average(similarSpanDurations, d => d);
    const comparisonLink =
      this.props.jaegerURL && similarTraces.length > 0
        ? `${this.props.jaegerURL}/trace/${trace.traceID}...${similarTraces[0].traceID}?cohort=${
            trace.traceID
          }${similarTraces
            .slice(0, 10)
            .map(t => `&cohort=${t.traceID}`)
            .join('')}`
        : undefined;
    const genDiff = (a: number | undefined, b: number | undefined) => (a && b ? (a - b) / 1000 : undefined);
    const onScreenComparisonMatrix = [
      [genDiff(trace.duration, similarMeanDuration), genDiff(avgSpanDuration, similarMeanAvgSpanDuration)],
      [genDiff(trace.duration, otherMeanDuration), genDiff(avgSpanDuration, otherMeanAvgSpanDuration)]
    ];

    return (
      <Card isCompact style={{ border: '1px solid #e6e6e6' }}>
        <JaegerTraceTitle
          formattedTrace={formattedTrace}
          externalURL={jaegerURL ? `${jaegerURL}/trace/${trace.traceID}` : undefined}
          graphURL={this.getGraphURL(trace.traceID)}
          comparisonURL={comparisonLink}
        />
        <CardBody>
          <Grid style={{ marginTop: '20px' }}>
            <GridItem span={3}>
              <TraceLabels spans={trace.spans} oneline={false} />
            </GridItem>
            <GridItem span={3}>
              <Tooltip content={<>The full trace duration is (trace end time) - (trace start time).</>}>
                <strong>Full duration: </strong>
              </Tooltip>
              {formatDuration(trace.duration)}
              <br />
              <Tooltip
                content={
                  <>
                    The average duration of all spans within the trace. It differs from full duration, as spans can run
                    in parallel, or there can be dead time between spans.
                  </>
                }
              >
                <strong>Spans average duration: </strong>
              </Tooltip>
              {avgSpanDuration ? formatDuration(avgSpanDuration) : 'n/a'}
              <br />
              <strong>Compared with traces on screen: </strong>
              <HeatMap
                xLabels={['Similar', 'All']}
                yLabels={[`Full duration`, `Spans average`]}
                data={onScreenComparisonMatrix}
                displayMode={'large'}
                colorMap={HeatMap.HealthColorMap}
                dataRange={{ from: -10, to: 10 }}
                colorUndefined={PfColors.Black200}
                valueFormat={v => (v > 0 ? '+' : '') + _round(v, 1)}
                tooltip={(x, _, v) => {
                  // Build explanation tooltip
                  const slowOrFast = v > 0 ? 'slower' : 'faster';
                  const otherOrSimilar = x === 0 ? 'similar' : 'other';
                  return `${formattedTrace.shortID()} is ${_round(
                    Math.abs(v),
                    2
                  )}ms ${slowOrFast} than the ${otherOrSimilar} traces displayed`;
                }}
              />
              <br />
              {this.props.statsMatrix && (
                <>
                  <strong>Compared with metrics: </strong>
                  {renderTraceHeatMap(this.props.statsMatrix, heatmapIntervals, false)}
                </>
              )}
            </GridItem>
            <GridItem span={6}>
              <strong>Similar traces</strong>
              <ul>
                {similarTraces.length > 0
                  ? similarTraces.slice(0, 10).map(t => {
                      const info = new FormattedTraceInfo(t);
                      return (
                        <li key={t.traceID}>
                          <Button
                            style={{ paddingLeft: 0, paddingRight: 3 }}
                            variant={ButtonVariant.link}
                            onClick={() => this.props.setTraceId(t.traceID)}
                          >
                            {info.name()}
                          </Button>
                          <span className={shortIDStyle}>{info.shortID()}</span>
                          <small>
                            ({info.fromNow()},{' '}
                            {comparedDurations(trace.duration, t.duration, formattedTrace.shortID(), info.shortID())})
                          </small>
                        </li>
                      );
                    })
                  : 'No similar traces found'}
              </ul>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
    );
  }
}

export const comparedDurations = (
  d1: number | undefined,
  d2: number | undefined,
  d1Desc: string,
  d2Desc: string
): JSX.Element => {
  if (d2 === undefined || d1 === undefined) {
    return <>n/a</>;
  }
  const diff = d2 - d1;
  const absValue = formatDuration(Math.abs(diff));
  return (
    <Tooltip
      content={
        diff >= 0 ? (
          <>
            <strong>{d1Desc}</strong> is {absValue} <strong>faster</strong> than {d2Desc}
          </>
        ) : (
          <>
            <strong>{d1Desc}</strong> is {absValue} <strong>slower</strong> than {d2Desc}
          </>
        )
      }
    >
      {diff >= 0 ? (
        <span style={{ color: PFAlertColor.Success }}>-{absValue}</span>
      ) : (
        <span style={{ color: PFAlertColor.Danger }}>+{absValue}</span>
      )}
    </Tooltip>
  );
};

const mapStateToProps = (state: KialiAppState) => {
  if (state.jaegerState.selectedTrace) {
    const { matrix, isComplete } = reduceMetricsStats(
      state.jaegerState.selectedTrace,
      heatmapIntervals,
      state.metricsStats.data
    );
    return {
      trace: state.jaegerState.selectedTrace,
      statsMatrix: matrix,
      isStatsMatrixComplete: isComplete
    };
  }
  return {
    trace: state.jaegerState.selectedTrace,
    isStatsMatrixComplete: false
  };
};

const mapDispatchToProps = (dispatch: ThunkDispatch<KialiAppState, void, KialiAppAction>) => ({
  setTraceId: (traceId?: string) => dispatch(JaegerThunkActions.setTraceId(traceId)),
  loadMetricsStats: (queries: MetricsStatsQuery[]) => dispatch(MetricsStatsThunkActions.load(queries))
});

const TraceDetailsContainer = connect(mapStateToProps, mapDispatchToProps)(TraceDetails);
export default TraceDetailsContainer;
