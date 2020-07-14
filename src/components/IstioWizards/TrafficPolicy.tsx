import * as React from 'react';
import { connect } from 'react-redux';
import { Form, FormGroup, FormSelect, FormSelectOption, Radio, Switch, TextInput } from '@patternfly/react-core';
import { MTLSStatuses, nsWideMTLSStatus, TLSStatus } from '../../types/TLSStatus';
import { KialiAppState } from '../../store/Store';
import { meshWideMTLSStatusSelector } from '../../store/Selectors';
import { HTTPCookie, LoadBalancerSettings, PeerAuthenticationMutualTLSMode } from '../../types/IstioObjects';

export const UNSET = 'UNSET';
export const DISABLE = 'DISABLE';
export const ISTIO_MUTUAL = 'ISTIO_MUTUAL';
export const SIMPLE = 'SIMPLE';
export const MUTUAL = 'MUTUAL';
export const ROUND_ROBIN = 'ROUND_ROBIN';

export const loadBalancerSimple: string[] = [ROUND_ROBIN, 'LEAST_CONN', 'RANDOM', 'PASSTHROUGH'];

export const mTLSMode: string[] = [UNSET, DISABLE, ISTIO_MUTUAL, SIMPLE, MUTUAL];

type ReduxProps = {
  meshWideStatus: string;
};

type Props = ReduxProps & {
  mtlsMode: string;
  clientCertificate: string;
  privateKey: string;
  caCertificates: string;
  hasLoadBalancer: boolean;
  loadBalancer: LoadBalancerSettings;
  onTrafficPolicyChange: (valid: boolean, trafficPolicy: TrafficPolicyState) => void;
  nsWideStatus?: TLSStatus;
  hasPeerAuthentication: boolean;
  peerAuthenticationMode: PeerAuthenticationMutualTLSMode;
};

export enum ConsistentHashType {
  HTTP_HEADER_NAME = 'HTTP_HEADER_NAME',
  HTTP_COOKIE = 'HTTP_COOKIE',
  USE_SOURCE_IP = 'USE_SOURCE_IP'
}

export type TrafficPolicyState = {
  tlsModified: boolean;
  mtlsMode: string;
  clientCertificate: string;
  privateKey: string;
  caCertificates: string;
  addLoadBalancer: boolean;
  simpleLB: boolean;
  consistentHashType: ConsistentHashType;
  loadBalancer: LoadBalancerSettings;
  peerAuthnSelector: PeerAuthenticationSelectorState;
};

export type PeerAuthenticationSelectorState = {
  addPeerAuthentication: boolean;
  addPeerAuthnModified: boolean;
  mode: PeerAuthenticationMutualTLSMode;
};

const durationRegex = /^[0-9]*(\.[0-9]+)?s?$/;

enum TrafficPolicyForm {
  TLS,
  TLS_CLIENT_CERTIFICATE,
  TLS_PRIVATE_KEY,
  TLS_CA_CERTIFICATES,
  LB_SWITCH,
  LB_SIMPLE,
  LB_SELECT,
  LB_CONSISTENT_HASH,
  LB_HTTP_HEADER_NAME,
  LB_HTTP_COOKIE_NAME,
  LB_HTTP_COOKIE_TTL,
  PA_SWITCH,
  PA_MODE
}

class TrafficPolicy extends React.Component<Props, TrafficPolicyState> {
  constructor(props: Props) {
    super(props);
    let consistentHashType: ConsistentHashType = ConsistentHashType.HTTP_HEADER_NAME;
    if (props.loadBalancer.consistentHash) {
      if (props.loadBalancer.consistentHash.httpHeaderName) {
        consistentHashType = ConsistentHashType.HTTP_HEADER_NAME;
      } else if (props.loadBalancer.consistentHash.httpCookie) {
        consistentHashType = ConsistentHashType.HTTP_COOKIE;
      } else if (props.loadBalancer.consistentHash.useSourceIp) {
        consistentHashType = ConsistentHashType.USE_SOURCE_IP;
      }
    }
    this.state = {
      tlsModified: false,
      mtlsMode: props.mtlsMode,
      clientCertificate: props.clientCertificate,
      privateKey: props.privateKey,
      caCertificates: props.caCertificates,
      addLoadBalancer: props.hasLoadBalancer,
      simpleLB: props.loadBalancer && props.loadBalancer.simple !== undefined && props.loadBalancer.simple !== null,
      consistentHashType: consistentHashType,
      loadBalancer: props.loadBalancer,
      peerAuthnSelector: {
        addPeerAuthentication: props.hasPeerAuthentication,
        addPeerAuthnModified: false,
        mode: props.peerAuthenticationMode
      }
    };
  }

  componentDidMount(): void {
    const meshWideStatus = this.props.meshWideStatus || MTLSStatuses.NOT_ENABLED;
    const nsWideStatus = this.props.nsWideStatus ? this.props.nsWideStatus.status : MTLSStatuses.NOT_ENABLED;
    const isMtlsEnabled = nsWideMTLSStatus(nsWideStatus, meshWideStatus);
    // If there is a previous value, use it
    if (this.props.mtlsMode !== '' && this.props.mtlsMode !== UNSET) {
      // Don't forget to update the mtlsMode
      this.setState(
        {
          tlsModified: true,
          mtlsMode: this.props.mtlsMode
        },
        () => this.props.onTrafficPolicyChange(true, this.state)
      );
      // otherwise, if there is MTLS enabled, use ISTIO_MUTUAL
    } else if (isMtlsEnabled === MTLSStatuses.ENABLED) {
      this.setState(
        {
          tlsModified: true,
          mtlsMode: ISTIO_MUTUAL
        },
        () => this.props.onTrafficPolicyChange(true, this.state)
      );
    }
  }

  isValidDuration = (ttl: string): boolean => {
    if (ttl.length === 0) {
      return false;
    }
    return ttl.search(durationRegex) === 0;
  };

  isValidCookie = (cookie: HTTPCookie): boolean => {
    if (
      !cookie.name ||
      cookie.name.length === 0 ||
      !cookie.ttl ||
      cookie.ttl.length === 0 ||
      !this.isValidDuration(cookie.ttl)
    ) {
      return false;
    }
    return true;
  };

  isValidLB = (state: TrafficPolicyState): boolean => {
    if (!state.addLoadBalancer) {
      return true;
    }
    if (state.simpleLB) {
      // No need to check more as user select the simple LB from a list
      return true;
    }
    // No need to enter to check inside consistentHash
    if (state.consistentHashType === ConsistentHashType.USE_SOURCE_IP) {
      return true;
    }
    if (!state.loadBalancer.consistentHash) {
      return false;
    }
    switch (state.consistentHashType) {
      case ConsistentHashType.HTTP_HEADER_NAME:
        return state.loadBalancer.consistentHash && state.loadBalancer.consistentHash.httpHeaderName
          ? state.loadBalancer.consistentHash.httpHeaderName.length > 0
          : false;
      case ConsistentHashType.HTTP_COOKIE:
        return state.loadBalancer.consistentHash && state.loadBalancer.consistentHash.httpCookie
          ? this.isValidCookie(state.loadBalancer.consistentHash.httpCookie)
          : false;
      default:
        return true;
    }
  };

  isValidTLS = (state: TrafficPolicyState): boolean => {
    return state.mtlsMode !== undefined;
  };

  onFormChange = (component: TrafficPolicyForm, value: string) => {
    switch (component) {
      case TrafficPolicyForm.TLS:
        this.setState(
          {
            tlsModified: true,
            mtlsMode: value
          },
          () =>
            this.props.onTrafficPolicyChange(
              this.state.mtlsMode === MUTUAL
                ? this.state.clientCertificate.length > 0 && this.state.privateKey.length > 0
                : true,
              this.state
            )
        );
        break;
      case TrafficPolicyForm.TLS_CLIENT_CERTIFICATE:
        this.setState(
          {
            tlsModified: true,
            clientCertificate: value
          },
          () =>
            this.props.onTrafficPolicyChange(
              this.state.mtlsMode === MUTUAL &&
                this.state.clientCertificate.length > 0 &&
                this.state.privateKey.length > 0,
              this.state
            )
        );
        break;
      case TrafficPolicyForm.TLS_PRIVATE_KEY:
        this.setState(
          {
            tlsModified: true,
            privateKey: value
          },
          () =>
            this.props.onTrafficPolicyChange(
              this.state.mtlsMode === MUTUAL &&
                this.state.clientCertificate.length > 0 &&
                this.state.privateKey.length > 0,
              this.state
            )
        );
        break;
      case TrafficPolicyForm.TLS_CA_CERTIFICATES:
        this.setState(
          {
            tlsModified: true,
            caCertificates: value
          },
          () =>
            this.props.onTrafficPolicyChange(
              this.state.mtlsMode === MUTUAL &&
                this.state.clientCertificate.length > 0 &&
                this.state.privateKey.length > 0,
              this.state
            )
        );
        break;
      case TrafficPolicyForm.LB_SWITCH:
        this.setState(
          prevState => {
            return {
              addLoadBalancer: !prevState.addLoadBalancer
            };
          },
          () => this.props.onTrafficPolicyChange(this.isValidLB(this.state), this.state)
        );
        break;
      case TrafficPolicyForm.LB_SIMPLE:
        this.setState(
          prevState => {
            const loadBalancer = prevState.loadBalancer;
            loadBalancer.simple = value;
            return {
              loadBalancer: loadBalancer
            };
          },
          () => this.props.onTrafficPolicyChange(this.isValidLB(this.state), this.state)
        );
        break;
      case TrafficPolicyForm.LB_SELECT:
        this.setState(
          prevState => {
            // Set a LB simple default value if not present
            if (!prevState.loadBalancer || !prevState.loadBalancer.simple) {
              prevState.loadBalancer.simple = ROUND_ROBIN;
            }
            return {
              simpleLB: value === 'true'
            };
          },
          () => this.props.onTrafficPolicyChange(this.isValidLB(this.state), this.state)
        );
        break;
      case TrafficPolicyForm.LB_CONSISTENT_HASH:
        this.setState(
          prevState => {
            const loadBalancer = prevState.loadBalancer;
            if (!loadBalancer.consistentHash) {
              loadBalancer.consistentHash = {};
            }
            if (ConsistentHashType[value] === ConsistentHashType.USE_SOURCE_IP) {
              loadBalancer.consistentHash.useSourceIp = true;
            }
            return {
              consistentHashType: ConsistentHashType[value]
            };
          },
          () => this.props.onTrafficPolicyChange(this.isValidLB(this.state), this.state)
        );
        break;
      case TrafficPolicyForm.LB_HTTP_HEADER_NAME:
        this.setState(
          prevState => {
            const loadBalancer = prevState.loadBalancer;
            if (!loadBalancer.consistentHash) {
              loadBalancer.consistentHash = {};
            }
            loadBalancer.consistentHash.httpHeaderName = value;
            return {
              loadBalancer: loadBalancer
            };
          },
          () => this.props.onTrafficPolicyChange(this.isValidLB(this.state), this.state)
        );
        break;
      case TrafficPolicyForm.LB_HTTP_COOKIE_NAME:
        this.setState(
          prevState => {
            const loadBalancer = prevState.loadBalancer;
            if (!loadBalancer.consistentHash) {
              loadBalancer.consistentHash = {};
            } else {
              if (!loadBalancer.consistentHash.httpCookie) {
                loadBalancer.consistentHash.httpCookie = {
                  name: '',
                  ttl: ''
                };
              } else {
                loadBalancer.consistentHash.httpCookie.name = value;
              }
            }
            return {
              loadBalancer: loadBalancer
            };
          },
          () => this.props.onTrafficPolicyChange(this.isValidLB(this.state), this.state)
        );
        break;
      case TrafficPolicyForm.LB_HTTP_COOKIE_TTL:
        this.setState(
          prevState => {
            const consistentHash = prevState.loadBalancer ? prevState.loadBalancer.consistentHash : {};
            if (consistentHash) {
              if (!consistentHash.httpCookie) {
                consistentHash.httpCookie = {
                  name: '',
                  ttl: ''
                };
              } else {
                consistentHash.httpCookie.ttl = value;
              }
            }
            return {
              loadBalancer: {
                consistentHash: consistentHash
              }
            };
          },
          () => this.props.onTrafficPolicyChange(this.isValidLB(this.state), this.state)
        );
        break;
      case TrafficPolicyForm.PA_SWITCH:
        this.setState(
          prevState => {
            return {
              peerAuthnSelector: {
                addPeerAuthentication: !prevState.peerAuthnSelector.addPeerAuthentication,
                addPeerAuthnModified: !prevState.peerAuthnSelector.addPeerAuthnModified,
                mode: prevState.peerAuthnSelector.mode
              }
            };
          },
          () => this.props.onTrafficPolicyChange(this.isValidTLS(this.state), this.state)
        );
        break;
      case TrafficPolicyForm.PA_MODE:
        this.setState(
          prevState => {
            return {
              peerAuthnSelector: {
                addPeerAuthentication: prevState.peerAuthnSelector.addPeerAuthentication,
                addPeerAuthnModified: prevState.peerAuthnSelector.addPeerAuthnModified,
                mode: value as PeerAuthenticationMutualTLSMode
              }
            };
          },
          () => this.props.onTrafficPolicyChange(this.isValidTLS(this.state), this.state)
        );
        break;
      default:
      // No default action
    }
  };

  render() {
    const isValidLB = this.isValidLB(this.state);
    return (
      <Form isHorizontal={true}>
        <FormGroup label="TLS" fieldId="advanced-tls">
          <FormSelect
            value={this.state.mtlsMode}
            onChange={(mtlsMode: string) => this.onFormChange(TrafficPolicyForm.TLS, mtlsMode)}
            id="advanced-tls"
            name="advanced-tls"
          >
            {mTLSMode.map(mode => (
              <FormSelectOption key={mode} value={mode} label={mode} />
            ))}
          </FormSelect>
        </FormGroup>
        {this.state.mtlsMode === MUTUAL && (
          <>
            <FormGroup
              label="Client Certificate"
              fieldId="clientCertificate"
              isValid={this.state.clientCertificate.length > 0}
              helperTextInvalid="Client Certificate must be non empty"
            >
              <TextInput
                value={this.state.clientCertificate}
                onChange={value => this.onFormChange(TrafficPolicyForm.TLS_CLIENT_CERTIFICATE, value)}
                id="clientCertificate"
                name="clientCertificate"
              />
            </FormGroup>
            <FormGroup
              label="Private Key"
              fieldId="privateKey"
              isValid={this.state.privateKey.length > 0}
              helperTextInvalid="Private Key must be non empty"
            >
              <TextInput
                value={this.state.privateKey}
                onChange={value => this.onFormChange(TrafficPolicyForm.TLS_PRIVATE_KEY, value)}
                id="privateKey"
                name="privateKey"
              />
            </FormGroup>
            <FormGroup label="CA Certificates" fieldId="caCertificates">
              <TextInput
                value={this.state.caCertificates}
                onChange={value => this.onFormChange(TrafficPolicyForm.TLS_CA_CERTIFICATES, value)}
                id="caCertificates"
                name="caCertificates"
              />
            </FormGroup>
          </>
        )}
        <FormGroup label="Add PeerAuthentication" fieldId="advanced-paSwitch">
          <Switch
            id="advanced-paSwitch"
            label={' '}
            labelOff={' '}
            isChecked={this.state.peerAuthnSelector.addPeerAuthentication}
            onChange={() => this.onFormChange(TrafficPolicyForm.PA_SWITCH, '')}
          />
        </FormGroup>
        {this.state.peerAuthnSelector.addPeerAuthentication && (
          <FormGroup fieldId="advanced-pa-mode" label="Mode">
            <FormSelect
              value={this.state.peerAuthnSelector.mode}
              onChange={(mode: string) => this.onFormChange(TrafficPolicyForm.PA_MODE, mode)}
              id="trafficPolicy-pa-mode"
              name="trafficPolicy-pa-mode"
            >
              {Object.keys(PeerAuthenticationMutualTLSMode).map(mode => (
                <FormSelectOption key={mode} value={mode} label={mode} />
              ))}
            </FormSelect>
          </FormGroup>
        )}
        <FormGroup label="Add LoadBalancer" fieldId="advanced-lbSwitch">
          <Switch
            id="advanced-lbSwitch"
            label={' '}
            labelOff={' '}
            isChecked={this.state.addLoadBalancer}
            onChange={() => this.onFormChange(TrafficPolicyForm.LB_SWITCH, '')}
          />
        </FormGroup>
        {this.state.addLoadBalancer && (
          <>
            <FormGroup fieldId="selectLBType">
              <Radio
                id="selectLBTypeSimple"
                name="selectLBType"
                label="Simple"
                isDisabled={!this.state.addLoadBalancer}
                isChecked={this.state.simpleLB}
                onChange={() => this.onFormChange(TrafficPolicyForm.LB_SELECT, 'true')}
              />
              <Radio
                id="selectLBTypeConsistentHash"
                name="selectLBType"
                label="Consistent Hash"
                isDisabled={!this.state.addLoadBalancer}
                isChecked={!this.state.simpleLB}
                onChange={() => this.onFormChange(TrafficPolicyForm.LB_SELECT, 'false')}
              />
            </FormGroup>
            {this.state.simpleLB && (
              <FormGroup fieldId="advanced-loadbalancer" label="LoadBalancer">
                <FormSelect
                  value={this.state.loadBalancer.simple}
                  onChange={(simple: string) => this.onFormChange(TrafficPolicyForm.LB_SIMPLE, simple)}
                  id="trafficPolicy-lb"
                  name="trafficPolicy-lb"
                >
                  {loadBalancerSimple.map(simple => (
                    <FormSelectOption key={simple} value={simple} label={simple} />
                  ))}
                </FormSelect>
              </FormGroup>
            )}
            {!this.state.simpleLB && (
              <FormGroup fieldId="selectConsistentHashType">
                <Radio
                  id="httpHeaderName"
                  name="selectConsistentHashType"
                  label="HTTP Header Name"
                  isDisabled={!this.state.addLoadBalancer}
                  isChecked={this.state.consistentHashType === ConsistentHashType.HTTP_HEADER_NAME}
                  onChange={() =>
                    this.onFormChange(TrafficPolicyForm.LB_CONSISTENT_HASH, ConsistentHashType.HTTP_HEADER_NAME)
                  }
                />
                <Radio
                  id="httpCookie"
                  name="selectConsistentHashType"
                  label="HTTP Cookie"
                  isDisabled={!this.state.addLoadBalancer}
                  checked={this.state.consistentHashType === ConsistentHashType.HTTP_COOKIE}
                  onChange={() =>
                    this.onFormChange(TrafficPolicyForm.LB_CONSISTENT_HASH, ConsistentHashType.HTTP_COOKIE)
                  }
                />
                <Radio
                  id="sourceIp"
                  name="selectConsistentHashType"
                  label="Source IP"
                  isDisabled={!this.state.addLoadBalancer}
                  isChecked={this.state.consistentHashType === ConsistentHashType.USE_SOURCE_IP}
                  onChange={() =>
                    this.onFormChange(TrafficPolicyForm.LB_CONSISTENT_HASH, ConsistentHashType.USE_SOURCE_IP)
                  }
                />
              </FormGroup>
            )}
            {!this.state.simpleLB && this.state.consistentHashType === ConsistentHashType.HTTP_HEADER_NAME && (
              <FormGroup
                label="HTTP Header Name"
                fieldId="httpHeaderName"
                isValid={isValidLB}
                disabled={!this.state.addLoadBalancer}
                helperTextInvalid="HTTP Header Name must be non empty"
              >
                <TextInput
                  value={
                    this.state.loadBalancer.consistentHash && this.state.loadBalancer.consistentHash.httpHeaderName
                      ? this.state.loadBalancer.consistentHash.httpHeaderName
                      : ''
                  }
                  id="httpHeaderName"
                  name="httpHeaderName"
                  onChange={value => this.onFormChange(TrafficPolicyForm.LB_HTTP_HEADER_NAME, value)}
                  isValid={isValidLB}
                />
              </FormGroup>
            )}
            {!this.state.simpleLB && this.state.consistentHashType === ConsistentHashType.HTTP_COOKIE && (
              <>
                <FormGroup
                  label="HTTP Cookie Name"
                  fieldId="httpCookieName"
                  isValid={isValidLB}
                  disabled={!this.state.addLoadBalancer}
                >
                  <TextInput
                    value={
                      this.state.loadBalancer.consistentHash && this.state.loadBalancer.consistentHash.httpCookie
                        ? this.state.loadBalancer.consistentHash.httpCookie.name
                        : ''
                    }
                    id="httpCookieName"
                    name="httpCookieName"
                    onChange={value => this.onFormChange(TrafficPolicyForm.LB_HTTP_COOKIE_NAME, value)}
                    isValid={isValidLB}
                  />
                </FormGroup>
                <FormGroup
                  label="HTTP Cookie TTL"
                  fieldId="httpCookieTtl"
                  isValid={isValidLB}
                  disabled={!this.state.addLoadBalancer}
                  helperText="TTL is expressed in nanoseconds (i.e. 1000, 2000, etc) or seconds (i.e. 10s, 1.5s, etc)."
                  helperTextInvalid="HTTP Cookie Name must be non empty and TTL must be expressed in in nanoseconds (i.e. 1000, 2000, etc) or seconds (i.e. 10s, 1.5s, etc)."
                >
                  <TextInput
                    value={
                      this.state.loadBalancer.consistentHash && this.state.loadBalancer.consistentHash.httpCookie
                        ? this.state.loadBalancer.consistentHash.httpCookie.ttl
                        : ''
                    }
                    id="httpCookieTtl"
                    name="httpCookieTtl"
                    onChange={value => this.onFormChange(TrafficPolicyForm.LB_HTTP_COOKIE_TTL, value)}
                    isValid={isValidLB}
                  />
                </FormGroup>
              </>
            )}
          </>
        )}
      </Form>
    );
  }
}

const mapStateToProps = (state: KialiAppState) => ({
  meshWideStatus: meshWideMTLSStatusSelector(state)
});

const TraffiPolicyContainer = connect(mapStateToProps)(TrafficPolicy);
export default TraffiPolicyContainer;
