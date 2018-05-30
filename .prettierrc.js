/** ------------------------------------------------------------------------------------------------
 *  @filename  .prettierrc.js
 *  @author  brikcss  <https://github.com/brikcss>
 *  @description  https://prettier.io/docs/en/configuration.html
 ** --------------------------------------------------------------------------------------------- */

module.exports = {
	printWidth: 100,
	singleQuote: true,
	useTabs: true,
	tabWidth: 4,
	semi: true,
	arrowParens: 'always',
	parser: 'babylon'
	// overrides: [
	// 	{
	// 		files: '.prettierrc',
	// 		options: {
	// 			parser: 'json'
	// 		}
	// 	},
	// 	{
	// 		files: '.*rc',
	// 		options: {
	// 			parser: 'json'
	// 		}
	// 	},
	// 	{
	// 		files: '.json',
	// 		options: {
	// 			parser: 'json'
	// 		}
	// 	},
	// 	{
	// 		files: '*.{yaml,yml}',
	// 		options: {
	// 			useTabs: false,
	// 			tabWidth: 2
	// 		}
	// 	},
	// 	{
	// 		files: '*.md',
	// 		options: {
	// 			parser: 'markdown',
	// 			printWidth: false
	// 		}
	// 	}
	// ]
};
