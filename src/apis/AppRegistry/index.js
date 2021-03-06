/**
 * Copyright (c) 2015-present, Nicolas Gallagher.
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * @flow
 */

import { Component } from 'react';
import invariant from 'fbjs/lib/invariant';
import ReactDOM from 'react-dom';
import renderApplication, { prerenderApplication } from './renderApplication';

const runnables = {};

type ComponentProvider = () => Component<any, any, any>

type AppConfig = {
  appKey: string;
  component?: ComponentProvider;
  run?: Function;
};

/**
 * `AppRegistry` is the JS entry point to running all React Native apps.
 */
class AppRegistry {
  static getAppKeys(): Array<string> {
    return Object.keys(runnables);
  }

  static prerenderApplication(appKey: string, appParameters?: Object): string {
    invariant(
      runnables[appKey] && runnables[appKey].prerender,
      `Application ${appKey} has not been registered. ` +
      'This is either due to an import error during initialization or failure to call AppRegistry.registerComponent.'
    );

    return runnables[appKey].prerender(appParameters);
  }

  static registerComponent(appKey: string, getComponentFunc: ComponentProvider): string {
    runnables[appKey] = {
      run: ({ initialProps, rootTag }) => renderApplication(getComponentFunc(), initialProps, rootTag),
      prerender: ({ initialProps } = {}) => prerenderApplication(getComponentFunc(), initialProps)
    };
    return appKey;
  }

  static registerConfig(config: Array<AppConfig>) {
    config.forEach(({ appKey, component, run }) => {
      if (run) {
        AppRegistry.registerRunnable(appKey, run);
      } else {
        invariant(component, 'No component provider passed in');
        AppRegistry.registerComponent(appKey, component);
      }
    });
  }

  // TODO: fix style sheet creation when using this method
  static registerRunnable(appKey: string, run: Function): string {
    runnables[appKey] = { run };
    return appKey;
  }

  static runApplication(appKey: string, appParameters?: Object): void {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const params = { ...appParameters };
    params.rootTag = `#${params.rootTag.id}`;

    console.log(
      `Running application "${appKey}" with appParams: ${JSON.stringify(params)}. ` +
      `development-level warnings are ${isDevelopment ? 'ON' : 'OFF'}, ` +
      `performance optimizations are ${isDevelopment ? 'OFF' : 'ON'}`
    );

    invariant(
      runnables[appKey] && runnables[appKey].run,
      `Application "${appKey}" has not been registered. ` +
      'This is either due to an import error during initialization or failure to call AppRegistry.registerComponent.'
    );

    runnables[appKey].run(appParameters);
  }

  static unmountApplicationComponentAtRootTag(rootTag) {
    ReactDOM.unmountComponentAtNode(rootTag);
  }
}

module.exports = AppRegistry;
