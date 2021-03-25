var path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/index.js",
  output: {
    path: path.resolve("build"),
    filename: "index.js",
    libraryTarget: "commonjs2"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { 
            presets: [
              '@babel/preset-env', '@babel/react',
              {
                'plugins': [
                  '@babel/plugin-proposal-class-properties',
                  '@babel/plugin-syntax-jsx'
                ]
              }
            ]
          }
        }
      }
    ]
  },
  externals: {
    react: "react"
  }
};
