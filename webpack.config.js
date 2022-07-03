var webpack = require('webpack'),
  path = require('path'),
  fileSystem = require('fs-extra'),
  env = require('./utils/env'),
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  TerserPlugin = require('terser-webpack-plugin'),
  sharp = require('sharp')
var { CleanWebpackPlugin } = require('clean-webpack-plugin');

function toResizeFileName(to, size) {
  const p = path.parse(to)
  return path.join(
    p.dir,
    p.name.replace('[SIZE]', `${size}`) + p.ext
  )
}

function resizePicture({
  from,
  to,
  sizes
}) {
  return (
    new CopyWebpackPlugin({
      patterns: sizes.map(size => ({
        from,
        to: toResizeFileName(to, size),
        force: true,
        transform: content => sharp(content).resize(size).toBuffer(),
      }))
    })
  )
}

const ASSET_PATH = process.env.ASSET_PATH || '/';

var alias = {
  'react-dom': '@hot-loader/react-dom',
};

// load the secrets
var secretsPath = path.join(__dirname, 'secrets.' + env.NODE_ENV + '.js');

var fileExtensions = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'eot',
  'otf',
  'svg',
  'ttf',
  'woff',
  'woff2',
];

if (fileSystem.existsSync(secretsPath)) {
  alias['secrets'] = secretsPath;
}

var options = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    installed: path.join(__dirname, 'src', 'pages', 'Installed', 'index.ts'),
    plainWindow: path.join(__dirname, 'src', 'pages', 'PlainWindow', 'index.ts'),
    options: path.join(__dirname, 'src', 'pages', 'Options', 'index.ts'),
    popup: path.join(__dirname, 'src', 'pages', 'Popup', 'index.ts'),
    background: path.join(__dirname, 'src', 'Background', 'index.ts'),
    contentScript: path.join(__dirname, 'src', 'Content', 'index.ts'),
    devtools: path.join(__dirname, 'src', 'pages', 'Devtools', 'index.ts'),
    panel: path.join(__dirname, 'src', 'pages', 'Panel', 'index.ts'),
    control: path.join(__dirname, 'src', 'pages', 'Control', 'index.ts'),
    refocusLayout: path.join(__dirname, 'src', 'pages', 'RefocusLayout', 'index.ts'),
  },
  custom: {
    notHMR: ['background', 'contentScript', 'devtools'],
    enableBackgroundAutoReload: true, // always true when "enableContentScriptsAutoReload" is set true
    enableContentScriptsAutoReload: true,
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'build'),
    clean: true,
    publicPath: ASSET_PATH,
  },
  module: {
    rules: [
      {
        // look for .css or .scss files
        test: /\.(css|scss)$/,
        // in the `src` directory
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                auto: true,
                localIdentName: "[local]__[hash:base64:5]"
              }
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
        type: 'asset/resource',
        exclude: /node_modules/,
        // loader: 'file-loader',
        // options: {
        //   name: '[name].[ext]',
        // },
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        exclude: /node_modules/,
      },
      { test: /\.(ts|tsx)$/, loader: 'ts-loader', exclude: /node_modules/ },
      {
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: 'source-map-loader',
          },
          {
            loader: 'babel-loader',
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: alias,
    extensions: fileExtensions
      .map((extension) => '.' + extension)
      .concat(['.js', '.jsx', '.ts', '.tsx', '.css']),
  },
  plugins: [
    new CleanWebpackPlugin({ verbose: false }),
    new webpack.ProgressPlugin(),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin(['NODE_ENV', 'DEBUG']),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/manifest.json',
          to: path.join(__dirname, 'build'),
          force: true,
          transform: function (content, path) {
            // generates the manifest file using the package.json informations
            return Buffer.from(
              JSON.stringify({
                description: process.env.npm_package_description,
                version: process.env.npm_package_version,
                ...JSON.parse(content.toString()),
              })
            );
          },
        },
        {
          from: 'src/_locales',
          to: path.join(__dirname, 'build', '_locales'),
          force: true,
        }
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/Content/content.styles.css',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/default-siteicon.png',
          to: path.join(__dirname, 'build'),
          force: true,
          transform: content => sharp(content).resize(192).toBuffer(),
        },
      ],
    }),
    resizePicture({
      from: 'src/assets/img/icon-logo.png',
      to: path.join(__dirname, 'build', 'logo-[SIZE].png'),
      sizes: [ 128, 34 ]
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'Installed', 'index.html'),
      filename: 'installed.html',
      chunks: ['installed'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'PlainWindow', 'index.html'),
      filename: 'plainWindow.html',
      chunks: ['plainWindow'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'Options', 'index.html'),
      filename: 'options.html',
      chunks: ['options'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'Popup', 'index.html'),
      filename: 'popup.html',
      chunks: ['popup'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'Devtools', 'index.html'),
      filename: 'devtools.html',
      chunks: ['devtools'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'Panel', 'index.html'),
      filename: 'panel.html',
      chunks: ['panel'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'Control', 'index.html'),
      filename: 'control.html',
      chunks: ['control'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'RefocusLayout', 'index.html'),
      filename: 'refocusLayout.html',
      chunks: ['refocusLayout'],
      cache: false,
    }),
  ],
  infrastructureLogging: {
    level: 'info',
  },
};

if (env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-source-map';
} else {
  options.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  };
}

module.exports = options;
