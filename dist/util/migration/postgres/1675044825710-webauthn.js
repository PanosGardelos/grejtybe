"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webauthn1675044825710 = void 0;
class webauthn1675044825710 {
    name = "webauthn1675044825710";
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "security_keys" ("id" character varying NOT NULL, "user_id" character varying, "key_id" character varying NOT NULL, "public_key" character varying NOT NULL, "counter" integer NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_6e95cdd91779e7cca06d1fff89c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "webauthn_enabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "security_keys" ADD CONSTRAINT "FK_24c97d0771cafedce6d7163eaad" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "security_keys" DROP CONSTRAINT "FK_24c97d0771cafedce6d7163eaad"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "webauthn_enabled"`);
        await queryRunner.query(`DROP TABLE "security_keys"`);
    }
}
exports.webauthn1675044825710 = webauthn1675044825710;
//# sourceMappingURL=1675044825710-webauthn.js.map