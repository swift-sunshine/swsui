import * as React from 'react';
import { shallow } from 'enzyme';
import Labels from '../Labels';

const mockBadge = (labels: { [key: string]: string }) => {
  const component = <Labels labels={labels} />;
  return shallow(component);
};

describe('#Labels render correctly with data', () => {
  it('should render badges with More labels link', () => {
    const wrapper = mockBadge({
      app: 'bookinfo',
      version: 'v1',
      env: 'prod',
      team: 'A'
    });

    expect(wrapper).toBeDefined();
    expect(wrapper).toMatchSnapshot();
  });

  it('should render badges without More labels link', () => {
    const wrapper = mockBadge({
      app: 'bookinfo',
      version: 'v1'
    });

    expect(wrapper).toBeDefined();
    expect(wrapper).toMatchSnapshot();
  });
});
