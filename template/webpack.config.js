var path = require("path");
//var webpack = require("webpack");

var config = {
  entry: path.join(__dirname, "src", "study.js"),
  output: {
    path: path.join(__dirname, "dist"),
    filename: "bundle.min.js"
  },
  module: {
    rules: [
        {
          test: require.resolve('jquery'),
            use: [{
              loader: 'expose-loader',
              options: 'jQuery'
            },
            {
              loader: 'expose-loader',
              options: '$'
            }
            ]
        },
        {
          test: /.*\.html$/, loader: "handlebars-loader"
        }
    ]
  },
  externals: [
    /^(jquery.i18n|\$)$/i,
    // {
    //   alpaca: "alpaca"
    // }
  ],
  resolve: {
    fallback: {
      "fs": false,
      "path": false,
      "url": false
    },
  }
};

module.exports = config;