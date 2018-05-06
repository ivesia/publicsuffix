const list = require('./publicsuffix-list');

const regList = {reject: [], wildcard: [], accept: []};

const debug = function debug() {
    // console.log(...msg);
};

// Transform list in regexps
(function transform() {
    for (let index = 0, len = list.reject.length; index < len; index++) {
        const suffix = list.reject[index].replace(/\./g, '\\.');
        regList.reject.push(new RegExp(`(.+\\.|)(${suffix})$`, 'i'));
    }

    for (let index = 0, len = list.wildcard.length; index < len; index++) {
        const suffix = list.wildcard[index].replace(/\./g, '\\.');
        regList.wildcard.push(new RegExp(`(.+\\.|)((?:[^\\.]+\\.|)[^\\.]+\\.${suffix})$`, 'i'));
    }

    for (let index = 0, len = list.accept.length; index < len; index++) {
        const suffix = list.accept[index].replace(/\./g, '\\.');
        regList.accept.push(new RegExp(`(.+\\.|)((?:[^\\.]+\\.|)${suffix})$`, 'i'));
    }
}());

const findFirst = function findFirst(list, domain) {
    const length = list.length;
    for (let index = 0; index < length; index++) {
        const matches = list[index].exec(domain);
        if (matches) {
            debug('found first with', list[index]);
            return matches.slice(1);
        }
    }
};

const findLongest = function findLongest(list, domain) {
    const results = [];
    const length = list.length;

    for (let index = 0; index < length; index++) {
        const matches = list[index].exec(domain);
        if (matches) {
            results.push(matches.slice(1));
        }
    }

    debug('longest matches', results);

    if (results.length > 0) {
        results.sort((item, other) => other[1].length - item[1].length);
        return results[0];
    }

    return null;
};

const extract = function extract(domain) {
    let result = '';

    if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
        return ['', domain];
    }

    if (!result) {
        debug('try reject');
        result = findFirst(regList.reject, domain);
    }

    if (!result) {
        debug('try accept');
        result = findLongest(regList.accept, domain);

        if (result && result[0]) {
            const fixme = result[0].split(/([^.]+\.)$/);
            result[0] = fixme[0];
            result[1] = fixme[1] + result[1];
        }
    }

    if (!result) {
        debug('try wildcard');
        result = findFirst(regList.wildcard, domain);

        if (result && result[0]) {
            const fixme = result[0].split(/([^.]+\.)$/);
            result[0] = fixme[0];
            result[1] = fixme[1] + result[1];
        }
    }

    if (!result) {
        debug('set default');
        result = /^(.*)([^.]+\.[^.]+)$/.exec(domain);
        result.shift();
    }

    debug('result', result);
    return result;
};

const extractURL = function extractURL(str) {
    const result = /^(\s*[a-z]+:(?:\/\/)?(?:[^@:]+(?::[^@:]+)?@)?|)([^/:]+)(.*)$/.exec(str).slice(1);

    debug('split', result);

    const domain = extract(result[1]);
    result[0] += domain[0];
    result[1] = domain[1];

    return result;
};

module.exports = {extract, extractURL};
