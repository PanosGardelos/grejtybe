"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateDeleteCascade1673609465036 = void 0;
class templateDeleteCascade1673609465036 {
    name = "templateDeleteCascade1673609465036";
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`templates\` DROP FOREIGN KEY \`FK_445d00eaaea0e60a017a5ed0c11\``);
        await queryRunner.query(`ALTER TABLE \`templates\` ADD CONSTRAINT \`FK_445d00eaaea0e60a017a5ed0c11\` FOREIGN KEY (\`source_guild_id\`) REFERENCES \`guilds\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`templates\` DROP FOREIGN KEY \`FK_445d00eaaea0e60a017a5ed0c11\``);
        await queryRunner.query(`ALTER TABLE \`templates\` ADD CONSTRAINT \`FK_445d00eaaea0e60a017a5ed0c11\` FOREIGN KEY (\`source_guild_id\`) REFERENCES \`guilds\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
exports.templateDeleteCascade1673609465036 = templateDeleteCascade1673609465036;
//# sourceMappingURL=1673609465036-templateDeleteCascade.js.map