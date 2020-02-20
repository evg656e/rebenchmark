import { promises } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function list() {
    const list = await promises.readdir(__dirname);
    return list
        .filter(f => (f[0] !== '_') && f.endsWith('.js'))
        .map(f => f.split('_')[0]);
}

export async function load(name) {
    try {
        return await import(`./${name}_reporter`);
    }
    catch (e) {
        return await import(name);
    }
}
