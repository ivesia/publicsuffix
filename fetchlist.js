const fs = require('fs');
const urllib = require('urllib');

/* eslint no-console: 0 */

const comment = `/**
 * 通用域名前缀列表
 * 数据来自 https://publicsuffix.org/list/
 * @update: {date}
 */
`;

const writeFile = async function writeFile(filePath, content) {
    const out = fs.createWriteStream(filePath);
    out.write(content);
};

const fetchList = async function fetchList(link) {
    const result = await urllib.request(link);
    return result.data.toString();
};

const cleanupList = function cleanupList(lines) {
    const result = {reject: [], accept: [], wildcard: []};

    const len = lines.length;
    for (let index = 0; index < len; index++) {
        const line = lines[index].trim();
        if (/^$|^\/\/|^\s/.test(line)) {
            continue;
        }

        if (line.startsWith('!')) {
            result.reject.push(line);
            continue;
        }

        if (line.startsWith('*.')) {
            result.wildcard.push(line);
            continue;
        }

        result.accept.push(line);
    }

    return result;
};

const init = async function init() {
    console.log('Start fetch public suffix list.');
    const link = 'https://publicsuffix.org/list/public_suffix_list.dat';
    const result = await fetchList(link);
    const lists = cleanupList(result.split('\n'));

    const header = comment.replace('{date}', new Date()) + 'module.exports = ';
    const content = header + JSON.stringify(lists, null, '    ');
    await writeFile('./src/publicsuffix-list.js', content);
    console.log('Fetch public suffix list success.');
};

init().catch(err => {
    console.error(err);
});
