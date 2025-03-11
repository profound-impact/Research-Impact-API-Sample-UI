const nodeCache = require("node-cache");

const cacheHandler = new nodeCache();

const myTest = function myTest() {
    console.log('Welcome to custom js');
}
const isExists = function isExists(param, checkEmpty = false, checkNaN = false, checkBool = false) {
    let exists = param !== undefined && param !== null && param !== 'undefined' && param !== 'null';

    if (checkBool)
        exists = exists && (typeof param === 'boolean' || (typeof param === 'number' && (param === 1 || param === 0)));
    if (checkEmpty && typeof param === 'string')
        exists = exists && param.trim() !== '';
    else if (checkNaN)
        exists = !isNaN(param);
    return exists;
}

const CACHE_TTL = {
    DEFAULT_TTL: 900, // 15 minutes
    CACHE_TTL_15SEC: 15
}

const getCacheKey = function (key, prefix) {
    if (isExists(key, true) && typeof key === 'string' || typeof key === 'number') {
        if (isExists(prefix, true) && typeof prefix === 'string')
            return `${prefix}-${key}`.trim();
        else
            return key;
    }
    return '';
};

const getCache = function (key, prefix = null) {

    let cachedValue = null;

    try {
        key = getCacheKey(key, prefix);
        if (cacheHandler.has(key))
            cachedValue = cacheHandler.get(key);
    }
    catch (error) {
        console.log('CacheHandler-getCache Error:');
        console.error(error);
    } finally {
        return cachedValue;
    }
};

const setCache = function (key, value, prefix = null, ttl = CACHE_TTL.DEFAULT_TTL) {
    try {

        if (!isExists(value))
            throw new Error('Cache value is missing');

        key = getCacheKey(key, prefix);

        if (!isExists(key, true))
            throw new Error('Cache key is missing');

        cacheHandler.set(key, value, ttl);
    } catch (error) {
        console.log('CacheHandler-setCache Error:');
        console.error(error);
    }
};

const deleteCache = function (key, prefix = null) {
    try {
        key = getCacheKey(key, prefix);
        if (cacheHandler.has(key))
            cacheHandler.del(key);
    } catch (error) {
        console.log('CacheHandler-deleteCache Error:');
        console.error(error);
    }
};

const getSecretFromSecretsManager = async function (secretManagerClient, secretName) {
    let secretData = null;

    try {
        secretData = getCache(secretName);

        if (isExists(secretData)) {
            console.debug(`Secret ${secretName} retrieved from cache`);
            return secretData;
        }

        secretData = await secretManagerClient.getSecretValue({ SecretId: secretName }).promise();

        if (!isExists(secretData.SecretString))
            throw 'SecretString not found';

        setCache(secretName, secretData);

        return secretData;

    } catch (error) {
        console.log(`Failed to retrieve secret ${secretName} from Secrets Manager`);
        console.error(error);
        return null;
    }
};
const listKeys = function listKeys(){
    let exists = cacheHandler.keys()
    console.log(exists)
}
module.exports = {
    myTest: myTest,
    isExists: isExists,
    getCache: getCache,
    setCache: setCache,
    deleteCache: deleteCache,
    getSecretFromSecretsManager: getSecretFromSecretsManager,
    listKeys:listKeys,
    cacheTTL: CACHE_TTL
};