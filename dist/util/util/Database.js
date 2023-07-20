"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.DatabaseType = exports.DataSourceOptions = exports.dbConnection = exports.initDatabase = exports.getDatabase = void 0;
const tslib_1 = require("tslib");
const typeorm_1 = require("typeorm");
const picocolors_1 = require("picocolors");
const Migration_1 = require("../entities/Migration");
const Config_1 = require("../entities/Config");
const dotenv_1 = require("dotenv");
const path_1 = tslib_1.__importDefault(require("path"));
// UUID extension option is only supported with postgres
// We want to generate all id's with Snowflakes that's why we have our own BaseEntity class
let dbConnection;
exports.dbConnection = dbConnection;
// For typeorm cli
if (!process.env) {
    (0, dotenv_1.config)();
}
const dbConnectionString = process.env.DATABASE || path_1.default.join(process.cwd(), "database.db");
const DatabaseType = dbConnectionString.includes("://")
    ? dbConnectionString.split(":")[0]?.replace("+srv", "")
    : "sqlite";
exports.DatabaseType = DatabaseType;
const isSqlite = DatabaseType.includes("sqlite");
const DataSourceOptions = new typeorm_1.DataSource({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore type 'string' is not 'mysql' | 'sqlite' | 'mariadb' | etc etc
    type: DatabaseType,
    charset: "utf8mb4",
    ssl: {
        rejectUnauthorized: false,
      },
    url: isSqlite ? undefined : dbConnectionString,
    database: isSqlite ? dbConnectionString : undefined,
    entities: [path_1.default.join(__dirname, "..", "entities", "*.js")],
    synchronize: !!process.env.DB_SYNC,
    logging: false,
    bigNumberStrings: false,
    supportBigNumbers: true,
    name: "default",
    migrations: [path_1.default.join(__dirname, "..", "migration", DatabaseType, "*.js")],
});
exports.DataSourceOptions = DataSourceOptions;
// Gets the existing database connection
function getDatabase() {
    // if (!dbConnection) throw new Error("Tried to get database before it was initialised");
    if (!dbConnection)
        return null;
    return dbConnection;
}
exports.getDatabase = getDatabase;
// Called once on server start
async function initDatabase() {
    if (dbConnection)
        return dbConnection;
    if (isSqlite) {
        console.log(`[Database] ${(0, picocolors_1.red)(`You are running sqlite! Please keep in mind that we recommend setting up a dedicated database!`)}`);
    }
    if (!process.env.DB_SYNC) {
        const supported = ["mysql", "mariadb", "postgres", "sqlite"];
        if (!supported.includes(DatabaseType)) {
            console.log("[Database]" +
                (0, picocolors_1.red)(` We don't have migrations for DB type '${DatabaseType}'` +
                    ` To ignore, set DB_SYNC=true in your env. https://docs.fosscord.com/setup/server/configuration/env/`));
            process.exit();
        }
    }
    console.log(`[Database] ${(0, picocolors_1.yellow)(`Connecting to ${DatabaseType} db`)}`);
    exports.dbConnection = dbConnection = await DataSourceOptions.initialize();
    // Crude way of detecting if the migrations table exists.
    const dbExists = async () => {
        try {
            await Config_1.ConfigEntity.count();
            return true;
        }
        catch (e) {
            return false;
        }
    };
    if (!(await dbExists())) {
        console.log("[Database] This appears to be a fresh database. Synchronising.");
        await dbConnection.synchronize();
        // On next start, typeorm will try to run all the migrations again from beginning.
        // Manually insert every current migration to prevent this:
        await Promise.all(dbConnection.migrations.map((migration) => Migration_1.Migration.insert({
            name: migration.name,
            timestamp: Date.now(),
        })));
    }
    else {
        console.log("[Database] Applying missing migrations, if any.");
        await dbConnection.runMigrations();
    }
    console.log(`[Database] ${(0, picocolors_1.green)("Connected")}`);
    return dbConnection;
}
exports.initDatabase = initDatabase;
async function closeDatabase() {
    await dbConnection?.destroy();
}
exports.closeDatabase = closeDatabase;
//# sourceMappingURL=Database.js.map