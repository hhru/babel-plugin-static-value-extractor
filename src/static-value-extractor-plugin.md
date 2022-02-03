## Список параметров вебпак плагина и дефолтных значений:
```
saveFilePath: - 
обязательный параметр. Директория куда сохранять итоговые файлы.

pathsToReplace: - 
обязательный параметр, webpackAliases

propsToExtract: 
{
    trls: {
        constantName: 'TrlKeys',
    },
    features: {
        constantName: 'Features',
    },
}
объект, в котором ключи - имена итоговых файлов. Значения - объекты вида {constantName: <имя свойства>}

basePath: process.cwd()
корень пакета, откуда запускается плагин.
 
appContainerPath: basePath + '/static/js/App.tsx'
родительский компонент приложения.

filesArr: basePath + '/static/js/pages/*/index.{jsx,tsx}'
файлы для парсинга

include:['/components', '/pages']
массив строк путей файлов, для которых нужно извлекать значения статических свойств.
```

## Установка, настройка

### Добавьте пакет в зависимости:

```sh
$ yarn add @hh.ru/babel-plugin-static-value-extractor
```

### Подключите класс StaticValueExtractorPlugin в конфиге вебпака:

```
const StaticValueExtractorPlugin = require('@hh.ru/babel-plugin-static-value-extractor/lib/static-value-extractor-plugin');
```

### Настройте параметры в экземпляре класса в плагинах, например:

```
plugins: [
    new StaticValueExtractorPlugin({
            saveFilePath: './skills_survey_front/',
            pathsToReplace: webpackAliases,
            include: ['/components', '/pages', '/proxyComponents'],
            filesArr: [
                path.resolve(__dirname, '../static/js/pages/*/index.{jsx,tsx}'),
                path.resolve(__dirname, '../static/js/proxyComponents/*/index.{jsx,tsx}'),
            ],
    }),
    <...>
]
```
