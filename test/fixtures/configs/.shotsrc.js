module.exports = {
	url: 'file:///Volumes/Home/Projects/brikcss/shots/test/fixtures/pages',
	viewports: [{ width: 320, height: 640 }],
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
	browserSync: true
};
