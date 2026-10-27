import { config, describeDb } from '../src/config.js';
import { migrate } from '../src/db.js';

await migrate();
console.log(`Esquema listo en: ${describeDb(config.dbUrl)}`);
