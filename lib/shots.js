/** ================================================================================================
 *  @filename  shots.js
 *  @author  brikcss  <https://github.com/brikcss>
 *  @description  UI visual regression test tool.
 ** ============================================================================================= */

/** Set up environment.
 ============================================================================================= */

const puppeteer = require('puppeteer');
const pixelmatch = require('pixelmatch');
const png = require('pngjs').PNG;
const fs = require('fs-extra');
const log = require('loglevel');
const server = require('browser-sync').create();
const glob = require('fast-glob');
const path = require('path');
const colors = require('colors');

/** Helper functions.
 ============================================================================================= */

/**
 *  Take screeshot(s) based on config object.
 *
 *  @param   {String}  outputDir  Destination output directory to save screenshot(s).
 *  @param   {Object}  config  Config object.
 *  @return  {Array}  Test result objects.
 */
async function takeShots(outputDir, config = {}) {
	const promises = [];
	await fs.ensureDir(outputDir);

	// Process each viewport, then each test case.
	config.viewports.forEach((viewport) => {
		config.cases.forEach((testCase) => {
			const id = `${testCase.name}-${viewport.width}x${viewport.height}`;
			testCase = Object.assign(
				{
					id,
					success: false,
					viewport,
					result: `${outputDir}/${id}.png`,
					url: `${config.url}/${testCase.path}`
				},
				testCase
			);
			promises.push(takeShot(testCase, config));
		});
	});

	return Promise.all(promises);
}

/**
 *  Take a single screenshot with puppeteer.
 *
 *  @param   {Object}  testCase  Test configuration.
 *  @param   {Object}  config  Configuration.
 *  @return  {Object}  Test result.
 */
async function takeShot(testCase = {}, config = {}) {
	// Prepare browser page and viewport.
	const browserOptions = process.env.NODE_ENV === 'test' ? { args: ['--no-sandbox'] } : {};
	const browser = await puppeteer.launch(browserOptions);
	const page = await browser.newPage();
	await page.goto(testCase.url);
	await page.setViewport(testCase.viewport);
	// Run beforeShot callback.
	if (typeof config.beforeShot === 'function') {
		await config.beforeShot(testCase, { browser, page, config });
	}
	// Take shot.
	await page.screenshot({
		fullPage: true,
		path: testCase.result
	});
	log.info(`  Saved shot to ${testCase.result}.`.dim);
	// Run afterShot callback.
	if (typeof config.afterShot === 'function') {
		await config.afterShot(testCase, { browser, page, config });
	}
	// Clean up.
	await browser.close();
	testCase.success = true;
	return testCase;
}

/**
 *  Compare a source png with a base png to determine if they match.
 *
 *  @param   {String}  sourcePath  Path to source png.
 *  @param   {String}  basePath  Path to base png.
 *  @param   {Object}  config  Configuration.
 *  @return  {Object}  Promise for result Object.
 */
function compareShots(sourcePath, basePath, config = {}) {
	return new Promise((resolve, reject) => {
		if (!fs.pathExistsSync(sourcePath)) {
			return reject(new Error(`Uh oh... source image ${sourcePath} does not exist.`));
		}
		if (!fs.pathExistsSync(basePath)) {
			return reject(
				new Error(
					`Baseline image ${basePath} does not exist. Make sure to create baseline shots first.`
				)
			);
		}

		const sourceImg = fs
			.createReadStream(sourcePath)
			.pipe(new png())
			.on('parsed', doneReading);
		const baseImg = fs
			.createReadStream(basePath)
			.pipe(new png())
			.on('parsed', doneReading);
		let filesRead = 0;

		function doneReading() {
			if (++filesRead < 2) return;

			const diff = new png({ width: sourceImg.width, height: baseImg.height });
			const badPixels = pixelmatch(
				sourceImg.data,
				baseImg.data,
				diff.data,
				sourceImg.width,
				sourceImg.height,
				{ threshold: config.threshold }
			);
			const diffPath = sourcePath.replace('.png', '--diff.png');
			if (badPixels) {
				log.info(colors.red.dim(`  ${config.id || 'Test'} failed: ${diffPath}`));
				diff.pack().pipe(fs.createWriteStream(diffPath));
			}

			return resolve({
				success: badPixels === 0,
				baseline: basePath,
				result: sourcePath,
				diff: badPixels ? diffPath : null,
				badPixels
			});
		}
	});
}

/**
 *  Merge inline config and config file with defaults.
 *
 *  @param   {Object}  config  Config object.
 *  @param  {Boolean}  validate  Whether to validate config properties.
 *  @return  {Object}  Config object.
 */
function setupConfig(config = {}, validate = true) {
	return new Promise((resolve) => {
		let configFile = {};
		config.config = config.config || '.shotsrc.js';
		if (config.config && fs.pathExistsSync(config.config)) {
			configFile = require(path.resolve(config.config));
		}
		config = Object.assign(
			{
				url: 'http://localhost:4000',
				cases: [],
				viewports: [
					{
						// Wide screen.
						width: 1400,
						height: 1024
					},
					{
						// Desktop / landscape tablets.
						width: 1024,
						height: 768
					},
					{
						// Tablet (iPad 1-2+).
						width: 768,
						height: 1024
					},
					{
						// Mobile (iPhone 4-5+, Galaxy S3-S4+).
						width: 320,
						height: 640
					}
				],
				browserSync: {},
				threshold: 0.05,
				log: process.env.LOGLEVEL,
				debug: false,
				exit: false,
				baseDir: '.shots/base',
				currentDir: '.shots/current'
			},
			config,
			configFile
		);

		if (config.log) log.setLevel(config.log);

		if (validate && !config.url) throw new Error('Server path required.');
		if (validate && (!(config.cases instanceof Array) || !config.cases.length)) {
			throw new Error('No test cases have been configured.');
		}

		return resolve(config);
	});
}

/**
 *  Parse test results into a result object.
 *
 *  @param   {Array}  tests  Test result objects.
 *  @param   {Object}  options  Options.
 *  @return  {Object}  Result object.
 */
function parseTestResults(tests = [], { task = 'test' } = {}) {
	// Create a uniform result object.
	const result = {
		task,
		success: tests.every((testCase) => testCase.success),
		fails: tests.filter((testCase) => !testCase.success) || [],
		tests
	};

	// Fail. :(
	if (!result.success) return Promise.reject(result);

	// Success! :)
	logResults(result);
	return result;
}

/**
 *  Handle errors.
 *
 *  @param   {Object|Error}  result  Error or result object.
 *  @param  {Object}  config  Configuration object.
 *  @return  {Object}  Result object.
 */
function handleErrors(result = {}, config = {}) {
	// Stop the server.
	if (config.browserSync) stopServer(config);

	// Support passing tests in place of result...
	if (result instanceof Error) {
		result = {
			success: false,
			error: result,
			fails: [],
			result
		};
	}

	// Attach error to result object and log helpful information.
	if (!result.error) result.error = new Error();

	// Log the error and return the result.
	logResults(result);
	log.error(colors.red(config.debug ? result.error.stack : result.error.message));
	if (config.exit) process.exit(1);
	return result;
}

/**
 *  Log test results.
 *
 *  @param   {Object}  result  Result object.
 *  @return  {String}  Message to log.
 */
function logResults(result = {}) {
	let width = 0;
	let offset = 6;
	let lines = [];
	if (!result.tests || !result.tests.length) return;

	const taskName =
		result.task === 'baseline'
			? 'Baseline shots'
			: result.task === 'test'
				? 'Test cases'
				: 'Task';
	const resultVerb = result.success
		? `${result.task === 'test' ? 'passed' : 'complete'}! :)`
		: 'failed... :(';
	const prefix = result.success ? '[ok]' : '[!!]';
	lines.push(
		`${colors.bold[result.success ? 'green' : 'red'](`${prefix} ${taskName} ${resultVerb}`)}`
	);

	if (log.getLevel() <= 3) {
		result.tests.forEach((testCase, i) => {
			width = Math.max(
				width,
				testCase.baseline ? testCase.baseline.length + offset : offset,
				testCase.result.length + offset,
				testCase.diff ? testCase.diff.length + offset : offset,
				40
			);
			const resultLines = [];
			resultLines.push(
				`${testCase.success ? '✓'.bold.green : '✕'.bold.red} ${
					testCase.baseline ? testCase.baseline : testCase.result
				}`
			);
			if (testCase.baseline) resultLines.push('  ' + testCase.result);
			if (!testCase.success && testCase.diff) resultLines.push('  ' + testCase.diff);
			if (resultLines.length > 1 && i + 1 < result.tests.length) resultLines.push('');
			lines.push('  ' + resultLines.join('\n  '));
		});

		lines.splice(
			1,
			0,
			'\n' + '='.repeat(width),
			`  ${colors.bold('RESULTS:')}`,
			'-'.repeat(width)
		);
		lines.push(
			'-'.repeat(width),
			`  ${colors.bold('TOTAL: ' + result.tests.length)}    ${colors.green(
				'PASSES: ' + (result.tests.length - result.fails.length)
			)}    ${colors.red('FAILS: ' + result.fails.length)}`,
			'='.repeat(width)
		);
	}

	return log.error(lines.join('\n'));
}

/**
 *  Start browser-sync local server.
 *
 *  @param   {Object}  options  Browser-sync options.
 *  @return  {Unknown}  Result of server.init().
 */
function startServer(options = {}) {
	return server.init(
		Object.assign(
			{
				server: '.',
				// startPath: null,
				single: true
			},
			options,
			{
				port: 4000,
				logLevel: 'silent',
				logFileChanges: false,
				scrollProportionally: false,
				notify: false,
				open: false
			}
		)
	);
}

/**
 *  Stop browser-sync local server.
 *  @return  {Unknown}  Result of server.exit().
 */
function stopServer() {
	return server.exit();
}

/** Methods.
 ============================================================================================= */

/**
 *  Take new baseline shots.
 *
 *  @param   {Object}  config  Configuration.
 *  @return  {Object}  Promise => result object.
 */
function baseline(config = {}) {
	return setupConfig(config)
		.then((result) => {
			log.warn('\nTaking baseline shots...');
			config = result;
			if (config.browserSync) startServer(config.browserSync);
			return takeShots(config.baseDir, config);
		})
		.then((tests) => {
			if (config.browserSync) stopServer();
			return parseTestResults(tests, { task: 'baseline' });
		})
		.catch((error) => handleErrors(error, config));
}

/**
 *  Run a new regression test to compare to baseline shots.
 *
 *  @param   {Object}  config  Configuration.
 *  @return  {Object}  Promise => result object.
 */
function test(config = {}) {
	return setupConfig(config)
		.then((result) => {
			log.warn('\nRunning regression tests...');
			config = result;
			if (config.browserSync) startServer(config.browserSync);
			return takeShots(config.currentDir, config);
		})
		.then((tests) => {
			const comparePromises = [];
			tests.forEach((testCase, i) => {
				comparePromises.push(
					compareShots(
						testCase.result,
						testCase.result.replace(config.currentDir, config.baseDir),
						Object.assign({ id: testCase.id }, config)
					).then((result) => (tests[i] = Object.assign(tests[i], result)))
				);
			});
			if (config.browserSync) stopServer();
			return Promise.all(comparePromises).then((tests) => parseTestResults(tests));
		})
		.catch((error) => handleErrors(error, config));
}

/**
 *  Approve test shots and promote as new baseline.
 *
 *  @param   {Object}  config  Configuration.
 *  @return  {Object}  Promise => result object.
 */
function approve(config = {}) {
	// Copy current shots to base shots.
	return setupConfig(config, false).then((result) => {
		config = result;
		config.ignore = [`${config.currentDir}/**/*--diff.png`];
		let source = config.currentDir + '/**/*.png';
		if (config.name !== undefined) {
			source = `${config.currentDir}/**/${
				config.name instanceof Array ? config.name.join(',') : config.name
			}*.png`;
		}
		return glob(source, {
			ignore: config.ignore
		})
			.then((filepaths) => {
				filepaths.forEach((filepath) => {
					fs.copy(filepath, filepath.replace(config.currentDir, config.baseDir));
					log.info(colors.dim(`\`${filepath}\` approved.`));
				});
				log.warn(colors.green.bold('[ok] All shots approved!'));
				return {
					success: true,
					filepaths
				};
			})
			.catch((error) => handleErrors(error, config));
	});
}

module.exports = {
	default: test,
	baseline,
	test,
	approve,
	compare: compareShots
};
