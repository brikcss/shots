# Shots

<!-- Shields. -->
<p>
	<!-- NPM version. -->
	<a href="https://www.npmjs.com/package/@brikcss/shots">
		<img alt="NPM version" src="https://img.shields.io/npm/v/@brikcss/shots.svg?style=flat-square">
	</a>
	<!-- NPM downloads/month. -->
	<a href="https://www.npmjs.com/package/@brikcss/shots">
		<img alt="NPM downloads per month" src="https://img.shields.io/npm/dm/@brikcss/shots.svg?style=flat-square">
	</a>
	<!-- Travis branch. -->
	<a href="https://github.com/brikcss/shots/tree/master">
		<img alt="Travis branch" src="https://img.shields.io/travis/rust-lang/rust/master.svg?style=flat-square&label=master">
	</a>
	<!-- Codacy. -->
	<a href="https://www.codacy.com/app/thezimmee/shots">
		<img alt="NPM version" src="https://img.shields.io/codacy/grade/7684b158cc6c4497a2694d50883f36dc/master.svg?style=flat-square">
	</a>
	<!-- Coveralls -->
	<a href='https://coveralls.io/github/brikcss/shots?branch=master'>
		<img src='https://img.shields.io/coveralls/github/brikcss/shots/master.svg?style=flat-square' alt='Coverage Status' />
	</a>
	<!-- Commitizen friendly. -->
	<a href="http://commitizen.github.io/cz-cli/">
		<img alt="Commitizen friendly" src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square">
	</a>
	<!-- Semantic release. -->
	<a href="https://github.com/semantic-release/semantic-release">
		<img alt="semantic release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square">
	</a>
	<!-- Prettier code style. -->
	<a href="https://prettier.io/">
		<img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square">
	</a>
	<!-- MIT License. -->
	<!-- <a href="https://choosealicense.com/licenses/mit/">
		<img alt="License" src="https://img.shields.io/npm/l/express.svg?style=flat-square">
	</a> -->
</p>

Shots is a browser screenshot tool, made especially to simplify visual UI regression testing. It tests in Google ([Headless Chrome](https://developers.google.com/web/updates/2017/04/headless-chrome)) with Google's [Puppeteer](https://github.com/GoogleChrome/puppeteer/) and compares screenshots with [Pixelmatch](https://github.com/mapbox/pixelmatch). The process is simple: Take baseline shots, run regression tests during development. When desired changes are made, easily approve screenshots to promote them as the new baseline.

---

## Environment support

| Node   | CLI   | UMD   | ES Module | Browser   |
|:------:|:-----:|:-----:|:---------:|:---------:|
| ✔      | ✔    | x     | x         | x         |

## Install

```sh
npm install -D @brikcss/shots
```

## Methods

### `baseline()`

Sets up baseline images which are used to compare with future shots.

CLI:

```sh
shots baseline <options>
# or with NPM scripts:
npx shots baseline <options>
```

Node:

```js
shots.baseline(options = {});
```

### `test()`

Runs a regression test. Takes current screenshots and compares them against the set of baseline images.

CLI:

```sh
shots test <options>
# or with NPM scripts:
npx shots test <options>
```

Node:

```js
shots.test(options = {});
```

### `approve()`

Approves the most recently run tests and promote them to baseline shots.

CLI:

```sh
shots approve <options>
# or with NPM scripts:
npx shots approve <options>
```

Node:

```js
shots.approve(options = {});
```

## Configuration options

- `cases`  _{Array}_  **required**  Configuration for your test cases. Each test case requires an `id` and `path` property. The `id` determines the base filename, and `path` is the path to the page you wish to test.

- `url`  _{String}_  `shots` requires you to set up and run your own local server. You may alternative use the local `file://` protocol. `config.url` simply tells `shots` where to find your app.

- `viewports`  _{Array}_  A screenshot will be created for each viewport size. This setting is passed directly to Puppeteer's `page.setViewport(viewport)` method.

- `beforeShot`  _{Function}_  `beforeShot(test, { browser, page, config }) => {}`  Callback which runs after Puppeteer has created the browser page and navigated to the URL, and before each screenshot is taken. This allows you to take full advantage of the Puppeteer API to manipulate the page before the shot is taken. Useful, for example, to only show the elements you wish to test.

- `afterShot`  _{Function}_  `afterShot(test, { browser, page, config }) => {}`  Callback which runs immediately after each screenshot is taken and before the browser page closes. This allows you to tie in to Puppeteer's API to do anything you want.

- `threshold`  _{Number}_  Number between `0` and `1`, passed directly to [pixelmatch](https://github.com/mapbox/pixelmatch) to set the threshold level at which a screenshot comparison will pass or fail.

- `browserSync`  _{Object or Boolean}_  [Browser-sync](https://www.browsersync.io/) configuration. Some options are unavailable, as browser-sync only runs invisibly. Set to false to disable browser-sync, in which case you will need to manually run your own server before running shots.

- `config`  _{String}_  Path to a config file to load. A config file must be a JS or JSON file which can be `require()`d by node.

- `baseDir`  _{String}_  Directory to save baseline tests to.

- `currentDir`  _{String}_  Directory to save the most recent test to.

- `id`  _{String}_  _For the `approve()` method only._ Rather than approving all shots in a test set at once, use this setting to pass a comma-separated list of specific test IDs you wish to approve.
