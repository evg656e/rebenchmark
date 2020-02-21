import { parse } from 'path';

function isName(name) {
    try {
        return parse(name).name === name;
    }
    catch (e) {
        return false;
    }
}

export default function load(nameOrUrl) {
    return isName(nameOrUrl) ?
        import(`../reporters/${nameOrUrl}`) :
        import(nameOrUrl);
}
