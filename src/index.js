import fs from 'fs';
import path from 'path';
import * as babylon from 'babylon';
import traverse from 'babel-traverse';
import glob from 'glob-all';

import getTraverser from './traverser';

const ENCODING = 'utf8';
const BABEL_PARSING_OPTS = {
    sourceType: 'module',
    plugins: [
        'jsx',
        'flow',
        'doExpressions',
        'objectRestSpread',
        'decorators',
        'classProperties',
        'exportExtensions',
        'asyncGenerators',
        'functionBind',
        'functionSent',
        'dynamicImport',
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

export const extractStaticValueFromFile = (file, opts = {}, cb = noop) => {
    extractStaticValueFromCode(fs.readFileSync(file), {
        ...opts,
        filename: file,
    }, cb);
};

let cachedFiles = {};

export const extractStaticValueImportedFilesFromFile = (file, opts = {}, cb = noop) => {
    let staticPropsList = [];

    function _extractStaticValueImportedFilesFromFile(file, opts) {
        let importsDeclarations = [];
    
        if (opts.include && !opts.include.find((includePath) => file.search(includePath) !== -1)) {
            return;
        }
        
        extractStaticValueFromFile(file, opts, (_staticPropsList, _importsDeclarations) => {
            staticPropsList = staticPropsList.concat(_staticPropsList);
            cachedFiles[file] = _staticPropsList;
            importsDeclarations = _importsDeclarations;
        });

        importsDeclarations.forEach((file) => {
            if (!cachedFiles[file]) {
                _extractStaticValueImportedFilesFromFile(file, opts, staticPropsList);
            } else {
                staticPropsList = staticPropsList.concat(cachedFiles[file]);
            }
        });
    }
    
    if (cachedFiles[file]) {
        staticPropsList = cachedFiles[file];
    } else {
        _extractStaticValueImportedFilesFromFile(file, opts);
        cachedFiles[file] = staticPropsList;
    }
    
    const values = [...new Set(staticPropsList)];
    
    cb(values);

    return values;
};

export default (globArr, opts = {}) => {
    const saveFilePath = path.resolve(opts.saveFilePath);
    const PATH_DELIMITER_LENGTH = 1;
    let previousContent;

    const staticValues = glob.sync(globArr).reduce((globObject, file) => {
        const staticValues = extractStaticValueImportedFilesFromFile(file, opts);
        const dir = path.parse(file).dir;

        globObject[dir.slice(dir.lastIndexOf('/') + PATH_DELIMITER_LENGTH)] = staticValues;

        return globObject;
    }, {});

    if (fs.existsSync(`${saveFilePath}/${opts.saveFileName}.${opts.saveFileExt}`)) {
        previousContent = fs.readFileSync(`${saveFilePath}/${opts.saveFileName}.${opts.saveFileExt}`, ENCODING)
            .toString();
    }

    const content = opts.template ? opts.template(staticValues) : JSON.stringify(staticValues);

    cachedFiles = {};

    if (content !== previousContent) {
        fs.mkdirSync(saveFilePath, {recursive: true});
        fs.writeFileSync(`${saveFilePath}/${opts.saveFileName}.${opts.saveFileExt}`, content);
    }
};
