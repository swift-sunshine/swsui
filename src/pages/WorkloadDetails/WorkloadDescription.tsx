import * as React from 'react';
import { Workload } from '../../types/Workload';
import { Card, CardBody, CardHeader, Title } from '@patternfly/react-core';
import DetailDescription from '../../components/Details/DetailDescription';
import { serverConfig } from '../../config';
import { style } from 'typestyle';
import MissingSidecar from '../../components/MissingSidecar/MissingSidecar';
import Labels from '../../components/Label/Labels';
import LocalTime from '../../components/Time/LocalTime';
import { TextOrLink } from '../../components/TextOrLink';
import { renderAPILogo, renderRuntimeLogo } from '../../components/Logo/Logos';

type WorkloadDescriptionProps = {
  workload?: Workload;
  namespace: string;
};

const titleStyle = style({
  margin: '15px 0 11px 0'
});

const resourceListStyle = style({
  margin: '0px 0 11px 0',
  $nest: {
    '& > ul > li > span': {
      float: 'left',
      width: '125px',
      fontWeight: 700
    }
  }
});

class WorkloadDescription extends React.Component<WorkloadDescriptionProps> {
  render() {
    const workload = this.props.workload;
    const apps: string[] = [];
    const services: string[] = [];
    if (workload) {
      if (workload.labels[serverConfig.istioLabels.appLabelName]) {
        apps.push(workload.labels[serverConfig.istioLabels.appLabelName]);
      }
      workload.services.forEach(s => services.push(s.name));
    }
    const isTemplateLabels =
      workload &&
      ['Deployment', 'ReplicaSet', 'ReplicationController', 'DeploymentConfig', 'StatefulSet'].indexOf(workload.type) >=
        0;
    const runtimes = (workload?.runtimes || []).map(r => r.name).filter(name => name !== '');
    return workload ? (
      <Card>
        <CardHeader>
          <Title headingLevel="h3" size="2xl">
            Workload
          </Title>
        </CardHeader>
        <CardBody>
          {workload.labels && (
            <Labels
              labels={workload.labels}
              tooltipMessage={isTemplateLabels ? 'Labels defined on the Workload template' : undefined}
            />
          )}
          <DetailDescription namespace={this.props.namespace} apps={apps} services={services} />
          {!this.props.workload?.istioSidecar && (
            <div>
              <MissingSidecar namespace={this.props.namespace} />
            </div>
          )}
          <Title headingLevel="h3" size="lg" className={titleStyle}>
            Properties
          </Title>
          <div key="properties-list" className={resourceListStyle}>
            <ul style={{ listStyleType: 'none' }}>
              {workload.istioInjectionAnnotation !== undefined && (
                <li>
                  <span>Istio Injection</span>
                  {String(workload.istioInjectionAnnotation)}
                </li>
              )}
              <li>
                <span>Type</span>
                {workload.type ? workload.type : 'N/A'}
              </li>
              <li>
                <span>Created</span>
                <div style={{ display: 'inline-block' }}>
                  <LocalTime time={workload.createdAt} />
                </div>
              </li>
              <li>
                <span>Version</span>
                {workload.resourceVersion}
              </li>
              {workload.additionalDetails.map((additionalItem, idx) => {
                return (
                  <li key={'additional-details-' + idx} id={'additional-details-' + idx}>
                    <span>{additionalItem.title}</span>
                    {additionalItem.icon && renderAPILogo(additionalItem.icon, undefined, idx)}
                    <TextOrLink text={additionalItem.value} urlTruncate={64} />
                  </li>
                );
              })}
              {runtimes.length > 0 && (
                <li id="runtimes">
                  <span>Runtimes</span>
                  <div style={{ display: 'inline-block' }}>
                    {runtimes
                      .map((rt, idx) => renderRuntimeLogo(rt, idx))
                      .reduce(
                        (list: JSX.Element[], elem) =>
                          list.length > 0 ? [...list, <span key="sep"> | </span>, elem] : [elem],
                        []
                      )}
                  </div>
                </li>
              )}
            </ul>
          </div>
        </CardBody>
      </Card>
    ) : (
      'Loading'
    );
  }
}

export default WorkloadDescription;
