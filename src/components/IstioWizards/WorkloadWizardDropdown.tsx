import * as React from 'react';
import { Dropdown, DropdownItem, DropdownPosition, DropdownToggle } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { serverConfig } from '../../config';
import { Workload } from '../../types/Workload';
import { isThreeScaleLinked, WIZARD_THREESCALE_LINK, WIZARD_THREESCALE_UNLINK } from './WizardActions';
import WorkloadWizard from './WorkloadWizard';
import { IstioRule } from '../../types/IstioObjects';

interface Props {
  workload?: Workload;
  rules: IstioRule[];
  onChange: () => void;
}

interface State {
  isActionsOpen: boolean;
  showWizard: boolean;
  type: string;
}

class WorkloadWizardDropdown extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isActionsOpen: false,
      showWizard: false,
      type: ''
    };
  }

  onActionsSelect = () => {
    this.setState({
      isActionsOpen: !this.state.isActionsOpen
    });
  };

  onActionsToggle = (isOpen: boolean) => {
    this.setState({
      isActionsOpen: isOpen
    });
  };

  onAction = (key: string) => {
    switch (key) {
      case WIZARD_THREESCALE_LINK:
        this.setState({
          showWizard: true,
          type: WIZARD_THREESCALE_LINK
        });
        break;
      case WIZARD_THREESCALE_UNLINK:
        console.log('TODELETE Unlink existing 3scale');
        break;
      default:
      // Nothing to add
    }
  };

  onClose = (changed: boolean) => {
    this.setState({ showWizard: false });
    if (changed) {
      this.props.onChange();
    }
  };

  renderDropdownItems = (): JSX.Element[] => {
    const items: JSX.Element[] = [];
    if (serverConfig.extensions?.threescale.enabled && this.props.workload) {
      if (isThreeScaleLinked(this.props.workload)) {
        items.push(
          <DropdownItem
            key={WIZARD_THREESCALE_UNLINK}
            component="button"
            onClick={() => this.onAction(WIZARD_THREESCALE_UNLINK)}
          >
            Unlink 3scale Authorization
          </DropdownItem>
        );
      } else {
        items.push(
          <DropdownItem
            key={WIZARD_THREESCALE_LINK}
            component="button"
            onClick={() => this.onAction(WIZARD_THREESCALE_LINK)}
          >
            Link 3scale Authorization
          </DropdownItem>
        );
      }
    }
    return items;
  };

  render() {
    const validActions = true;
    const dropdown = (
      <Dropdown
        position={DropdownPosition.right}
        onSelect={this.onActionsSelect}
        toggle={
          <DropdownToggle onToggle={this.onActionsToggle} iconComponent={CaretDownIcon}>
            Actions
          </DropdownToggle>
        }
        isOpen={this.state.isActionsOpen}
        dropdownItems={this.renderDropdownItems()}
        disabled={!validActions}
        style={{ pointerEvents: validActions ? 'auto' : 'none' }}
      />
    );
    return (
      <>
        {dropdown}
        <WorkloadWizard
          show={this.state.showWizard}
          type={this.state.type}
          rules={this.props.rules}
          onClose={this.onClose}
        />
      </>
    );
  }
}

export default WorkloadWizardDropdown;
