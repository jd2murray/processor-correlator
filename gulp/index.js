require('./dirs');
const gulp = require('gulp');
const babel = require('gulp-babel');

var babelSrc = [srcDir + '/**/*.js'];
gulp.task('babel', () => {
   return(gulp.src(babelSrc)
           .pipe(babel({
               plugins: [
                   'transform-class-properties',
                   'transform-flow-strip-types',
                   ['typecheck', {
                       disable: {
                           production: true
                       }
                   }
               ]],
               presets: ['es2015', 'stage-0']
           }))
           .pipe(gulp.dest(babelOut))
   );
});