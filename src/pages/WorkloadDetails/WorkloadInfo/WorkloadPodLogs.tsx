import * as React from 'react';
import Draggable from 'react-draggable';
import { Button, Icon, Table, Toolbar } from 'patternfly-react';
import { Pod, PodLogs } from '../../../types/IstioObjects';
import { getPod, getPodLogs, Response } from '../../../services/Api';
import { CancelablePromise, makeCancelablePromise } from '../../../utils/CancelablePromises';
import { ToolbarDropdown } from '../../../components/ToolbarDropdown/ToolbarDropdown';
import MetricsDuration from '../../../components/MetricsOptions/MetricsDuration';

export interface WorkloadPodLogsProps {
  className?: string;
  namespace: string;
  podName: string;
  onClose: () => void;
}

interface WorkloadPodLogsState {
  container?: string;
  containers?: string[];
  loadingPod: boolean;
  loadingPodError?: string;
  loadingPodLogs: boolean;
  loadingPodLogsError?: string;
  pod?: Pod;
  podLogs?: PodLogs;
}

export default class WorkloadPodLogs extends React.Component<WorkloadPodLogsProps, WorkloadPodLogsState> {
  private loadPodPromise?: CancelablePromise<Response<Pod>[]>;
  private loadPodLogsPromise?: CancelablePromise<Response<PodLogs>[]>;

  headerFormat = (label, { column }) => <Table.Heading className={column.property}>{label}</Table.Heading>;
  cellFormat = (value, { column }) => {
    const props = column.cell.props;
    const className = props ? props.align : '';

    return <Table.Cell className={className}>{value}</Table.Cell>;
  };

  constructor(props: WorkloadPodLogsProps) {
    super(props);
    this.state = {
      loadingPod: true,
      loadingPodLogs: false
    };
  }

  componentDidMount() {
    this.fetchPod(this.props.namespace, this.props.podName);
  }

  componentDidUpdate(prevProps: WorkloadPodLogsProps, prevState: WorkloadPodLogsState) {
    if (this.state.container && prevState.container !== this.state.container) {
      this.fetchLogs(this.props.namespace, this.props.podName, this.state.container, MetricsDuration.initialDuration());
    }
  }

  render() {
    const className = this.props.className ? this.props.className : '';

    return (
      <Draggable handle="#helpheader">
        <div
          className={`modal-content ${className}`}
          style={{
            width: '600px',
            height: 'auto',
            right: '0',
            top: '10px',
            zIndex: 9999,
            position: 'absolute'
          }}
        >
          <div id="helpheader" className="modal-header">
            <Button className="close" bsClass="" onClick={this.props.onClose}>
              <Icon title="Close" type="pf" name="close" />
            </Button>
            <span className="modal-title">Pod Logs: {this.props.podName}</span>
          </div>
          <textarea
            style={{
              width: '100%',
              height: '105px',
              padding: '10px',
              resize: 'vertical',
              color: '#fff',
              backgroundColor: '#003145'
            }}
            readOnly={true}
            value={'Do I really need any text here?'}
          />
          {this.state.container && (
            <Toolbar>
              <ToolbarDropdown
                id={'pod_containers'}
                nameDropdown="Container"
                tooltip="Display logs for the selected pod container"
                handleSelect={value => this.setContainer(value)}
                value={this.state.container}
                label={this.state.container}
                options={this.state.containers!}
              />
            </Toolbar>
          )}
          {this.state.podLogs && (
            <textarea
              style={{
                width: '100%',
                height: '105px',
                padding: '10px',
                // resize: 'vertical',
                color: '#fff',
                backgroundColor: '#003145'
              }}
              readOnly={true}
              value={this.state.podLogs.logs}
            />
          )}
        </div>
      </Draggable>
    );
  }

  private setContainer = (container: string) => {
    this.setState({ container: container });
  };

  private fetchPod = (namespace: string, podName: string) => {
    const promise: Promise<Response<Pod>> = getPod(namespace, podName);
    this.loadPodPromise = makeCancelablePromise(Promise.all([promise]));
    this.loadPodPromise.promise
      .then(response => {
        const pod = response[0].data;
        const containers: string[] = [];
        if (pod.containers) {
          pod.containers.forEach(c => {
            containers.push(c.name);
          });
        }
        if (pod.istioContainers) {
          pod.istioContainers.forEach(c => {
            containers.push(c.name);
          });
        }
        const container = containers.length > 0 ? containers[0] : undefined;
        this.setState({
          container: container,
          containers: containers,
          loadingPod: false,
          loadingPodError: undefined,
          pod: pod
        });
        return;
      })
      .catch(error => {
        if (error.isCanceled) {
          console.debug('Pod: Ignore fetch error (canceled).');
          return;
        }
        const errorMsg = error.response && error.response.data.error ? error.response.data.error : error.message;
        this.setState({
          container: undefined,
          containers: undefined,
          loadingPod: false,
          loadingPodError: errorMsg,
          pod: undefined
        });
      });

    this.setState({
      container: undefined,
      containers: undefined,
      loadingPod: true,
      loadingPodError: undefined,
      pod: undefined,
      podLogs: undefined
    });
  };

  private fetchLogs = (namespace: string, podName: string, container: string, duration: number) => {
    const sinceTime = Math.floor(Date.now() / 1000) - duration;
    const promise: Promise<Response<PodLogs>> = getPodLogs(namespace, podName, container, sinceTime);
    this.loadPodLogsPromise = makeCancelablePromise(Promise.all([promise]));
    this.loadPodLogsPromise.promise
      .then(response => {
        const podLogs = response[0].data;
        this.setState({
          loadingPodLogs: false,
          loadingPodLogsError: undefined,
          podLogs: podLogs
        });
        return;
      })
      .catch(error => {
        if (error.isCanceled) {
          console.debug('PodLogs: Ignore fetch error (canceled).');
          return;
        }
        const errorMsg = error.response && error.response.data.error ? error.response.data.error : error.message;
        this.setState({
          loadingPodLogs: false,
          loadingPodLogsError: errorMsg,
          podLogs: undefined
        });
      });

    this.setState({
      loadingPodLogs: true,
      loadingPodLogsError: undefined,
      podLogs: undefined
    });
  };
}
