const path = require('path');
const extractStaticValueFromGlob = require('./index').default;
const { extractStaticValueImportedFilesFromFile, prepareCache } = require('./index');

const extractStaticValues = ({ saveFilePath, filesArr, appContainerPath, basePath, ...otherSettings }) => {
    const settings = { basePath, ...otherSettings };
    prepareCache(settings);

    console.log('preparing with settings', settings)
    const newSettings = {...settings}
    newSettings.include = [
        'src/app/App',
        'src/components',
        'src/pages',
        'src/hooks',
        'src/widgets',
        '/front-static-app',
    ]
    extractStaticValueImportedFilesFromFile(appContainerPath, newSettings, (appContainerData) => {
        extractStaticValueFromGlob(filesArr, {
            ...settings,
            saveFilePath,
            saveFileExt: 'py',
            template: (propName, propData) => {
                Object.keys(propData).forEach((container) => {
                    propData[container] = propData[container].concat(appContainerData[propName]);
                });
                return propData ? `${propName} = ${JSON.stringify(propData)}` : `${propName} = {}`;
            },
        });
    });
};

class StaticValueExtractorPlugin {
    constructor({
        propsToExtract = {
            trls: {
                constantName: 'TrlKeys',
            },
            features: {
                constantName: 'Features',
            },
        },
        include = ['/components', '/pages'],
        basePath,
        filesArr,
        appContainerPath,
        ...otherParams
    }) {
        this.options = {};

        if (!basePath) {
            this.options.basePath = process.cwd();
        } else {
            this.options.basePath = basePath;
        }

        if (!appContainerPath) {
            this.options.appContainerPath = path.join(this.options.basePath, '/src/app/App.tsx');
        } else {
            this.options.appContainerPath = appContainerPath;
        }

        if (!filesArr) {
            this.options.filesArr = [path.join(this.options.basePath, '/src/pages/*/index.{jsx,tsx}')];
        } else {
            this.options.filesArr = filesArr;
        }

        this.options = { ...this.options, ...otherParams, propsToExtract, include };
    }

    apply(compiler) {
        compiler.hooks.done.tap('StaticValueExtractorPlugin', (stats) => {
            if (!stats.hasErrors()) {
                extractStaticValues(this.options);
            }
        });
    }
}

module.exports = StaticValueExtractorPlugin;
