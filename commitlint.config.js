/** ------------------------------------------------------------------------------------------------
 *  @filename  commitlint.config.js
 *  @author  brikcss  <https://github.com/brikcss>
 *  @description  http://marionebl.github.io/commitlint/#/reference-configuration
 ** --------------------------------------------------------------------------------------------- */

module.exports = {
	rules: {
		'body-leading-blank': [2, 'always'],
		'footer-leading-blank': [2, 'always'],
		'header-max-length': [2, 'always', 100],
		'scope-enum': [1, 'always', []],
		'scope-case': [1, 'always', 'kebab-case'],
		'subject-case': [1, 'always', 'sentence-case'],
		'subject-empty': [2, 'never'],
		'subject-full-stop': [2, 'always', '.'],
		'type-enum': [
			2,
			'always',
			[
				'feat',
				'feature',
				'fix',
				'patch',
				'docs',
				'style',
				'refactor',
				'test',
				'revert',
				'build',
				'perf',
				'performance',
				'tools',
				'chore'
			]
		],
		'type-case': [2, 'always', 'lowerCase'],
		'type-empty': [2, 'never']
	}
};
