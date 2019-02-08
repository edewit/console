import * as React from 'react';
import { render } from 'react-dom';

import {HubNSpoke} from 'launcher-frontend';

export class Launcher extends React.Component {
  render() {
    const items = [
      {
        title: 'Hub1',
        overview: {
          component: (<p>this is hub 1 overview</p>),
        },
        form: {
          component: (<p>this is hub 1 edition form</p>),
        }
      },
      {
        title: 'Hub2',
        overview: {
          component: (<p>this is hub 2 overview</p>),
        },
        form: {
          component: (<p>this is hub 2 edition form</p>),
        }
      },
      {
        title: 'Hub3',
        overview: {
          component: (<p>this is hub 3 overview</p>),
          width: 'full',
        },
        form: {
          component: (<p>this is hub 3 edition form</p>),
        }
      }
    ];

    return <HubNSpoke items={items}/>;
  }
}
