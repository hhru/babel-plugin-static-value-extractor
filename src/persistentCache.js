import fs from 'fs';

export const getPersistentCache = ({ cacheFile }) => {
    if (!fs.existsSync(cacheFile)) {
        console.log('somehow missed file ', cacheFile);
        return {}
    }

    const cache = fs.readFileSync(cacheFile).toString();
    return JSON.parse(cache);
}

export const savePersistentCache = (cache, { cacheFile }) => {
    fs.writeFileSync(cacheFile, JSON.stringify(cache));
}