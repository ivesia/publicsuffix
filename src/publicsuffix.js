const list = require('./publicsuffix-list');

const rejectExist = function rejectExist(domain) {
    return list.reject.some(item => item.replace(/^!/, '') === domain);
};

const findLongest = function findLongest(domain) {
    let finded = '';
    list.accept.forEach(item => {
        const index = `.${domain}`.indexOf(`.${item}`);
        if (index < 0 || index !== domain.length - item.length) {
            return;
        }

        if (finded.split('.').length < item.split('.').length) {
            finded = item;
        }
    });

    list.wildcard.forEach(item => {
        const index = domain.indexOf(item.replace(/^\*/, ''));
        if (index <= 0 || index !== domain.length - item.length + 1) {
            return;
        }

        if (!finded || finded.split('.').length < item.split('.').length - 1) {
            const itemReg = item.replace(/\\./g, '\\.').replace(/^\*/, '[^.]+');
            const result = new RegExp(`${itemReg}$`, 'i').exec(domain);
            if (result && !rejectExist(result[0])) {
                finded = result[0];
            }
        }
    });

    return finded;
};

const extract = function extract(domain) {
    if (!domain) {
        return [domain, false];
    }

    domain = domain.toLowerCase();

    // IPv4, TODO: support IPv6
    if (/^(\d+\.){3}\d+$/.test(domain)) {
        return [domain, false];
    }

    if (domain.indexOf('.') < 0) {
        return [domain, false];
    }

    let result = findLongest(domain);
    if (!result) {
        const matches = /([^.]+)$/.exec(domain);
        result = matches[1] || domain;
    }

    return [result, result !== domain.replace(/^\./, '')];
};

module.exports = {extract};
