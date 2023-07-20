

import { Column, Entity, JoinColumn, ManyToOne, RelationId } from "typeorm";
import { BaseClass } from "./BaseClass";
import { User } from "./User";

@Entity("security_keys")
export class SecurityKey extends BaseClass {
	@Column({ nullable: true })
	@RelationId((key: SecurityKey) => key.user)
	user_id: string;

	@JoinColumn({ name: "user_id" })
	@ManyToOne(() => User, {
		onDelete: "CASCADE",
	})
	user: User;

	@Column()
	key_id: string;

	@Column()
	public_key: string;

	@Column()
	counter: number;

	@Column()
	name: string;
}
