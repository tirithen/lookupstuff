const PromisedCache = require('promised-cache');
const homedir = require('homedir');
const md5 = require('md5');

const cacheDirectory = `${homedir()}/.lookupstuff/cache`;
const timeToRelease = 1000 * 3600 * 24 * 30;
const cache = new PromisedCache(cacheDirectory, timeToRelease);

const getDuckDuckGoSearchHits = require('./getDuckDuckGoSearchHits');
const getPageContent = require('./getPageContent');

function lookupstuff(query, minLength = 250) {
  return new Promise((resolve, reject) => {
    cache.get(md5(query)).then((cachedResult) => {
      if (cachedResult) {
        resolve(cachedResult);
      } else {
        getDuckDuckGoSearchHits(query).then((results) => {
          function getNext(index) {
            getPageContent(results[index].url, minLength).then(
              (content) => {
                const result = {
                  content,
                  url: results[index].url
                };

                resolve(result);
                cache.set(md5(query), result).then(resolve, resolve);
              },
              (error) => {
                if (index < results.length - 1) {
                  getNext(index + 1);
                } else {
                  reject(error);
                }
              }
            );
          }
          getNext(0);
        }, reject);
      }
    });
  });
}

module.exports = lookupstuff;
