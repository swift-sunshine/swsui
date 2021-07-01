import * as React from 'react';
import { Link } from 'react-router-dom';
import { Badge, Tooltip, TooltipPosition } from '@patternfly/react-core';
import * as FilterHelper from '../FilterList/FilterHelper';
import { appLabelFilter, versionLabelFilter } from '../../pages/WorkloadList/FiltersAndSorts';

import MissingSidecar from '../MissingSidecar/MissingSidecar';
import { hasMissingSidecar, IstioTypes, Renderer, Resource, SortResource, TResource } from './Config';
import { HealthIndicator } from '../Health/HealthIndicator';
import { ValidationObjectSummary } from '../Validations/ValidationObjectSummary';
import { WorkloadListItem } from '../../types/Workload';
import { IstioConfigItem } from '../../types/IstioConfigList';
import { AppListItem } from '../../types/AppList';
import { ServiceListItem } from '../../types/ServiceList';
import { ActiveFilter } from '../../types/Filters';
import { PFColors } from '../Pf/PfColors';
import { renderAPILogo } from '../Logo/Logos';
import { Health } from '../../types/Health';
import NamespaceInfo from '../../pages/Overview/NamespaceInfo';
import NamespaceMTLSStatusContainer from '../MTls/NamespaceMTLSStatus';
import ValidationSummary from '../Validations/ValidationSummary';
import OverviewCardContentExpanded from '../../pages/Overview/OverviewCardContentExpanded';
import { OverviewToolbar } from '../../pages/Overview/OverviewToolbar';
import { StatefulFilters } from '../Filters/StatefulFilters';
import IstioObjectLink, { GetIstioObjectUrl } from '../Link/IstioObjectLink';
import { labelFilter } from 'components/Filters/CommonFilters';
import { labelFilter as NsLabelFilter } from '../../pages/Overview/Filters';
import ValidationSummaryLink from '../Link/ValidationSummaryLink';
import { ValidationStatus } from '../../types/IstioObjects';
import { PFBadgeType, PFBadge, PFBadges } from 'components/Pf/PfBadges';
import MissingLabel from '../MissingLabel/MissingLabel';

// Links

const getLink = (item: TResource, config: Resource, query?: string) => {
  let url = config.name === 'istio' ? getIstioLink(item) : `/namespaces/${item.namespace}/${config.name}/${item.name}`;
  return query ? url + '?' + query : url;
};

const getIstioLink = (item: TResource) => {
  const type = item['type'];

  return GetIstioObjectUrl(item.name, item.namespace, type);
};

// Cells

export const actionRenderer = (key: string, action: JSX.Element) => {
  return (
    <td role="gridcell" key={'VirtuaItem_Action_' + key} style={{ verticalAlign: 'middle' }}>
      {action}
    </td>
  );
};

export const details: Renderer<AppListItem | WorkloadListItem | ServiceListItem> = (
  item: AppListItem | WorkloadListItem | ServiceListItem
) => {
  const hasMissingSC = hasMissingSidecar(item);
  const isWorkload = 'appLabel' in item;
  const hasMissingApp = isWorkload && !item['appLabel'];
  const hasMissingVersion = isWorkload && !item['versionLabel'];
  const additionalDetails = (item as WorkloadListItem | ServiceListItem).additionalDetailSample;
  const spacer = hasMissingSC && additionalDetails && additionalDetails.icon;
  const virtualServices = (item as ServiceListItem).virtualServices;
  const destinationRules = (item as ServiceListItem).destinationRules;
  const gateways = (item as WorkloadListItem).gateways;
  const authorizationPolicies = (item as WorkloadListItem).authorizationPolicies;
  const peerAuthentications = (item as WorkloadListItem).peerAuthentications;
  const sidecars = (item as WorkloadListItem).sidecars;
  const requestAuthentications = (item as WorkloadListItem).requestAuthentications;
  const envoyFilters = (item as WorkloadListItem).envoyFilters;

  return (
    <td
      role="gridcell"
      key={'VirtuaItem_Details_' + item.namespace + '_' + item.name}
      style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}
    >
      <ul>
        {hasMissingSC && (
          <li>
            <MissingSidecar namespace={item.namespace} />
          </li>
        )}
        {isWorkload && (hasMissingApp || hasMissingVersion) && (
          <MissingLabel missingApp={hasMissingApp} missingVersion={hasMissingVersion} tooltip={false} />
        )}
        {spacer && ' '}
        {additionalDetails && additionalDetails.icon && (
          <li>{renderAPILogo(additionalDetails.icon, additionalDetails.title, 0)}</li>
        )}
        {virtualServices &&
          virtualServices.length > 0 &&
          virtualServices.map(vs => (
            <li>
              <PFBadge badge={PFBadges.VirtualService} position={TooltipPosition.top} />
              <IstioObjectLink name={vs} namespace={item.namespace || ''} type={'virtualservice'}>
                {vs}
              </IstioObjectLink>
            </li>
          ))}
        {destinationRules &&
          destinationRules.length > 0 &&
          destinationRules.map(dr => (
            <li>
              <PFBadge badge={PFBadges.DestinationRule} position={TooltipPosition.top} />
              <IstioObjectLink name={dr} namespace={item.namespace || ''} type={'destinationrule'}>
                {dr}
              </IstioObjectLink>
            </li>
          ))}
        {gateways &&
          gateways.length > 0 &&
          gateways.map(dr => (
            <li>
              <PFBadge badge={PFBadges.DestinationRule} position={TooltipPosition.top} />
              <IstioObjectLink name={dr} namespace={item.namespace || ''} type={'destinationrule'}>
                {dr}
              </IstioObjectLink>
            </li>
          ))}
        {authorizationPolicies &&
          authorizationPolicies.length > 0 &&
          authorizationPolicies.map(ap => (
            <li>
              <PFBadge badge={PFBadges.AuthorizationPolicy} position={TooltipPosition.top} />
              <IstioObjectLink name={ap} namespace={item.namespace || ''} type={'authorizationpolicy'}>
                {ap}
              </IstioObjectLink>
            </li>
          ))}
        {peerAuthentications &&
          peerAuthentications.length > 0 &&
          peerAuthentications.map(pa => (
            <li>
              <PFBadge badge={PFBadges.PeerAuthentication} position={TooltipPosition.top} />
              <IstioObjectLink name={pa} namespace={item.namespace || ''} type={'peerauthentication'}>
                {pa}
              </IstioObjectLink>
            </li>
          ))}
        {sidecars &&
          sidecars.length > 0 &&
          sidecars.map(sc => (
            <li>
              <PFBadge badge={PFBadges.Sidecar} position={TooltipPosition.top} />
              <IstioObjectLink name={sc} namespace={item.namespace || ''} type={'sidecar'}>
                {sc}
              </IstioObjectLink>
            </li>
          ))}
        {requestAuthentications &&
          requestAuthentications.length > 0 &&
          requestAuthentications.map(ra => (
            <li>
              <PFBadge badge={PFBadges.RequestAuthentication} position={TooltipPosition.top} />
              <IstioObjectLink name={ra} namespace={item.namespace || ''} type={'requestauthentication'}>
                {ra}
              </IstioObjectLink>
            </li>
          ))}
        {envoyFilters &&
          envoyFilters.length > 0 &&
          envoyFilters.map(ef => (
            <li>
              <PFBadge badge={PFBadges.EnvoyFilter} position={TooltipPosition.top} />
              <IstioObjectLink name={ef} namespace={item.namespace || ''} type={'envoyfilter'}>
                {ef}
              </IstioObjectLink>
            </li>
          ))}
      </ul>
    </td>
  );
};

export const tls: Renderer<NamespaceInfo> = (ns: NamespaceInfo) => {
  return (
    <td role="gridcell" key={'VirtualItem_tls_' + ns.name} style={{ verticalAlign: 'middle' }}>
      {ns.tlsStatus ? <NamespaceMTLSStatusContainer status={ns.tlsStatus.status} /> : undefined}
    </td>
  );
};

export const istioConfig: Renderer<NamespaceInfo> = (ns: NamespaceInfo) => {
  let validations: ValidationStatus = { objectCount: 0, errors: 0, warnings: 0 };
  if (!!ns.validations) {
    validations = ns.validations;
  }
  const status = (
    <td role="gridcell" key={'VirtuaItem_IstioConfig_' + ns.name} style={{ verticalAlign: 'middle' }}>
      <ValidationSummaryLink
        namespace={ns.name}
        objectCount={validations.objectCount}
        errors={validations.errors}
        warnings={validations.warnings}
      >
        <ValidationSummary
          id={'ns-val-' + ns.name}
          errors={validations.errors}
          warnings={validations.warnings}
          objectCount={validations.objectCount}
        />
      </ValidationSummaryLink>
    </td>
  );
  return status;
};

export const status: Renderer<NamespaceInfo> = (ns: NamespaceInfo) => {
  if (ns.status) {
    return (
      <td
        role="gridcell"
        key={'VirtuaItem_Status_' + ns.name}
        className="pf-m-center"
        style={{ verticalAlign: 'middle' }}
      >
        <OverviewCardContentExpanded
          key={ns.name}
          name={ns.name}
          duration={FilterHelper.currentDuration()}
          status={ns.status}
          type={OverviewToolbar.currentOverviewType()}
          metrics={ns.metrics}
        />
      </td>
    );
  }
  return <td role="gridcell" key={'VirtuaItem_Status_' + ns.name} />;
};

export const nsItem: Renderer<NamespaceInfo> = (ns: NamespaceInfo, _config: Resource, badge: PFBadgeType) => {
  return (
    <td role="gridcell" key={'VirtuaItem_NamespaceItem_' + ns.name} style={{ verticalAlign: 'middle' }}>
      <PFBadge badge={badge} />
      {ns.name}
    </td>
  );
};

export const item: Renderer<TResource> = (item: TResource, config: Resource, badge: PFBadgeType) => {
  const key = 'link_definition_' + config.name + '_' + item.namespace + '_' + item.name;
  return (
    <td role="gridcell" key={'VirtuaItem_Item_' + item.namespace + '_' + item.name} style={{ verticalAlign: 'middle' }}>
      <PFBadge badge={badge} position={TooltipPosition.top} />
      <Link key={key} to={getLink(item, config)} className={'virtualitem_definition_link'}>
        {item.name}
      </Link>
    </td>
  );
};

export const namespace: Renderer<TResource> = (item: TResource) => {
  return (
    <td
      role="gridcell"
      key={'VirtuaItem_Namespace_' + item.namespace + '_' + item.name}
      style={{ verticalAlign: 'middle' }}
    >
      <PFBadge badge={PFBadges.Namespace} position={TooltipPosition.top} />
      {item.namespace}
    </td>
  );
};

const labelActivate = (filters: ActiveFilter[], key: string, value: string, id: string) => {
  return filters.some(filter => {
    if (filter.id === id) {
      if (filter.value.includes(':')) {
        const [k, v] = filter.value.split(':');
        if (k === key) {
          return v.split(',').some(val => value.split(',').some(vl => vl.trim().startsWith(val.trim())));
        }
        return false;
      }
      return key === filter.value;
    } else {
      if (filter.id === appLabelFilter.id) {
        return filter.value === 'Present' && key === 'app';
      }
      return filter.value === 'Present' && key === 'version';
    }
  });
};

export const labels: Renderer<SortResource | NamespaceInfo> = (
  item: SortResource | NamespaceInfo,
  _: Resource,
  __: PFBadgeType,
  ___?: Health,
  statefulFilter?: React.RefObject<StatefulFilters>
) => {
  let path = window.location.pathname;
  path = path.substr(path.lastIndexOf('/console') + '/console'.length + 1);
  const labelFilt = path === 'overview' ? NsLabelFilter : labelFilter;
  const filters = FilterHelper.getFiltersFromURL([labelFilt, appLabelFilter, versionLabelFilter]);
  return (
    <td
      role="gridcell"
      key={'VirtuaItem_Labels_' + ('namespace' in item && `${item.namespace}_`) + item.name}
      style={{ verticalAlign: 'middle' }}
    >
      {item.labels &&
        Object.entries(item.labels).map(([key, value]) => {
          const label = `${key}:${value}`;
          const labelAct = labelActivate(filters.filters, key, value, labelFilt.id);
          const isExactlyLabelFilter = FilterHelper.getFiltersFromURL([labelFilt]).filters.some(f =>
            f.value.includes(label)
          );
          const badgeComponent = (
            <Badge
              key={`labelbadge_${key}_${value}_${item.name}`}
              isRead={true}
              style={{
                backgroundColor: labelAct ? PFColors.Badge : undefined,
                cursor: isExactlyLabelFilter || !labelAct ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap'
              }}
              onClick={() =>
                statefulFilter
                  ? labelAct
                    ? isExactlyLabelFilter && statefulFilter.current!.removeFilter(labelFilt.id, label)
                    : statefulFilter.current!.filterAdded(labelFilt, label)
                  : {}
              }
            >
              {key}: {value}
            </Badge>
          );

          return statefulFilter ? (
            <Tooltip
              key={'Tooltip_Label_' + key + '_' + value}
              content={
                labelAct ? (
                  isExactlyLabelFilter ? (
                    <>Remove label from Filters</>
                  ) : (
                    <>Kiali can't remove the filter if is an expression</>
                  )
                ) : (
                  <>Add label to Filters</>
                )
              }
            >
              {badgeComponent}
            </Tooltip>
          ) : (
            badgeComponent
          );
        })}
    </td>
  );
};
export const health: Renderer<TResource> = (item: TResource, __: Resource, _: PFBadgeType, health?: Health) => {
  return (
    <td
      role="gridcell"
      key={'VirtuaItem_Health_' + item.namespace + '_' + item.name}
      style={{ verticalAlign: 'middle' }}
    >
      {health && <HealthIndicator id={item.name} health={health} />}
    </td>
  );
};

export const workloadType: Renderer<WorkloadListItem> = (item: WorkloadListItem) => {
  return (
    <td
      role="gridcell"
      key={'VirtuaItem_WorkloadType_' + item.namespace + '_' + item.name}
      style={{ verticalAlign: 'middle' }}
    >
      {item.type}
    </td>
  );
};

export const istioType: Renderer<IstioConfigItem> = (item: IstioConfigItem) => {
  const type = item.type;
  const object = IstioTypes[type];
  return (
    <td
      role="gridcell"
      key={'VirtuaItem_IstioType_' + item.namespace + '_' + item.name}
      style={{ verticalAlign: 'middle' }}
    >
      {object.name}
    </td>
  );
};

export const configuration: Renderer<ServiceListItem | IstioConfigItem> = (
  item: ServiceListItem | IstioConfigItem,
  config: Resource
) => {
  const validation = item.validation;
  const linkQuery: string = item['type'] ? 'list=yaml' : '';
  return (
    <td role="gridcell" key={'VirtuaItem_Conf_' + item.namespace + '_' + item.name} style={{ verticalAlign: 'middle' }}>
      {validation ? (
        <Link to={`${getLink(item, config, linkQuery)}`}>
          <ValidationObjectSummary id={item.name + '-config-validation'} validations={[validation]} />
        </Link>
      ) : (
        <>N/A</>
      )}
    </td>
  );
};
