# babel-plugin-static-value-extractor

## Сервис содержит webpack обертку:

[Линк на документацию вебпак обёртки.](src/static-value-extractor-plugin.md)

## Описание

Плагин парсит jsx, tsx файлы, и извлекает необходимые значения статических свойств у классов или функций, которые представляют собой объект типа ключ - значение. Value парсятся если они имеют тип String.

```
extractStaticValueFromGlob([
    файлы для парсинга
], {
    propsToExtract: 
    { 
        <имя файла> {
            constantName: <имя свойства>
        },
        <...>   
    }
    saveFilePath: — путь, куда сохранять значения свойств
    saveFileExt: — расширение файлов,
    pathsToReplace: — webpackAliases,
    include: — массив строк путей файлов, для которых нужно извлекать значения статических свойств,
    template: — функция которая возвращает шаблон контента(string), в качестве аргумента передается объект с ключами названий Файлов и значением массивов извлеченных значений, если не передать - контентом сохраненного файла будет JSON представление.',
});
```

## Зачем

В свойствах компонентов мы указываем варианты интерфейсных переводов, нам необходимо знать используемые ключи в 
контейнерных компонентах и используемых ими компонентах.

## Установка

```sh
$ yarn add @hh.ru/babel-plugin-static-value-extractor
```

## Запуск тестов

 ```sh
 $ yarn test
 ```
