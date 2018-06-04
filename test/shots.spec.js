/* eslint-env mocha */
const assert = require('assert');
const shots = require('../lib/shots.js');
const rm = require('rimraf');
const fs = require('fs-extra');
// const exec = require('execa');
process.env.LOGLEVEL = 'info';

let config = {
	url: 'http://localhost:4000',
	viewports: [
		{
			width: 1280,
			height: 768
		},
		{
			width: 320,
			height: 640
		}
	],
	cases: [
		{
			name: 'home',
			path: 'index.html'
		},
		{
			name: 'feature',
			path: 'feature.html'
		}
	],
	server: {
		rootPath: 'test/fixtures/pages'
	},
	exit: false,
	debug: process.env.NODE_ENV === 'test'
};
const beforeShot = (test, { page }) => {
	return page.evaluate(() => {
		document.querySelectorAll('p').forEach((element) => (element.style.display = 'none'));
	});
};

describe('walk thru entire shots workflow', function() {
	this.timeout(6000);

	before(() => {
		rm.sync('.shots');
	});

	context('baseline()', () => {
		it('creates and saves new baseline shots', () => {
			return shots.baseline(config).then((result) => {
				assert.ok(result.success);
				assert.ok(result.tests instanceof Array);
				assert.equal(result.tests.length, 4);
				result.tests.forEach((test) => {
					assert.ok(fs.pathExistsSync(test.result));
				});
			});
		});
	});

	context('test()', () => {
		it('passes with no diffs', () => {
			return shots.test(config).then((result) => {
				assert.ok(result.success);
				assert.ok(result.tests instanceof Array);
				assert.equal(result.tests.length, 4);
				result.tests.forEach((test) => {
					assert.ok(fs.pathExistsSync(test.result));
				});
			});
		});

		it('fails when diffs are found', () => {
			return shots
				.test(
					Object.assign({}, config, {
						beforeShot,
						afterShot: (testCase) => {
							// eslint-disable-next-line
							console.log('Test ran:', testCase.id);
						}
					})
				)
				.then((result) => {
					let fails = 0;
					assert.ok(!result.success);
					assert.ok(result.error instanceof Error);
					assert.equal(result.tests.length, 4);
					result.tests.forEach((test) => {
						if (!test.success) fails++;
						assert.ok(fs.pathExistsSync(test.result));
						assert.ok(fs.pathExistsSync(test.result.replace('.png', '--diff.png')));
					});
					assert.equal(fails, 4);
				});
		});
	});

	context('approve()', () => {
		it('approves a single shot', () => {
			return shots
				.approve({ name: 'home-320x640', debug: process.env.NODE_ENV === 'test' })
				.then(() =>
					shots.test(
						Object.assign({}, config, {
							beforeShot
						})
					)
				)
				.then((result) => {
					let successes = 0;
					assert.ok(!result.success);
					assert.ok(result.tests instanceof Array);
					assert.equal(result.tests.length, 4);
					result.tests.forEach((test) => {
						if (test.success) successes++;
						assert.ok(fs.pathExistsSync(test.result));
					});
					assert.ok(successes === 1);
				});
		});

		it('approves all shots', () => {
			return shots
				.approve({
					debug: process.env.NODE_ENV === 'test'
				})
				.then(() =>
					shots.test(
						Object.assign({}, config, {
							beforeShot
						})
					)
				)
				.then((result) => {
					let successes = 0;
					assert.ok(result.success);
					assert.ok(result.tests instanceof Array);
					assert.equal(result.tests.length, 4);
					result.tests.forEach((test) => {
						if (test.success) successes++;
						assert.ok(fs.pathExistsSync(test.result));
					});
					assert.ok(successes === 4);
				});
		});
	});
});

// describe('baseline()', function() {
// 	this.timeout(6000);

// 	beforeEach(() => {
// 		rm.sync('.shots/base');
// 	});

// 	context('when not properly configured', () => {
// 		it('returns an Error if config.cases is missing', (done) => {
// 			shots
// 				.baseline({
// 					url: 'http://localhost:4000',
// 					debug: process.env.NODE_ENV === 'test'
// 				})
// 				.then((result) => {
// 					assert.ok(result.error instanceof Error);
// 					done();
// 				})
// 				.catch(done);
// 		});
// 	});
// });

// describe('test()', function() {
// 	this.timeout(6000);

// 	beforeEach(() => {
// 		rm.sync('.shots/current');
// 	});

// 	context('when no baseline shot exists', () => {
// 		it('fails', (done) => {
// 			rm.sync('.shots/base');
// 			shots
// 				.test(config)
// 				.then((result) => {
// 					assert.ok(result.error instanceof Error);
// 					done();
// 				})
// 				.catch(done);
// 		});
// 	});

// 	context('when no comparision image exists', () => {
// 		it('fails', (done) => {
// 			rm.sync('.shots/current');
// 			shots
// 				.test(config)
// 				.then((result) => {
// 					assert.ok(result.error instanceof Error);
// 					done();
// 				})
// 				.catch(done);
// 		});
// 	});
// });

// describe('cli()', function() {
// 	this.timeout(6000);

// 	before(() => {
// 		rm.sync('.shots');
// 	});

// 	context('baseline()', () => {
// 		it('creates baseline shots', (done) => {
// 			exec
// 				.shell(
// 					'node bin/shots-cli.js baseline --config ./test/fixtures/configs/.shotsrc.js --debug ' +
// 						(process.env.NODE_ENV === 'test').toString()
// 				)
// 				.then(() => {
// 					['.shots/base/home-320x640.png', '.shots/base/feature-320x640.png'].forEach(
// 						(filepath) => {
// 							assert.ok(fs.pathExistsSync(filepath));
// 						}
// 					);
// 					done();
// 				})
// 				.catch(done);
// 		});
// 	});

// 	context('test()', () => {
// 		it('creates test shots without diffs', (done) => {
// 			const promises = [];
// 			exec
// 				.shell(
// 					'node bin/shots-cli.js test --config ./test/fixtures/configs/.shotsrc.js --debug ' +
// 						(process.env.NODE_ENV === 'test').toString()
// 				)
// 				.then(() => {
// 					[
// 						'.shots/current/home-320x640.png',
// 						'.shots/current/feature-320x640.png'
// 					].forEach(async (filepath) => {
// 						assert.ok(fs.pathExistsSync(filepath));
// 						promises.push(
// 							shots.compare(filepath, filepath.replace('/current/', '/base/'), {
// 								threshold: 0.1
// 							})
// 						);
// 					});

// 					Promise.all(promises).then((results) => {
// 						assert.ok(results.every((test) => test.success));
// 						done();
// 					});
// 				})
// 				.catch(done);
// 		});

// 		it('creates test shots with diffs', function(done) {
// 			const promises = [];
// 			exec
// 				.shell(
// 					'node bin/shots-cli.js test --config test/fixtures/configs/.shots2rc.js --debug ' +
// 						(process.env.NODE_ENV === 'test').toString()
// 				)
// 				.then(() => {
// 					[
// 						'.shots/current/home-320x640.png',
// 						'.shots/current/feature-320x640.png'
// 					].forEach(async (filepath) => {
// 						assert.ok(fs.pathExistsSync(filepath));
// 						promises.push(
// 							shots.compare(filepath, filepath.replace('/current/', '/base/'), {
// 								threshold: 0.1
// 							})
// 						);
// 					});

// 					Promise.all(promises).then((results) => {
// 						const successes = results.filter((test) => test.success);
// 						const fails = results.filter((test) => !test.success);
// 						assert.equal(successes.length, 1);
// 						assert.equal(fails.length, 1);
// 						done();
// 					});
// 				})
// 				.catch(done);
// 		});
// 	});

// 	context('approve()', () => {
// 		beforeEach(() => {
// 			rm.sync('.shots/base');
// 		});

// 		it('moves a single test to baseline', (done) => {
// 			const promises = [];
// 			exec
// 				.shell(
// 					'node bin/shots-cli.js approve --threshold 0.1 --id home --debug ' +
// 						(process.env.NODE_ENV === 'test').toString()
// 				)
// 				.then(() => {
// 					['.shots/base/home-320x640.png'].forEach(async (filepath) => {
// 						assert.ok(fs.pathExistsSync(filepath));
// 						promises.push(
// 							shots.compare(filepath.replace('/base/', '/current/'), filepath, {
// 								threshold: 0.1
// 							})
// 						);
// 					});

// 					Promise.all(promises).then((results) => {
// 						assert.ok(results.length === 1);
// 						assert.ok(results[0].success);
// 						done();
// 					});
// 				})
// 				.catch(done);
// 		});

// 		it('moves current tests to baseline', (done) => {
// 			const promises = [];
// 			exec
// 				.shell(
// 					'node bin/shots-cli.js approve --threshold 0.1 --debug ' +
// 						(process.env.NODE_ENV === 'test').toString()
// 				)
// 				.then(() => {
// 					['.shots/base/home-320x640.png', '.shots/base/feature-320x640.png'].forEach(
// 						async (filepath) => {
// 							assert.ok(fs.pathExistsSync(filepath));
// 							promises.push(
// 								shots.compare(filepath.replace('/base/', '/current/'), filepath, {
// 									threshold: 0.1
// 								})
// 							);
// 						}
// 					);

// 					Promise.all(promises).then((results) => {
// 						assert.ok(results.length === 2);
// 						assert.ok(results.every((test) => test.success));
// 						done();
// 					});
// 				})
// 				.catch(done);
// 		});
// 	});
// });
