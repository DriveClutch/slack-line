var gulp = require('gulp');
var watch = require('gulp-watch');
var connect = require('gulp-connect');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require("gulp-util");
var webpack = require("webpack");
var stream = require('webpack-stream');
var runSequence = require('run-sequence');
var async = require('async');
var _ = require('lodash');
var zip = require('gulp-zip');
var nodemon = require('gulp-nodemon');

var paths = {
    DEST_BUILD: 'dist/build',
    js: ['./app/**/*.js', '!app/modules/**'],
    watchJs: ['./app/**/*.js'],
    css: ['./app/**/*.scss']
};

var webpackConfig = {
    resolve: {
        root: path.resolve(__dirname),
        // set up aliases that allow our javascript imports to be shorter and more dynamic without
        // the need for long relative paths backwards through the filesystem "e.x. ../../../"
        alias: {
            app: 'app'
        }
    },
    // set up our application root
    entry: [path.join(__dirname + '/app/index.js')],
    output: {
        // set our default output. This gets changed in the webpack gulp task below
        path: path.join(__dirname, "build"),
        filename: 'bundle.js'
    },
    module: {
        // set up our loaded so that we can pull in and transpile things like SCSS and ES6 javascript
        loaders: [
            {
                test: /\.css$/,
                loader: "style-loader!css-loader"
            },
            {
                test: /\.scss$/,
                loaders: ["style", "css", "sass"]
            },
            {
                test: /\.less$/,
                loader: "style-loader!css-loader!less-loader"
            },
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                //include: [
                //    path.resolve(__dirname, "src"),
                //],
                include: [
                    path.resolve(__dirname, "node_modules/clutch-ui-common"),
                    path.resolve(__dirname, "app"),
                    path.resolve(__dirname, "config"),
                    path.resolve(__dirname, "redux"),
                ],
                //include: [/node_modules\/clutch-ui-common/],
                //exclude: /(node_modules|dist)/,
                query: {
                    plugins: ['transform-runtime'],
                    presets: ['react', 'stage-0', 'es2015'],
                }
            },
            {
                test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url?limit=10000&mimetype=application/font-woff"
            }, {
                test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url?limit=10000&mimetype=application/font-woff"
            }, {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url?limit=10000&mimetype=application/octet-stream"
            }, {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                loader: "file"
            }, {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url?limit=10000&mimetype=image/svg+xml"
            },
            {
                test: /\.gif$/,
                loader: "url-loader?mimetype=image/png"
            },
            {
                test: /\.json$/, loader: 'json'
            }
        ]
    },
    sassLoader: {
        // required for imports in SASS files
        includePaths: [path.resolve(__dirname, "./app/css")]
    },
    plugins: [
        // fix for moment.js that prevents it from loading all of the locales, thus greatly reducing file size
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en|no|hu/),
        new webpack.EnvironmentPlugin([ 'NODE_ENV' ])
    ]
};

gulp.task('default', function () {
    process.env.NODE_ENV = 'production';
    // set up config alias so webpack pulls in the production config
    webpackConfig.resolve.alias.config = path.join(__dirname, 'config', process.env.NODE_ENV);
    webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({minimize: true}));
    return runSequence('webpack', 'copy-index', 'copy-server', 'zip');
});

gulp.task('dev', function () {
    process.env.NODE_ENV = 'development';
    // set up config alias so webpack pulls in the development config
    webpackConfig.resolve.alias.config = path.join(__dirname, 'config', process.env.NODE_ENV);
    return runSequence('webpack', 'copy-index', 'copy-server', 'watch', 'node-server');
});

gulp.task('dev-noserver', function () {
    process.env.NODE_ENV = 'development';
    // set up config alias so webpack pulls in the development config
    webpackConfig.resolve.alias.config = path.join(__dirname, 'config', process.env.NODE_ENV);
    return runSequence('webpack', 'copy-index', 'copy-server');
});

gulp.task('watch', function () {
    // watches javascript and css/scss files for changes, then regenerates webpack bundles on change
    watch(paths.watchJs.concat(paths.css), function () {
        runSequence('webpack', connect.reload);
    })
});

gulp.task('copy-index', function(){
    return gulp.src('./app/index.ejs')
        .pipe(gulp.dest(paths.DEST_BUILD))
});

gulp.task('copy-server', function(){
    return gulp.src('./app/server.js')
        .pipe(gulp.dest(paths.DEST_BUILD))
});

gulp.task('node-server', function () {
    nodemon({
        script: paths.DEST_BUILD + '/server.js'
        , ext: 'js html css'
    })
})

gulp.task('connect', function () {
    // creates a simple node web server for serving bundles for development
    connect.server({
        root: paths.DEST_BUILD
    });
});

gulp.task('zip', function(){
    // zips all bundle files so they can be deployed for production
    return gulp.src(paths.DEST_BUILD + '/*')
        .pipe(zip('clutch-slack-feed.zip'))
        .pipe(gulp.dest('dist'));
});

var _webpack = function (config, cb) {
    gutil.log('Running webpack build for environment: ' + process.env.NODE_ENV);
    gulp.src(paths.js) // gulp looks for all source files under specified path
        .pipe(sourcemaps.init()) // creates a source map which would be very helpful for debugging by maintaining the actual source code structure
        .pipe(stream(config)) // blend the webpack config into the source files
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.DEST_BUILD))
        .on('error', function(err){
            gutil.log(err);
        })
        .on('end', function () {
            if (cb) cb();
        });
};

gulp.task('webpack', function (done) {
    _webpack(webpackConfig, done);
});