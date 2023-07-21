"use strict";
var Member_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicMemberProjection = exports.DefaultUserGuildSettings = exports.Member = exports.MemberPrivateProjection = void 0;
const tslib_1 = require("tslib");
const User_1 = require("./User");
const Message_1 = require("./Message");
const typeorm_1 = require("typeorm");
const Guild_1 = require("./Guild");
const util_1 = require("../util");
const lambert_server_1 = require("lambert-server");
const Role_1 = require("./Role");
const BaseClass_1 = require("./BaseClass");
const _1 = require(".");
const Constants_1 = require("../util/Constants");
const dtos_1 = require("../dtos");
exports.MemberPrivateProjection = [
    "id",
    "guild",
    "guild_id",
    "deaf",
    "joined_at",
    "last_message_id",
    "mute",
    "nick",
    "pending",
    "premium_since",
    "roles",
    "settings",
    "user",
];
let Member = Member_1 = class Member extends BaseClass_1.BaseClassWithoutId {
    index;
    id;
    user;
    guild_id;
    guild;
    nick;
    roles;
    joined_at;
    premium_since;
    deaf;
    mute;
    pending;
    settings;
    last_message_id;
    /**
    @JoinColumn({ name: "id" })
    @ManyToOne(() => User, {
        onDelete: "DO NOTHING",
    // do not auto-kick force-joined members just because their joiners left the server
    }) **/
    joined_by;
    avatar;
    banner;
    bio;
    theme_colors; // TODO: Separate `User` and `UserProfile` models
    pronouns;
    communication_disabled_until;
    // TODO: add this when we have proper read receipts
    // @Column({ type: "simple-json" })
    // read_state: ReadState;
    validate() {
        if (this.nick) {
            this.nick = this.nick.split("\n").join("");
            this.nick = this.nick.split("\t").join("");
        }
    }
    static async IsInGuildOrFail(user_id, guild_id) {
        if (await Member_1.count({
            where: { id: user_id, guild: { id: guild_id } },
        }))
            return true;
        throw new lambert_server_1.HTTPError("You are not member of this guild", 403);
    }
    static async removeFromGuild(user_id, guild_id) {
        const guild = await Guild_1.Guild.findOneOrFail({
            select: ["owner_id"],
            where: { id: guild_id },
        });
        if (guild.owner_id === user_id)
            throw new Error("The owner cannot be removed of the guild");
        const member = await Member_1.findOneOrFail({
            where: { id: user_id, guild_id },
            relations: ["user"],
        });
        // use promise all to execute all promises at the same time -> save time
        return Promise.all([
            Member_1.delete({
                id: user_id,
                guild_id,
            }),
            Guild_1.Guild.decrement({ id: guild_id }, "member_count", -1),
            (0, util_1.emitEvent)({
                event: "GUILD_DELETE",
                data: {
                    id: guild_id,
                },
                user_id: user_id,
            }),
            (0, util_1.emitEvent)({
                event: "GUILD_MEMBER_REMOVE",
                data: { guild_id, user: member.user },
                guild_id,
            }),
        ]);
    }
    static async addRole(user_id, guild_id, role_id) {
        const [member] = await Promise.all([
            Member_1.findOneOrFail({
                where: { id: user_id, guild_id },
                relations: ["user", "roles"],
                select: {
                    index: true,
                    roles: {
                        id: true,
                    },
                },
            }),
            Role_1.Role.findOneOrFail({
                where: { id: role_id, guild_id },
                select: ["id"],
            }),
        ]);
        member.roles.push(Role_1.Role.create({ id: role_id }));
        await Promise.all([
            member.save(),
            (0, util_1.emitEvent)({
                event: "GUILD_MEMBER_UPDATE",
                data: {
                    guild_id,
                    user: member.user,
                    roles: member.roles.map((x) => x.id),
                },
                guild_id,
            }),
        ]);
    }
    static async removeRole(user_id, guild_id, role_id) {
        const [member] = await Promise.all([
            Member_1.findOneOrFail({
                where: { id: user_id, guild_id },
                relations: ["user", "roles"],
                select: {
                    index: true,
                    roles: {
                        id: true,
                    },
                },
            }),
            await Role_1.Role.findOneOrFail({ where: { id: role_id, guild_id } }),
        ]);
        member.roles = member.roles.filter((x) => x.id == role_id);
        await Promise.all([
            member.save(),
            (0, util_1.emitEvent)({
                event: "GUILD_MEMBER_UPDATE",
                data: {
                    guild_id,
                    user: member.user,
                    roles: member.roles.map((x) => x.id),
                },
                guild_id,
            }),
        ]);
    }
    static async changeNickname(user_id, guild_id, nickname) {
        const member = await Member_1.findOneOrFail({
            where: {
                id: user_id,
                guild_id,
            },
            relations: ["user"],
        });
        member.nick = nickname;
        await Promise.all([
            member.save(),
            (0, util_1.emitEvent)({
                event: "GUILD_MEMBER_UPDATE",
                data: {
                    guild_id,
                    user: member.user,
                    nick: nickname,
                },
                guild_id,
            }),
        ]);
    }
    static async addToGuild(user_id, guild_id) {
        const user = await User_1.User.getPublicUser(user_id);
        const isBanned = await _1.Ban.count({ where: { guild_id, user_id } });
        if (isBanned) {
            throw Constants_1.DiscordApiErrors.USER_BANNED;
        }
        const { maxGuilds } = util_1.Config.get().limits.user;
        const guild_count = await Member_1.count({ where: { id: user_id } });
        if (guild_count >= maxGuilds) {
            throw new lambert_server_1.HTTPError(`You are at the ${maxGuilds} server limit.`, 403);
        }
        const guild = await Guild_1.Guild.findOneOrFail({
            where: {
                id: guild_id,
            },
            relations: [..._1.PublicGuildRelations, "system_channel"],
        });
        const memberCount = await Member_1.count({ where: { guild_id } });
        const memberPreview = await Member_1.find({
            where: {
                guild_id,
                user: {
                    sessions: {
                        status: (0, typeorm_1.Not)("invisible"), // lol typescript?
                    },
                },
            },
            take: 10,
        });
        if (await Member_1.count({
            where: { id: user.id, guild: { id: guild_id } },
        }))
            throw new lambert_server_1.HTTPError("You are already a member of this guild", 400);
        const member = {
            id: user_id,
            guild_id,
            nick: undefined,
            roles: [guild_id],
            joined_at: new Date(),
            deaf: false,
            mute: false,
            pending: false,
            bio: "",
        };
        await Promise.all([
            Member_1.create({
                ...member,
                roles: [Role_1.Role.create({ id: guild_id })],
                // read_state: {},
                settings: {
                    guild_id: null,
                    mute_config: null,
                    mute_scheduled_events: false,
                    flags: 0,
                    hide_muted_channels: false,
                    notify_highlights: 0,
                    channel_overrides: {},
                    message_notifications: 0,
                    mobile_push: true,
                    muted: false,
                    suppress_everyone: false,
                    suppress_roles: false,
                    version: 0,
                },
                // Member.save is needed because else the roles relations wouldn't be updated
            }).save(),
            Guild_1.Guild.increment({ id: guild_id }, "member_count", 1),
            (0, util_1.emitEvent)({
                event: "GUILD_MEMBER_ADD",
                data: {
                    ...member,
                    user,
                    guild_id,
                },
                guild_id,
            }),
            (0, util_1.emitEvent)({
                event: "GUILD_CREATE",
                data: {
                    ...new dtos_1.ReadyGuildDTO(guild).toJSON(),
                    members: [...memberPreview, { ...member, user }],
                    member_count: memberCount + 1,
                    guild_hashes: {},
                    guild_scheduled_events: [],
                    joined_at: member.joined_at,
                    presences: [],
                    stage_instances: [],
                    threads: [],
                    embedded_activities: [],
                    voice_states: guild.voice_states,
                },
                user_id,
            }),
        ]);
        if (guild.system_channel_id) {
            // Send a welcome message
            const message = Message_1.Message.create({
                type: 7,
                guild_id: guild.id,
                channel_id: guild.system_channel_id,
                author: user,
                timestamp: new Date(),
                reactions: [],
                attachments: [],
                embeds: [],
                sticker_items: [],
                edited_timestamp: undefined,
                mentions: [],
                mention_channels: [],
                mention_roles: [],
                mention_everyone: false,
            });
            await Promise.all([
                message.save(),
                (0, util_1.emitEvent)({
                    event: "MESSAGE_CREATE",
                    channel_id: message.channel_id,
                    data: message,
                }),
            ]);
        }
    }
};
tslib_1.__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    tslib_1.__metadata("design:type", String)
], Member.prototype, "index", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.RelationId)((member) => member.user),
    tslib_1.__metadata("design:type", String)
], Member.prototype, "id", void 0);
tslib_1.__decorate([
    (0, typeorm_1.JoinColumn)({ name: "id" }),
    (0, typeorm_1.ManyToOne)(() => User_1.User, {
        onDelete: "CASCADE",
    }),
    tslib_1.__metadata("design:type", User_1.User)
], Member.prototype, "user", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.RelationId)((member) => member.guild),
    tslib_1.__metadata("design:type", String)
], Member.prototype, "guild_id", void 0);
tslib_1.__decorate([
    (0, typeorm_1.JoinColumn)({ name: "guild_id" }),
    (0, typeorm_1.ManyToOne)(() => Guild_1.Guild, {
        onDelete: "CASCADE",
    }),
    tslib_1.__metadata("design:type", Guild_1.Guild)
], Member.prototype, "guild", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], Member.prototype, "nick", void 0);
tslib_1.__decorate([
    (0, typeorm_1.JoinTable)({
        name: "member_roles",
        joinColumn: { name: "index", referencedColumnName: "index" },
        inverseJoinColumn: {
            name: "role_id",
            referencedColumnName: "id",
        },
    }),
    (0, typeorm_1.ManyToMany)(() => Role_1.Role, { cascade: true }),
    tslib_1.__metadata("design:type", Array)
], Member.prototype, "roles", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", Date)
], Member.prototype, "joined_at", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: "bigint", nullable: true }),
    tslib_1.__metadata("design:type", Number)
], Member.prototype, "premium_since", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", Boolean)
], Member.prototype, "deaf", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", Boolean)
], Member.prototype, "mute", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", Boolean)
], Member.prototype, "pending", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", select: false }),
    tslib_1.__metadata("design:type", Object)
], Member.prototype, "settings", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], Member.prototype, "last_message_id", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], Member.prototype, "joined_by", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], Member.prototype, "avatar", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], Member.prototype, "banner", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)(),
    tslib_1.__metadata("design:type", String)
], Member.prototype, "bio", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: "simple-array" }),
    tslib_1.__metadata("design:type", Array)
], Member.prototype, "theme_colors", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    tslib_1.__metadata("design:type", String)
], Member.prototype, "pronouns", void 0);
tslib_1.__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    tslib_1.__metadata("design:type", Date)
], Member.prototype, "communication_disabled_until", void 0);
tslib_1.__decorate([
    (0, typeorm_1.BeforeUpdate)(),
    (0, typeorm_1.BeforeInsert)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], Member.prototype, "validate", null);
Member = Member_1 = tslib_1.__decorate([
    (0, typeorm_1.Entity)("members"),
    (0, typeorm_1.Index)(["id", "guild_id"], { unique: true })
], Member);
exports.Member = Member;
exports.DefaultUserGuildSettings = {
    channel_overrides: null,
    message_notifications: 1,
    flags: 0,
    hide_muted_channels: false,
    mobile_push: true,
    mute_config: null,
    mute_scheduled_events: false,
    muted: false,
    notify_highlights: 0,
    suppress_everyone: false,
    suppress_roles: false,
    version: 453,
    guild_id: null,
};
exports.PublicMemberProjection = [
    "id",
    "guild_id",
    "nick",
    "roles",
    "joined_at",
    "pending",
    "deaf",
    "mute",
    "premium_since",
];
//# sourceMappingURL=Member.js.map