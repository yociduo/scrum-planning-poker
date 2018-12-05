require('dotenv').config();
const path = require('path');
const { CheckerPlugin } = require('awesome-typescript-loader');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');

const NODE_ENV =
  process.env.NODE_ENV === 'production' ? 'production' : 'development';

module.exports = {
  mode: NODE_ENV,
  entry: './src/app.ts',
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    modules: ['node_modules', 'src'],
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        // loader: 'awesome-typescript-loader',
        use: 'ts-loader'
      },
    ],
  },
  stats: {
    colors: true,
  },
  externals: [nodeExternals()],
};
