const path = require("path");
module.exports = {
  mode: "development",
  devtool: false,
  entry: "./src/index.js",
  output: {
    path: path.resolve("dist"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
                [
                'babel-plugin-import',
                {
                  libraryName: 'lodash',
                  libraryDirectory:''
                }
              ]
            ]
          }
        }
     }
    ],
  },
};