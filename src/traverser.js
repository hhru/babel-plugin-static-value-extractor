import fs from 'fs';
import nodePath from 'path';
import { types } from '@babel/core';

const JS_EXTENSIONS = ['', 'js', 'jsx', 'ts', 'tsx'];

const getFinalNodeValues = (node) => {
    if (!types.isObjectExpression(node)) {
        return [];
    }
    return node.properties.reduce((arr, { value }) => {
        if (types.isObjectExpression(value)) {
            arr.push(...getFinalNodeValues(value));
        }
        if (types.isStringLiteral(value)) {
            arr.push(value.value);
        }
        return arr;
    }, []);
};

const isJsFile = (path) => JS_EXTENSIONS.includes(nodePath.parse(path).ext);

const replacePath = (path, pathsToReplace = {}) =>
    Object.keys(pathsToReplace)
        .filter((checkPath) => path.startsWith(checkPath))
        .reduce((result, checkPath) => nodePath.normalize(result.replace(checkPath, pathsToReplace[checkPath])), path);

export default (cb, opts = {}) => {
    const currentFileDir = nodePath.parse(opts.filename).dir;
    const { propsToExtract, pathsToReplace, basePath } = opts;
    const propNames = Object.keys(propsToExtract);
    const staticProps = propNames.reduce((agg, name) => ({ ...agg, [name]: [] }), {});
    const constants = propNames.reduce(
        (agg, name) => {
            if (propsToExtract[name].constantName) {
                return {
                    ...agg,
                    [propsToExtract[name].constantName]: name
                }
            }

            return agg;
        },
        {}
    );
    const constantNames = Object.keys(constants);
    const importDeclarationPaths = [];

    const processImports = (filePath) => {
        const hasExt = nodePath.parse(filePath).ext;
        const defaultFileNameTs = hasExt ? '' : 'index.tsx';
        const defaultFileNameJs = hasExt ? '' : 'index.jsx';
        const importPath = nodePath.resolve(currentFileDir, filePath);

        const paths = [
            nodePath.resolve(importPath, defaultFileNameTs),
            nodePath.resolve(importPath, defaultFileNameJs),
            `${importPath}.tsx`,
            `${importPath}.jsx`,
            `${importPath}.ts`,
            `${importPath}.js`,
        ];

        const declarationPath = paths.find((path) => fs.existsSync(path));
        if (declarationPath) {
            importDeclarationPaths.push(nodePath.relative(basePath, declarationPath));
        }
    };

    return {
        Program: {
            exit() {
                cb(staticProps, importDeclarationPaths);
            },
        },

        VariableDeclarator: {
            enter(path) {
                if (constantNames.includes(path.node.id.name) && types.isProgram(path.parentPath.parent)) {
                    staticProps[constants[path.node.id.name]].push(...getFinalNodeValues(path.node.init))
                }
            },
        },

        ClassProperty: {
            enter(path) {
                const { node } = path;

                if (!node.static) {
                    return;
                }

                if (
                    types.isIdentifier(node.key) &&
                    propNames.includes(node.key.name) &&
                    types.isObjectExpression(node.value)
                ) {
                    staticProps[node.key.name].push(...getFinalNodeValues(node.value))
                }
            },
        },

        ExpressionStatement: {
            enter(path) {
                path.traverse({
                    AssignmentExpression: {
                        enter({ node }) {
                            if (!types.isMemberExpression(node.left)) {
                                return;
                            }

                            const propIsMemberExpression =
                                types.isMemberExpression(node.left.object) &&
                                propNames.includes(node.left.object.property.name) &&
                                types.isStringLiteral(node.right);

                            const propsIsObjectExpression =
                                types.isIdentifier(node.left.object) &&
                                propNames.includes(node.left.property.name) &&
                                types.isObjectExpression(node.right);

                            if (propIsMemberExpression) {
                                staticProps[node.left.object.property.name].push(node.right.value);
                            } else if (propsIsObjectExpression) {
                                staticProps[node.left.property.name].push(...getFinalNodeValues(node.right))
                            }
                        },
                    },
                });
            },
        },

        ImportDeclaration: {
            enter({ node }) {
                if (node && node.source && isJsFile(node.source.value)) {
                    processImports(replacePath(node.source.value, pathsToReplace));
                }
            },
        },

        CallExpression: {
            enter({ node }) {
                if (node && node.callee && types.isImport(node.callee)) {
                    processImports(node.arguments[0].value);
                }
            },
        },
    };
};
