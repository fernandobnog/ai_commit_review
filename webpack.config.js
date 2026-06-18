import path from 'path';
import { fileURLToPath } from 'url';
import Dotenv from 'dotenv-webpack';
import webpack from 'webpack';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = fs.existsSync(path.resolve(__dirname, '.env'))
  ? path.resolve(__dirname, '.env')
  : path.resolve(__dirname, '.env.develop');

export default {
  entry: './cli.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.cjs', // change extension to .cjs so Node treats it as CommonJS
    libraryTarget: 'commonjs2'
  },
  target: 'node',
  plugins: [
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true,
      entryOnly: true
    }),
    new Dotenv({
      path: envPath
    })
  ]
};