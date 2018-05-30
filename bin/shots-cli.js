#! /usr/bin/env node
/** ================================================================================================
 *  @filename  shots-cli.js
 *  @author  brikcss  <https://github.com/brikcss>
 *  @description  CLI wrapper around shots.
 ** ============================================================================================= */

/** Set up environment.
 ============================================================================================= */

const shots = require('../lib/shots.js');
const minimistOptions = {
	alias: {
		name: 'N',
		config: 'C',
		viewports: 'V',
		threshold: 'T',
		shotsDir: 'S',
		log: 'l'
	}
};
let config = require('minimist')(process.argv.slice(2), minimistOptions);

// Parse options.
const cmd = config._.splice(0, 1)[0] || 'test';
if (!shots[cmd]) throw new Error(`\`${cmd}\` is not a command known to shots...`);
// if (config._[0]) config.path = config._[0];
if (config.viewports) {
	const viewports = [];
	config.viewports = config.viewports.split(',');
	config.viewports.forEach((viewport, i) => {
		viewport = viewport.split('x');
		viewports[i] = {
			width: parseInt(viewport[0], 10),
			height: parseInt(viewport[1], 10)
		};
	});
	config.viewports = viewports;
}

// Remove alias keys.
Object.keys(minimistOptions.alias).forEach((key) => {
	delete config[minimistOptions.alias[key]];
});

/** Run shots.
 ============================================================================================= */

shots[cmd](config);
