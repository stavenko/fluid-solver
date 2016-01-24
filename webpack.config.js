var webpack = require("webpack");
module.exports={
  entry: './browser.jsx',
  module: {
    loaders: [ 
      { test: /\.jsx$/, loader: 'jsx', exclude: /node_modules/ },
      //{ test: /\.(woff|woff2)$/,  loader: "url-loader?limit=10000&mimetype=application/font-woff" },
      { test: /\.(woff|woff2)$/,  loader: "url-loader"},
      { test: /\.ttf$/,    loader: "url-loader" },
      { test: /\.eot$/,    loader: "file-loader" },
      { test: /\.svg$/,    loader: "file-loader" }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery"
    })
  ],
  output: {
    path:__dirname + '/build/',
    filename: 'fluid-solver-app.js',
  }
};
