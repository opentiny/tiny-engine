// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DefinePlugin } = require('webpack');
/**
 *
 * @param {import('webpack').Configuration} option
 * @returns {import('webpack').Configuration}
 */
module.exports = (option) => {
  return {
    ...option,
    plugins: [
      new DefinePlugin({
        __DEV__: process.env.NODE_ENV === 'DEV' ?? false,
        __TEST__: process.env.NODE_ENV === 'TEST' ?? false,
      }),
    ],
  };
};
