/**
 * Check if the command is launched from a lager project (if there is a lager.json file)
 * If yes, load the @lager/lager node module with the configuration
 */

'use strict';

const path = require('path');
const fs = require('fs');
const _ = require('lodash');

let config;

const lager = getLager();

if (lager) {
  const config = getConfig();
  lager.configure(config);
}


config.plugins = config.plugins || [];

// We register the core plugin that create basic cli commands
const pluginPaths = [require.resolve('./src/lib/core-plugin')];

// Calculate paths to project specific plugins
_.forEach(config['local-plugins-paths'], lpp => {
  const pluginNames = fs.readdirSync(lpp);
  _.forEach(pluginNames, (pluginName) => {
    try {
      pluginPaths.push(require.resolve(path.join(process.cwd(), lpp, pluginName)));
    } catch (e) {
      console.log(path.join(process.cwd(), lpp, pluginName) + ' is not a node module');
    }
  });
});

// Calculate paths to plugins installed via npm
_.forEach(config.plugins, pluginIdentifier => {
  try {
    pluginPaths.push(require.resolve(pluginIdentifier));
  } catch (e) {
    try {
      // For now some plugins are embedded in the lager package, but if we create an npm package for each plugin,
      // we can delete this inner try-catch
      pluginPaths.push(require.resolve('.' + path.sep + path.join('src', 'plugins', pluginIdentifier)));
    } catch (e) {
      console.log('  The plugin ' + pluginIdentifier + ' could not be found.');
      console.log('  Maybe you forget to install it:');
      console.log('    * npm install ' + pluginIdentifier + ' --save');
      console.log('    * npm install ' + pluginIdentifier + ' -g');
    }
  }
});

_.map(pluginPaths, lager.registerPlugin.bind(lager));

module.exports = lager;

function getLager() {
  try {
    return require(path.join(process.cwd(), 'node_modules', '@lager', 'lager'));
  } catch (e) {
    console.log(e);
    return void 0;
  }
}

function getConfig() {
  try {
    // try to load a lager.json file
    config = require(path.join(process.cwd(), 'lager.json'));
  } catch (e) {
    // Later, we could imagine a .lagerrc file in the home directory of the user to configure things like coloration
    // This configuration would be merged with the lager.json file specific to the project
    config = {};
  }

  // If we find a Lager configuration file, we inject default values
  config['local-plugins-paths'] = config['local-plugins-paths'] || ['./plugins'];
  if (_.isString(config['local-plugins-paths'])) {
    config['local-plugins-paths'] = [config['local-plugins-paths']];
  }
}
