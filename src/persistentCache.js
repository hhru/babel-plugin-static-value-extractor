import fs from 'fs';
import os from 'os';
import path from 'path';

import findCacheDir from 'find-cache-dir';

const CACHE_SAVE_DELAY_MS = 300;
let cacheSaveTimeout;

const getCacheFilePath = () => {
    const cacheDir = findCacheDir({ name: 'babel-plugin-static-value-extractor' }) || os.tmpdir();
    return path.join(cacheDir, 'files_v2.json');
}

export const getPersistentCache = () => {
    const cacheFile = getCacheFilePath();
    if (!fs.existsSync(cacheFile)) {
        return {}
    }

    let cacheObject = {};

    try {
        const cache = fs.readFileSync(cacheFile).toString();
        cacheObject = JSON.parse(cache);
    } catch (e) {
        try {
            fs.unlinkSync(cacheFile);
        } catch (e) {
            console.log(e);
        }
    }

    return cacheObject;
}

const actualCacheSave = (cache) => {
    const cacheFile = getCacheFilePath();
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(cache));
}

export const savePersistentCache = (cache) => {
    clearTimeout(cacheSaveTimeout);

    setTimeout(
        () => actualCacheSave(cache),
        CACHE_SAVE_DELAY_MS
    )
}
