import fs from 'fs';
import nodePath from 'path';
import { types } from 'babel-core';

const getConcatenatedStaticProps = (staticProps, nodeStaticProps) => (
    staticProps.concat(
        nodeStaticProps.reduce((arr, { value }) => {
            if (types.isStringLiteral(value)) {
                arr.push(value.value)
            }

            return arr;
        }, [])
    )
);

export default (cb, opts = {}) => {
    let staticProps = [];
    const currentFileDir = nodePath.parse(opts.filename).dir;
    const { staticPropName } = opts;
    const importDeclarationPaths = [];
    
    const processImports = (filePath) => {
        const defaultFileName = nodePath.parse(filePath).ext ? '' : 'index.jsx';
        const importPath = nodePath.resolve(currentFileDir, filePath);
    
        if (fs.existsSync(importPath)) {
            importDeclarationPaths.push(nodePath.resolve(importPath, defaultFileName));
        } else if (fs.existsSync(`${importPath}.jsx`)) {
            importDeclarationPaths.push(`${importPath}.jsx`);
        }
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
                    types.isIdentifier(node.key) && node.key.name === staticPropName &&
                    types.isObjectExpression(node.value)
                ) {
                    staticProps = getConcatenatedStaticProps(staticProps, node.value.properties);
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
                            
                            const propIsMemberExpression = (
                                types.isMemberExpression(node.left.object) &&
                                node.left.object.property.name === staticPropName &&
                                types.isStringLiteral(node.right)
                            );
                            
                            const propsIsObjectExpression = (
                                types.isIdentifier(node.left.object) &&
                                node.left.property.name === staticPropName &&
                                types.isObjectExpression(node.right)
                            );
                            
                            if (propIsMemberExpression) {
                                staticProps.push(node.right.value)
                            } else if (propsIsObjectExpression) {
                                staticProps = getConcatenatedStaticProps(staticProps, node.right.properties);
                            }
                        },
                    },
                });
            },
        },

        ImportDeclaration: {
            enter({ node }) {
                if (node && node.source && !nodePath.isAbsolute(node.source.value) && node.source.value[0] === '.') {
                    processImports(node.source.value);
                }
            },
        },
    
        CallExpression: {
            enter({ node }) {
                if (node && node.callee && types.isImport(node.callee)) {
                    processImports(node.arguments[0].value);
                }
            }
        }
    };
};
