# babel-plugin-static-value-extractor

## Описание

Плагин парсит jsx файлы, и извлекает необходимое значения статических свойств у классов или функций, которые представляют собой объект типа ключ - значение. Value парсятся если они имеют тип String.
Переданный файл считается рутовым и все его импорты будут также распаршены и сохранены в внешний файл, по 
необходимому шаблону.

```
extractStaticValueFromGlob([
    файлы для парсинга
], {
    staticPropName: - имя свойства
    saveFileName: - имя файла
    saveFilePath: - путь, куда сохранять значения свойств
    saveFileExt: - расширение файла,
    template: Функция которая возвращает шаблон контента(string), в качестве аргумента передается объект с ключами названий Файлов и значением массивов извлеченных значений, если не передать контентом сохраненного файла будет JSON представление.',
});
```

## Зачем

В свойствах компонентов мы указываем варианты интерфейсных переводов, нам необходимо знать используемые ключи в 
контейнерных компонентах и используемых ими компонентах.

## Установка

```sh
$ yarn install babel-plugin-static-value-extractor
```

## Запуск тестов

 ```sh
 $ yarn test
 ```

## Пример использования в Node окружении

```javascript
const extractStaticValueFromGlob = require('babel-parser-parse-static-trl');

extractStaticValueFromGlob(['/Component/*.jsx'], {
    staticPropName: 'customProps',
    saveFileName: 'Component',
    saveFilePath: 'customPath',
    saveFileExt: 'js',
});
```
