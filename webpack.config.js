const path = require('path');
const webpack = require('webpack');
const WebpackBar = require('webpackbar');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const isProd = (process.env.NODE_ENV?.trim() === 'production');
console.log('NODE_ENV', process.env.NODE_ENV);
console.log('isProd', isProd ? 'true' : 'false');

const libraryConfig = (name, color) => ({
  mode: isProd ? 'production': 'development',
  entry: {
    KotOR: [
      './src/KotOR.ts'
    ]
  },
  stats: {
    colors: true,
    hash: false,
    version: false,
    timings: false,
    assets: false,
    chunks: false,
    modules: false,
    reasons: false,
    children: false,
    source: false,
    errors: true,
    errorDetails: false,
    warnings: false,
    publicPath: false
  },
  devtool: !isProd ? 'eval-source-map' : undefined,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              experimentalWatchApi: true,
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        use: 'raw-loader'
      },
    ],
  },
  plugins: [
    new WebpackBar({
      color,
      name,
      reporters: ['fancy'],
    }),
    // Work around for Buffer is undefined:
    // https://github.com/webpack/changelog-v5/issues/10
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  resolve: {
    alias: {
      three: path.resolve('./node_modules/three')
    },
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "path": require.resolve("path-browserify"),
      "buffer": require.resolve("buffer"),
    }
  },
  externals: {
    fs: 'window.fs',
  },
  output: {
    library: 'KotOR',
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    pathinfo: false,
  },
});

const launcherConfig = (name, color) => ({
  mode: isProd ? 'production': 'development',
  entry: {
    launcher: [
      './src/apps/launcher/launcher.tsx', 
      './src/apps/launcher/app.scss'
    ],
    // preload: [
    //   './src/launcher/preload.ts',
    // ]
  },
  stats: {
    colors: true,
    hash: false,
    version: false,
    timings: false,
    assets: false,
    chunks: false,
    modules: false,
    reasons: false,
    children: false,
    source: false,
    errors: true,
    errorDetails: false,
    warnings: false,
    publicPath: false
  },
  devtool: !isProd ? 'eval-source-map' : undefined,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{
          loader: 'ts-loader',
          options: {
            configFile: "tsconfig.launcher.json"
          }
        }],
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: 'dist/launcher',
            }
          },
          // "style-loader",
          {
            loader: 'css-loader',
            options: {
              url: false
            }
          },
          // {
          //   loader: 'resolve-url-loader'
          // },
          "sass-loader",
        ]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.html$/,
        use: 'raw-loader'
      },
    ],
  },
  plugins: [
    new WebpackBar({
      color,
      name,
      reporters: ['fancy'],
    }),
    // Work around for Buffer is undefined:
    // https://github.com/webpack/changelog-v5/issues/10
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      $: "jquery",
      jQuery: "jquery",
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/apps/launcher/launcher.html'
    }),
    new CopyPlugin({
      patterns: [
        { from: "src/assets/launcher", to: "" },
        { from: "src/apps/launcher/preload.js", to: "" },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: 'launcher.css'
    }),
  ],
  resolve: {
    alias: {
      three: path.resolve('./node_modules/three')
    },
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "path": require.resolve("path-browserify"),
      "buffer": require.resolve("buffer"),
    }
  },
  externals: {
    fs: 'window.fs',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/launcher'),
  },
});

const gameConfig = (name, color) => ({
  mode: isProd ? 'production': 'development',
  entry: {
    game: [
      './src/apps/game/game.ts', 
      './src/apps/game/game.scss'
    ],
    // preload: [
    //   './src/apps/game/preload.ts',
    // ]
  },
  stats: {
    colors: true,
    hash: false,
    version: false,
    timings: false,
    assets: false,
    chunks: false,
    modules: false,
    reasons: false,
    children: false,
    source: false,
    errors: true,
    errorDetails: false,
    warnings: false,
    publicPath: false
  },
  devtool: !isProd ? 'eval-source-map' : undefined,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [{
          loader: 'ts-loader',
          options: {
            configFile: "tsconfig.game.json"
          }
        }],
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: 'dist/game',
            }
          },
          // "style-loader",
          {
            loader: 'css-loader',
            options: {
              url: false
            }
          },
          // {
          //   loader: 'resolve-url-loader'
          // },
          "sass-loader",
        ]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.html$/,
        use: 'raw-loader'
      },
    ],
  },
  plugins: [
    new WebpackBar({
      color,
      name,
      reporters: ['fancy'],
    }),
    // Work around for Buffer is undefined:
    // https://github.com/webpack/changelog-v5/issues/10
    new webpack.ProvidePlugin({
      // Buffer: ['buffer', 'Buffer'],
      // $: "jquery",
      // jQuery: "jquery"
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/apps/game/game.html'
    }),
    new CopyPlugin({
      patterns: [
        // { from: "src/assets/game", to: "" },
        { from: "src/apps/game/preload.js", to: "" },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: 'game.css'
    }),
  ],
  resolve: {
    alias: {
      three: path.resolve('./node_modules/three')
    },
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "path": require.resolve("path-browserify"),
      // "buffer": require.resolve("buffer"), 
    }
  },
  externals: {
    fs: 'window.fs',
    '../../KotOR': 'KotOR',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/game'),
  },
});

const forgeConfig = (name, color) => ({
  mode: isProd ? 'production': 'development',
  entry: {
    forge: [
      './src/apps/forge/forge.tsx', 
      './src/apps/forge/forge.scss'
    ],
    "worker-tex": [
      './src/worker/worker-tex.ts'
    ],
    // preload: [
    //   './src/apps/forge/preload.ts',
    // ]
  },
  stats: {
    colors: true,
    hash: false,
    version: false,
    timings: false,
    assets: false,
    chunks: false,
    modules: false,
    reasons: false,
    children: false,
    source: false,
    errors: true,
    errorDetails: false,
    warnings: false,
    publicPath: false
  },
  devtool: !isProd ? 'eval-source-map' : undefined,
  module: {
    rules: [
      {
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			},
			{
				test: /\.ttf$/,
				use: ['file-loader']
			},
      {
        test: /\.tsx?$/,
        use: [{
          loader: 'ts-loader',
          options: {
            configFile: "tsconfig.forge.json"
          }
        }],
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: 'dist/forge',
            }
          },
          // "style-loader",
          {
            loader: 'css-loader',
            options: {
              url: false
            }
          },
          // {
          //   loader: 'resolve-url-loader'
          // },
          "sass-loader",
        ]
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.html$/,
        use: 'raw-loader'
      },
    ],
  },
  plugins: [
    new WebpackBar({
      color,
      name,
      reporters: ['fancy'],
    }),
    // Work around for Buffer is undefined:
    // https://github.com/webpack/changelog-v5/issues/10
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      // "$":"jquery",
      // "jQuery":"jquery",
      // "window.jQuery":"jquery"
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/apps/forge/forge.html'
    }),
    new CopyPlugin({
      patterns: [
        { from: "src/assets/forge", to: "" },
        { from: "src/apps/forge/preload.js", to: "" },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: 'forge.css'
    }),
    new MonacoWebpackPlugin({
      publicPath: '/monaco',
      globalAPI: true,
      languages: ['json']
    }),
  ],
  resolve: {
    alias: {
      three: path.resolve('./node_modules/three'),
    },
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "path": require.resolve("path-browserify"),
      "buffer": require.resolve("buffer"), 
    }
  },
  externals: {
    fs: 'window.fs',
    '../../KotOR': 'KotOR',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/forge'), 
  },
});

module.exports = [
  libraryConfig('KotOR.js', 'green'),
  launcherConfig('Launcher', 'orange'),
  gameConfig('Game Client', 'blue'),
  forgeConfig('Forge Client', 'yellow'),
];