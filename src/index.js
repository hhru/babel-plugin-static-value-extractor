import fs from 'fs';
import path from 'path';
import * as babylon from '@babel/parser';
import traverse from '@babel/traverse';
import glob from 'glob-all';

import getTraverser from './traverser';
import { getPersistentCache, savePersistentCache } from './persistentCache';

const ENCODING = 'utf8';
const BABEL_PARSING_OPTS = {
    sourceType: 'module',
    plugins: [
        'jsx',
        'typescript',
        'doExpressions',
        'objectRestSpread',
        'decorators-legacy',
        'classProperties',
        'exportExtensions',
        'asyncGenerators',
        'functionBind',
        'functionSent',
        'dynamicImport',
        'optionalChaining',
    ],
};
const noop = () => {};

const extractStaticValueFromCode = (code, opts = {}, cb = noop) => {
    try {
        const ast = babylon.parse(code.toString(ENCODING), BABEL_PARSING_OPTS);
        const traverser = getTraverser(cb, opts);

        traverse(ast, traverser);
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.log(error);
        } else {
            throw error;
        }
    }
};

export const prepareCache = (opts) => {
    const { basePath } = opts;
    const cache = getPersistentCache(opts);

    const invalidFiles = [];
    Object.keys(cache).forEach((filePath) => {
        const { cachedMtime } = cache[filePath];
        const { mtimeMs } = fs.statSync(path.join(basePath, filePath));

        if (cachedMtime !== mtimeMs) {
            invalidFiles.push(filePath, ...cache[filePath].reverseImports);
        }
    });

    const uniqueFiles = new Set(invalidFiles);
    uniqueFiles.forEach((filePath) => {
        delete cache[filePath];
    });

    savePersistentCache(cache, opts);
}

let cachedFiles = {};
let cacheLoaded = false;

export const extractStaticValueFromFile = (file, opts = {}, cb = noop) => {
    extractStaticValueFromCode(fs.readFileSync(file), {
        ...opts,
        filename: file,
    }, cb);
};

const mergeProps = (propNames, currentList, added) => {
    propNames.forEach((name) => {
        if (added[name]) {
            currentList[name].push(...added[name]);
        }
    })
};

export const extractStaticValueImportedFilesFromFile = (file, opts = {}, cb = noop, importPaths = []) => {
    if (!cacheLoaded) {
        cachedFiles = getPersistentCache(opts);
        cacheLoaded = true;
    }

    const propNames = Object.keys(opts.propsToExtract);
    const relativePath = path.relative(opts.basePath, file);

    let staticPropsList = propNames.reduce((agg, name) => ({ ...agg, [name]: [] }), {});
    const { mtimeMs } = fs.statSync(file);

    function _extractStaticValueImportedFilesFromFile(file, opts, importPaths) {
        const { mtimeMs } = fs.statSync(file);
        const relativePath = path.relative(opts.basePath, file);

        let importsDeclarations = [];

        if (opts.include && !opts.include.find((includePath) => file.search(includePath) !== -1)) {
            return;
        }

        if (cachedFiles[relativePath]) {
            mergeProps(propNames, staticPropsList, cachedFiles[relativePath].propsList)
            importsDeclarations = cachedFiles[relativePath].importsDeclarations;
            cachedFiles[relativePath].reverseImports = [
                ...new Set([...cachedFiles[relativePath].reverseImports, ...importPaths])
            ]
        } else {
            extractStaticValueFromFile(file, opts, (_staticPropsList, _importsDeclarations) => {
                mergeProps(propNames, staticPropsList, _staticPropsList);
                importsDeclarations = _importsDeclarations;
                cachedFiles[relativePath] = {
                    cachedMtime: mtimeMs,
                    propsList: _staticPropsList,
                    importsDeclarations,
                    reverseImports: importPaths,
                };
            });
        }

        importsDeclarations.forEach((file) => {
            _extractStaticValueImportedFilesFromFile(file, opts, [...importPaths, relativePath]);
        });
    }

    if (cachedFiles[relativePath]) {
        staticPropsList = cachedFiles[relativePath].propsList;
        cachedFiles[relativePath].reverseImports = [
            ...new Set([...cachedFiles[relativePath].reverseImports, ...importPaths])
        ]
    } else {
        _extractStaticValueImportedFilesFromFile(file, opts, [...importPaths, relativePath]);
        cachedFiles[relativePath] = {
            cachedMtime: mtimeMs,
            propsList: staticPropsList,
            importsDeclarations: [],
            reverseImports: importPaths,
        };
    }

    propNames.forEach((name) => {
        cachedFiles[relativePath].propsList[name] = [...new Set(cachedFiles[relativePath].propsList[name])];
    })

    cb(cachedFiles[relativePath].propsList);

    return cachedFiles[relativePath].propsList;
};

export default (globArr, opts = {}) => {
    const propNames = Object.keys(opts.propsToExtract)
    const saveFilePath = path.resolve(opts.saveFilePath);
    const PATH_DELIMITER_LENGTH = 1;
    let previousContent;

    const staticValues = glob.sync(globArr).reduce((globObject, file) => {
        const staticValues = extractStaticValueImportedFilesFromFile(file, opts);
        const dir = path.parse(file).dir;
        const relativePath = path.relative(opts.basePath, dir);

        propNames.forEach((name) => {
            if (!globObject[name]) {
                globObject[name] = {};
            }

            globObject[name][relativePath.slice(dir.lastIndexOf('/') + PATH_DELIMITER_LENGTH)] = staticValues[name];
        })

        return globObject;
    }, {});

    propNames.forEach((name) => {
        if (fs.existsSync(`${saveFilePath}/${name}.${opts.saveFileExt}`)) {
            previousContent = fs.readFileSync(`${saveFilePath}/${name}.${opts.saveFileExt}`, ENCODING)
                .toString();
        }

        const content = opts.template ? opts.template(name, staticValues[name]) : JSON.stringify(staticValues[name]);

        if (content !== previousContent) {
            fs.mkdirSync(saveFilePath, {recursive: true});
            fs.writeFileSync(`${saveFilePath}/${name}.${opts.saveFileExt}`, content);
        }
    });

    savePersistentCache(cachedFiles, opts);
    cacheLoaded = false;
};
