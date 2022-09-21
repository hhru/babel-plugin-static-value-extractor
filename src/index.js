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

let cachedFiles = getPersistentCache();

const traceToPageComponent = (file) => {
    let parents = [file];
    let nextParents = [];
    const pageComponents = [];

    while (parents.length > 0) {
        parents.forEach((file) => {
            const reverseImports = cachedFiles[file].reverseImports;
            reverseImports === null ? pageComponents.push(file) : nextParents.push(...reverseImports);
        });

        parents = [...new Set(nextParents)];
        nextParents = [];
    }

    return pageComponents;
};

export const prepareCache = (opts) => {
    const { basePath } = opts;

    const invalidFiles = new Set();
    Object.keys(cachedFiles).forEach((filePath) => {
        const { cachedMtime } = cachedFiles[filePath];
        const fullPath = path.join(basePath, filePath);

        if (!fs.existsSync(fullPath) || cachedMtime !== fs.statSync(fullPath).mtimeMs) {
            invalidFiles.add(filePath);
        }
    });

    const invalidPageComponents = [];
    invalidFiles.forEach((filePath) => {
        cachedFiles[filePath].importsDeclarations.forEach((file) => {
            if (cachedFiles[file] && cachedFiles[file].reverseImports) {
                cachedFiles[file].reverseImports = cachedFiles[file].reverseImports.filter(
                    (file) => file !== filePath
                );
            }
        });
        invalidPageComponents.push(...traceToPageComponent(filePath));
    });

    new Set(invalidPageComponents).forEach((filePath) => {
        cachedFiles[filePath].importsDeclarations.forEach((file) => {
            if (cachedFiles[file] && cachedFiles[file].reverseImports) {
                cachedFiles[file].reverseImports = cachedFiles[file].reverseImports.filter((file) => file !== filePath);
            }
        });
        delete cachedFiles[filePath];
    });
    invalidFiles.forEach((filePath) => delete cachedFiles[filePath]);

    savePersistentCache(cachedFiles);
};

export const extractStaticValueFromFile = (file, opts = {}, cb = noop) => {
    extractStaticValueFromCode(
        fs.readFileSync(file),
        {
            ...opts,
            filename: file,
        },
        cb
    );
};

const mergeProps = (propNames, currentList, added) => {
    propNames.forEach((name) => {
        if (added[name]) {
            currentList[name].push(...added[name]);
        }
    });
};

export const extractStaticValueImportedFilesFromFile = (topLevelFile, opts = {}, cb = noop) => {
    const propNames = Object.keys(opts.propsToExtract);
    let staticPropsList = propNames.reduce((agg, name) => ({ ...agg, [name]: [] }), {});

    function _extractStaticValueImportedFilesFromFile(file, opts, parentFile = null) {
        if (cachedFiles[file]) {
            mergeProps(propNames, staticPropsList, cachedFiles[file].propsList);
            cachedFiles[file].reverseImports && cachedFiles[file].reverseImports.push(parentFile);
        } else {
            if (opts.include && !opts.include.find((includePath) => file.search(includePath) !== -1)) {
                return;
            }
            const { mtimeMs } = fs.statSync(file);
            extractStaticValueFromFile(file, opts, (_staticPropsList, importsDeclarations) => {
                mergeProps(propNames, staticPropsList, _staticPropsList);
                cachedFiles[file] = {
                    cachedMtime: mtimeMs,
                    propsList: _staticPropsList,
                    importsDeclarations,
                    reverseImports: [parentFile],
                };
            });
        }

        cachedFiles[file].importsDeclarations.forEach((f) => _extractStaticValueImportedFilesFromFile(f, opts, file));
    }

    if (!cachedFiles[topLevelFile]) {
        const { mtimeMs } = fs.statSync(topLevelFile);
        _extractStaticValueImportedFilesFromFile(topLevelFile, opts);
        cachedFiles[topLevelFile] = {
            cachedMtime: mtimeMs,
            propsList: staticPropsList,
            importsDeclarations: [],
            reverseImports: null,
        };
    }

    propNames.forEach((name) => {
        cachedFiles[topLevelFile].propsList[name] = [...new Set(cachedFiles[topLevelFile].propsList[name])];
    });

    cb(cachedFiles[topLevelFile].propsList);

    return cachedFiles[topLevelFile].propsList;
};

export default (globArr, opts = {}) => {
    const propNames = Object.keys(opts.propsToExtract);
    const saveFilePath = path.resolve(opts.saveFilePath);
    const PATH_DELIMITER_LENGTH = 1;
    let previousContent;

    const staticValues = glob.sync(globArr).reduce((globObject, file) => {
        const staticValues = extractStaticValueImportedFilesFromFile(path.relative(opts.basePath, file), opts);
        const dir = path.parse(file).dir;
        const componentName = dir.slice(dir.lastIndexOf('/') + PATH_DELIMITER_LENGTH);

        propNames.forEach((name) => {
            if (!globObject[name]) {
                globObject[name] = {};
            }

            globObject[name][componentName] = staticValues[name];
        });

        return globObject;
    }, {});

    propNames.forEach((name) => {
        if (fs.existsSync(`${saveFilePath}/${name}.${opts.saveFileExt}`)) {
            previousContent = fs.readFileSync(`${saveFilePath}/${name}.${opts.saveFileExt}`, ENCODING).toString();
        }

        const content = opts.template ? opts.template(name, staticValues[name]) : JSON.stringify(staticValues[name]);

        if (content !== previousContent) {
            fs.mkdirSync(saveFilePath, { recursive: true });
            fs.writeFileSync(`${saveFilePath}/${name}.${opts.saveFileExt}`, content);
        }
    });

    Object.keys(cachedFiles).forEach(
        (file) =>
            (cachedFiles[file].reverseImports =
                cachedFiles[file].reverseImports === null ? null : [...new Set(cachedFiles[file].reverseImports)])
    );
    savePersistentCache(cachedFiles);
};
