const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.wasm$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      // Fix package resolution for monorepo
      '@flare/shared': path.resolve(__dirname, '../shared/src'),
      '@flare/file-format': path.resolve(__dirname, '../file-format/src'),
    },
    // Handle Node.js built-in modules
    fallback: {
      "fs": false,
      "path": false,
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      type: 'umd',
      umdNamedDefine: true
    },
    globalObject: 'this'
  },
  experiments: {
    asyncWebAssembly: true
  },
  devtool: 'source-map',
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html',
    }),
    // Add Node.js environment variables
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
    // Copy WebAssembly files and example animation to dist
    new CopyPlugin({
      patterns: [
        { from: 'src/wasm/flare_runtime.js', to: 'wasm/flare_runtime.js' },
        { from: 'src/wasm/flare_runtime.wasm', to: 'wasm/flare_runtime.wasm' },
        { from: '../../examples/basic-animation/test.json', to: 'test.json' }
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
  },
};