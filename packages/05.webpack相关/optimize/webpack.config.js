const path = require('path')
const chalk = require('chalk')
const TerserPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const smp = new SpeedMeasurePlugin() // 编译速度分析

module.exports = smp.wrap({
    mode: 'development',
    entry: './src/index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    cache: {
        type: 'filesystem',
        cacheDirectory: path.resolve(__dirname, '.temp_cache'), // 自定义缓存目录
        name: 'my-cache', // 缓存名称，不同项目或构建配置时可以使用不同的名称
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                    },
                    // {
                    //     loader: 'thread-loader',
                    //     options: {
                    //         workers: 2, // 开启两个 worker 线程
                    //     },
                    // },
                ],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
        new ProgressBarPlugin({
            // 编译进度条
            format: 'build :msg [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
            clear: false,
        }),
        new BundleAnalyzerPlugin({
            // 打包体积分析
            analyzerMode: 'static',
            // generateStatsFile: true,
        }),
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'], // 模块引入时会自动添加这些后缀去找文件
    },
    devServer: {
        compress: true,
        port: 9000,
        hot: true,
    },
})
