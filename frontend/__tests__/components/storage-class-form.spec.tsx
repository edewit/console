/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import Spy = jasmine.Spy;
import { Form } from 'patternfly-react';

import {ConnectedStorageClassForm, StorageClassFormProps, StorageClassFormState} from '../../public/components/storage-class-form';

describe(ConnectedStorageClassForm.displayName, () => {
  const Component: React.ComponentType<StorageClassFormProps> = ConnectedStorageClassForm.WrappedComponent as any;
  let wrapper: ShallowWrapper<StorageClassFormProps, StorageClassFormState>;
  let onClose: Spy;
  let watchK8sList: Spy;
  let stopK8sWatch: Spy;
  let k8s: Spy;

  beforeEach(() => {
    onClose = jasmine.createSpy('onClose');
    watchK8sList = jasmine.createSpy('watchK8sList');
    stopK8sWatch = jasmine.createSpy('stopK8sWatch');
    k8s = jasmine.createSpy('k8s');

    wrapper = shallow(
      <Component
        onClose={onClose}
        watchK8sList={watchK8sList}
        stopK8sWatch={stopK8sWatch}
        k8s={k8s} />
    );
  });

  it('renders the proper header', () => {
    expect(wrapper.find('.co-m-pane__heading').text()).toEqual('Create Storage Class');
  });

  it('renders a form', () => {
    expect(wrapper.find(Form).exists()).toBe(true);
  });

  it('renders a dropdown for selecting the reclaim policy', () => {
    expect(wrapper.find({title: 'Select Reclaim Policy'}).exists()).toBe(true);
  });

  it('renders a text box for selecting the storage class name', () => {
    expect(wrapper.find('#storage-class-name').exists()).toBe(true);
  });

  it('renders type-specific settings when storage type is set', () => {
    expect(wrapper.find({title: 'Select AWS Type'}).exists()).toBe(false);
    wrapper.setState({
      newStorageClass: {
        ...wrapper.state().newStorageClass,
        type: 'aws',
      },
    });
    expect(wrapper.find({title: 'Select AWS Type'}).exists()).toBe(true);
  });

  it('renders an error message when storage class creation fails', () => {
    const errorMsg = 'Storage creation failed';
    expect(wrapper.find({errorMessage: errorMsg}).exists()).toBe(false);
    wrapper.setState({error: {message: errorMsg}});
    expect(wrapper.find({errorMessage: errorMsg}).exists()).toBe(true);
  });
});
