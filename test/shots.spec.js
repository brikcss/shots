/* eslint-env mocha */
const assert = require('assert');
const shots = require('../lib/shots.js');
const rm = require('rimraf');
const fs = require('fs-extra');
const exec = require('shelljs').exec;
process.env.LOGLEVEL = 'info';

let config = {
	url: 'http://localhost:4000',
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
	browserSync: {
		server: 'test/fixtures/pages'
	}
};
const beforeShot = (test, { page }) => {
	return page.evaluate(() => {
		document.querySelectorAll('p').forEach((element) => (element.style.display = 'none'));
	});
};

before(() => {
	rm.sync('.shots');
});

describe('baseline()', function() {
	this.timeout(6000);

	beforeEach(() => {
		rm.sync('.shots/base');
	});

	context('when not properly configured', () => {
		it('returns an Error if config.cases is missing', async () => {
			return shots
				.baseline({
					url: 'http://localhost:4000'
				})
				.then((result) => {
					assert.ok(result.error instanceof Error);
					return;
				});
		});
	});

	// This has to be last test since test() uses it next.
	context('when properly configured', () => {
		it('creates and saves new baseline shots', () => {
			return shots.baseline(config).then((result) => {
				assert.ok(result.success);
				assert.ok(result.tests instanceof Array);
				assert.equal(result.tests.length, 8);
				result.tests.forEach((test) => {
					assert.ok(fs.pathExistsSync(test.result));
				});
			});
		});
	});
});

describe('test()', function() {
	this.timeout(6000);

	beforeEach(() => {
		rm.sync('.shots/current');
	});

	context('when configured properly', () => {
		it('succeeds if no diffs are found', () => {
			return shots.test(config).then((result) => {
				assert.ok(result.success);
				assert.ok(result.tests instanceof Array);
				assert.equal(result.tests.length, 8);
				result.tests.forEach((test) => {
					assert.ok(fs.pathExistsSync(test.result));
				});
			});
		});

		it('fails if diffs are found', () => {
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
					assert.equal(result.tests.length, 8);
					result.tests.forEach((test) => {
						if (!test.success) fails++;
						assert.ok(fs.pathExistsSync(test.result));
						assert.ok(fs.pathExistsSync(test.result.replace('.png', '--diff.png')));
					});
					assert.equal(fails, 8);
				});
		});
	});

	context('when no baseline shot exists', () => {
		it('fails', () => {
			rm.sync('.shots/base');
			return shots.test(config).then((result) => {
				assert.ok(result.error instanceof Error);
			});
		});
	});

	context('when no comparision image exists', () => {
		it('fails', () => {
			rm.sync('.shots/current');
			return shots.test(config).then((result) => {
				assert.ok(result.error instanceof Error);
			});
		});
	});
});

describe('approve()', function() {
	this.timeout(6000);

	beforeEach(() => {
		rm.sync('.shots');
	});

	context('with no configuration', () => {
		it('approves current shots to baseline', () => {
			const viewports = [{ width: 320, height: 640 }];
			return shots
				.baseline(Object.assign({}, config, { viewports }))
				.then(() => shots.test(Object.assign({}, config, { beforeShot, viewports })))
				.then((result) => {
					let fails = 0;
					assert.ok(!result.success);
					assert.ok(result.tests instanceof Array);
					assert.equal(result.tests.length, 2);
					result.tests.forEach((test) => {
						if (!test.success) fails++;
						assert.ok(fs.pathExistsSync(test.result));
						assert.ok(fs.pathExistsSync(test.result.replace('.png', '--diff.png')));
					});
					assert.equal(fails, 2);
					return result;
				})
				.then((result) => shots.approve().then(() => result))
				.then(() => shots.test(Object.assign({}, config, { viewports, beforeShot })))
				.then((result) => {
					let successes = 0;
					assert.ok(result.success);
					assert.ok(result.tests instanceof Array);
					assert.equal(result.tests.length, 2);
					result.tests.forEach((test) => {
						if (test.success) successes++;
						assert.ok(fs.pathExistsSync(test.result));
					});
					assert.ok(successes === 2);
				});
		});
	});

	context('with filename(s) or shot id(s)', () => {
		it('approves specified test shot(s) and saves as baseline shots', () => {
			config = Object.assign({}, config, {
				beforeShot: (test, { page }) => {
					return page.evaluate(() => {
						document
							.querySelectorAll('h2')
							.forEach((element) => (element.innerHTML = 'Hello world!'));
					});
				},
				viewports: [{ width: 320, height: 640 }]
			});
			return shots
				.baseline(Object.assign({}, config, { beforeShot: undefined }))
				.then(() => shots.test(config))
				.then((result) => {
					let fails = 0;
					assert.ok(!result.success);
					assert.ok(result.tests instanceof Array);
					assert.equal(result.tests.length, 2);
					result.tests.forEach((test) => {
						if (!test.success) {
							fails++;
							assert.ok(fs.pathExistsSync(test.result.replace('.png', '--diff.png')));
						}
						assert.ok(fs.pathExistsSync(test.result));
					});
					assert.equal(fails, 1);
					return result;
				})
				.then((result) => shots.approve({ name: 'home' }).then(() => result))
				.then(() => shots.test(config))
				.then((result) => {
					let successes = 0;
					assert.ok(result.success);
					assert.ok(result.tests instanceof Array);
					assert.equal(result.tests.length, 2);
					result.tests.forEach((test) => {
						if (test.success) successes++;
						assert.ok(fs.pathExistsSync(test.result));
					});
					assert.ok(successes === 2);
				});
		});
	});
});

describe('cli()', function() {
	this.timeout(6000);

	before(() => {
		rm.sync('.shots');
	});

	context('baseline()', () => {
		it('creates baseline shots', (done) => {
			exec(
				'node bin/shots-cli.js baseline --config ./test/fixtures/configs/.shotsrc.js',
				(code) => {
					assert.equal(code, 0);
					['.shots/base/home-320x640.png', '.shots/base/feature-320x640.png'].forEach(
						(filepath) => {
							assert.ok(fs.pathExistsSync(filepath));
						}
					);
					done();
				}
			);
		});
	});

	context('test()', () => {
		it('creates test shots without diffs', (done) => {
			const promises = [];
			exec(
				'node bin/shots-cli.js test --config ./test/fixtures/configs/.shotsrc.js',
				(code) => {
					assert.equal(code, 0);
					[
						'.shots/current/home-320x640.png',
						'.shots/current/feature-320x640.png'
					].forEach(async (filepath) => {
						assert.ok(fs.pathExistsSync(filepath));
						promises.push(
							shots.compare(filepath, filepath.replace('/current/', '/base/'), {
								threshold: 0.1
							})
						);
					});

					Promise.all(promises).then((results) => {
						assert.ok(results.every((test) => test.success));
						done();
					});
				}
			);
		});

		it('creates test shots with diffs', function(done) {
			const promises = [];
			exec(
				'node bin/shots-cli.js test --config test/fixtures/configs/.shots2rc.js',
				(code) => {
					assert.equal(code, 0);
					[
						'.shots/current/home-320x640.png',
						'.shots/current/feature-320x640.png'
					].forEach(async (filepath) => {
						assert.ok(fs.pathExistsSync(filepath));
						promises.push(
							shots.compare(filepath, filepath.replace('/current/', '/base/'), {
								threshold: 0.1
							})
						);
					});

					Promise.all(promises)
						.then((results) => {
							const successes = results.filter((test) => test.success);
							const fails = results.filter((test) => !test.success);
							assert.equal(successes.length, 1);
							assert.equal(fails.length, 1);
							done();
						})
						.catch(done);
				}
			);
		});
	});

	context('approve()', () => {
		beforeEach(() => {
			rm.sync('.shots/base');
		});

		it('moves a single test to baseline', (done) => {
			const promises = [];
			exec('node bin/shots-cli.js approve --threshold 0.1 --id home', (code) => {
				assert.equal(code, 0);

				['.shots/base/home-320x640.png'].forEach(async (filepath) => {
					assert.ok(fs.pathExistsSync(filepath));
					promises.push(
						shots.compare(filepath.replace('/base/', '/current/'), filepath, {
							threshold: 0.1
						})
					);
				});

				Promise.all(promises).then((results) => {
					assert.ok(results.length === 1);
					assert.ok(results[0].success);
					done();
				});
			});
		});

		it('moves current tests to baseline', (done) => {
			const promises = [];
			exec('node bin/shots-cli.js approve --threshold 0.1', (code) => {
				assert.equal(code, 0);

				['.shots/base/home-320x640.png', '.shots/base/feature-320x640.png'].forEach(
					async (filepath) => {
						assert.ok(fs.pathExistsSync(filepath));
						promises.push(
							shots.compare(filepath.replace('/base/', '/current/'), filepath, {
								threshold: 0.1
							})
						);
					}
				);

				Promise.all(promises).then((results) => {
					assert.ok(results.length === 2);
					assert.ok(results.every((test) => test.success));
					done();
				});
			});
		});
	});
});
