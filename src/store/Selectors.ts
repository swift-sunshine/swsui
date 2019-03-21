import { createSelector } from 'reselect';
import * as GraphData from './Selectors/GraphData';
import { KialiAppState } from './Store';
import { isMTLSEnabled } from '../types/TLSStatus';
// These memoized selectors are from Redux Reselect package

const createIdentitySelector = selector =>
  createSelector(
    selector,
    x => x
  );

// select the proper field from Redux State
const activeNamespaces = (state: KialiAppState) => state.namespaces.activeNamespaces;

// Select from the above field(s) and the last function is the formatter
export const activeNamespacesSelector = createIdentitySelector(activeNamespaces);

/**
 * Gets a comma separated list of the namespaces for displaying
 * @type {OutputSelector<KialiAppState, any, (res: Namespace[]) => any>}
 */
export const activeNamespacesAsStringSelector = createSelector(
  activeNamespaces,
  namespaces => namespaces.map(namespace => namespace.name).join(', ')
);

const duration = (state: KialiAppState) => state.userSettings.duration;

export const durationSelector = createIdentitySelector(duration);

const namespaceFilter = (state: KialiAppState) => state.namespaces.filter;

export const namespaceFilterSelector = createIdentitySelector(namespaceFilter);

const edgeLabelMode = (state: KialiAppState) => state.graph.filterState.edgeLabelMode;

export const edgeLabelModeSelector = createIdentitySelector(edgeLabelMode);

const findValue = (state: KialiAppState) => state.graph.filterState.findValue;

export const findValueSelector = createIdentitySelector(findValue);

const graphType = (state: KialiAppState) => state.graph.filterState.graphType;

export const graphTypeSelector = createIdentitySelector(graphType);

const hideValue = (state: KialiAppState) => state.graph.filterState.hideValue;

export const hideValueSelector = createIdentitySelector(hideValue);

const namespaceItems = (state: KialiAppState) => state.namespaces.items;

export const namespaceItemsSelector = createIdentitySelector(namespaceItems);

const refreshInterval = (state: KialiAppState) => state.userSettings.refreshInterval;

export const refreshIntervalSelector = createIdentitySelector(refreshInterval);

const showServiceNodes = (state: KialiAppState) => state.graph.filterState.showServiceNodes;

export const showServiceNodesSelector = createIdentitySelector(showServiceNodes);

export const graphDataSelector = GraphData.graphDataSelector;

const meshwideMTLSStatus = (state: KialiAppState) => state.statusState.status['Istio mTLS'];

export const meshWideMTLSStatusSelector = createIdentitySelector(meshwideMTLSStatus);

const meshwideMTLSEnabled = (state: KialiAppState) => isMTLSEnabled(state.statusState.status['Istio mTLS']);

export const meshWideMTLSEnabledSelector = createIdentitySelector(meshwideMTLSEnabled);
