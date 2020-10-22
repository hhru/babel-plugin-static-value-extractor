import path from 'path';
import fs from 'fs';
import del from 'del';
import assert from 'assert';
import extractStaticValueFromGlob from '../src';

const trim = (str) => {
    return str.replace(/^\s+|\s+$/, '');
};

describe('Extract static value from glob', () => {
    const fixturesDir = path.join(__dirname, 'fixtures');

    fs.readdirSync(fixturesDir).map((caseName) => {
        it(`should ${caseName.split('-').join(' ')}`, () => {
            const fixtureDir = path.join(fixturesDir, caseName);

            del.sync(path.join(fixtureDir, 'expected/*.js'));

            extractStaticValueFromGlob(
                [path.join(fixtureDir, '/Component/*.?sx'), path.join(fixtureDir, '/Component/*.?s')],
                {
                    staticPropName: 'customProps',
                    saveFilePath: path.join(fixtureDir, 'expected'),
                    pathsToReplace: { './before': './after' },
                    include: ['/Component/'],
                    saveFileExt: 'js',
                    saveFileName: 'Component',
                }
            );

            const expected = fs.readFileSync(path.join(fixtureDir, 'expected/Component.js')).toString();

            const actual = fs.readFileSync(path.join(fixtureDir, './actual.js')).toString();

            assert.equal(trim(actual), trim(expected));
        });
    });
});
