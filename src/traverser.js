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

const getConcatenatedStaticProps = (staticProps, nodeStaticProps) =>
    staticProps.concat(getFinalNodeValues(nodeStaticProps));

const isJsFile = (path) => JS_EXTENSIONS.includes(nodePath.parse(path).ext);

const replacePath = (path, pathsToReplace = {}) =>
    Object.keys(pathsToReplace)
        .filter((checkPath) => path.startsWith(checkPath))
        .reduce((result, checkPath) => nodePath.normalize(result.replace(checkPath, pathsToReplace[checkPath])), path);

export default (cb, opts = {}) => {
    let staticProps = [];
    const currentFileDir = nodePath.parse(opts.filename).dir;
    const { staticPropName, pathsToReplace } = opts;
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

        paths.some((path) => {
            if (fs.existsSync(path)) {
                importDeclarationPaths.push(path);
                return true;
            }
        });
    };

    return {
        Program: {
            exit() {
                cb(staticProps, importDeclarationPaths);
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
                    node.key.name === staticPropName &&
                    types.isObjectExpression(node.value)
                ) {
                    staticProps = getConcatenatedStaticProps(staticProps, node.value);
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
                                node.left.object.property.name === staticPropName &&
                                types.isStringLiteral(node.right);

                            const propsIsObjectExpression =
                                types.isIdentifier(node.left.object) &&
                                node.left.property.name === staticPropName &&
                                types.isObjectExpression(node.right);

                            if (propIsMemberExpression) {
                                staticProps.push(node.right.value);
                            } else if (propsIsObjectExpression) {
                                staticProps = getConcatenatedStaticProps(staticProps, node.right);
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
