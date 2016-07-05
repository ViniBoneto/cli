/**
 * Check if the command is launched from a lager project (if there is a lager.json file)
 * If yes, load the @lager/lager node module with the configuration
 */

'use strict';

const path = require('path');

module.exports = function loadLagerProject(icli) {
  const lager = getLager();

  if (lager) {
    // If the command is launched from a lager project, we initialize the Lager instance
    return lager.init(getConfig())
    .then(() => {
      // We fire the "registerCommands" event so plugins can add their own commands
      return lager.fireConcurrently('registerCommands', icli);
    })
    .spread(() => {
      // Finally, we execute the cli
      icli.getProgram().parse(process.argv);
    });
  }

  // if there is no lager instance to initialise, we return a resolved promise
  return Promise.resolve();
};

/**
 * Check if the directory in which the command is launched contains a @lager/lager node module and return it
 * @return {Lager} - a lager instance
 */
function getLager() {
  try {
    return require(path.join(process.cwd(), 'node_modules', '@lager', 'lager'));
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND' || e.message.slice(e.message.length - 13, -1) !== '@lager/lager') {
      throw e;
    }
    return void 0;
  }
}

/**
 * Check if the directory in which the command is launched contains a lager.json configuration file and return it
 * @return {Object} - an object that will be consumed by a Lager instance
 */
function getConfig() {
  try {
    // try to load a lager.json file
    return require(path.join(process.cwd(), 'lager.json'));
  } catch (e) {
    return {};
  }
}
