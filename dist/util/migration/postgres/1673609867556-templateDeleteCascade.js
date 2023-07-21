"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateDeleteCascade1673609867556 = void 0;
class templateDeleteCascade1673609867556 {
    name = "templateDeleteCascade1673609867556";
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "templates" DROP CONSTRAINT "FK_445d00eaaea0e60a017a5ed0c11"`);
        await queryRunner.query(`ALTER TABLE "templates" ADD CONSTRAINT "FK_445d00eaaea0e60a017a5ed0c11" FOREIGN KEY ("source_guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "templates" DROP CONSTRAINT "FK_445d00eaaea0e60a017a5ed0c11"`);
        await queryRunner.query(`ALTER TABLE "templates" ADD CONSTRAINT "FK_445d00eaaea0e60a017a5ed0c11" FOREIGN KEY ("source_guild_id") REFERENCES "guilds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
exports.templateDeleteCascade1673609867556 = templateDeleteCascade1673609867556;
//# sourceMappingURL=1673609867556-templateDeleteCascade.js.map