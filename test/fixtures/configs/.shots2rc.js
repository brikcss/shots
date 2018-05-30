module.exports = {
	server: 'http://localhost:4000',
	viewports: [{ width: 320, height: 640 }],
	beforeShot: (test, { page }) => {
		return page.evaluate(() => {
			document.querySelectorAll('h2').forEach((element) => (element.style.display = 'none'));
		});
	},
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
