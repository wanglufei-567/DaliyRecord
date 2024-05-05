const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: false,
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js'
  },
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      {
        test: /\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader']
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.png$/, // 会把png图片自动拷贝到输出目录中，并返回新路径或者说名称
        // use:["file-loader"],
        type: 'asset/resource',
        generator: {
          filename: 'png/[hash][ext]'
        }
      },
      {
        test: /\.ico$/, // 会把ico文件变成base64字符串并返回给调用者
        type: 'asset/inline'
      },
      {
        test: /\.txt$/, // 会把txt内容直接返回
        type: 'asset/source'
      },
      {
        test: /\.svg$/,
        type: 'asset/resource'
      },
      {
        test: /\.jpg$/,
        type: 'asset', // 表示可以根据实际情况进行自选择是resource还inline
        parser: {
          dataUrlCondition: {
            maxSize: 4 * 1024 // 如果文件大小小于4K就走inline,如果大于4K就
          }
        },
        generator: {
          filename: 'jpg/[hash][ext]'
        }
      }
    ]
  },
  plugins: [new HtmlWebpackPlugin({ template: './src/index.html' })],
  devServer: {
    port: 8080,
    open: true,
    static: path.resolve(__dirname, 'public'),
    // 当你已经有一个后台接口API服务器的可以直接 代理过去
    proxy: {
      '/api1': {
        target: 'http://localhost:3000',
        pathRewrite: {
          '^/api': '',
          '^/home/name/api': '/home/name'
        }
      },
      '/api2': {
        target: 'http://localhost:4000',
        pathRewrite: {
          '^/api': '',
          '^/home/name/api': '/home/name'
        }
      }
    },
    // 如果你没有后台服务器，直接把mock功能直接定义在这里
    onBeforeSetupMiddleware(devServer) {
      // app其实就是webpack-dev-sever里面的express的app
      devServer.app.get('/xxx', (req, res) => {
        res.json({
          id: 1,
          name: 'zhufeng'
        });
      });
    }
  }
};
