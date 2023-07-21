"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.onLazyRequest = void 0;
const util_1 = require("@greektube/util");
const gateway_1 = require("@greektube/gateway");
const instanceOf_1 = require("./instanceOf");
// TODO: only show roles/members that have access to this channel
// TODO: config: to list all members (even those who are offline) sorted by role, or just those who are online
// TODO: rewrite typeorm
const getMostRelevantSession = (sessions) => {
    const statusMap = {
        online: 0,
        idle: 1,
        dnd: 2,
        invisible: 3,
        offline: 4,
    };
    // sort sessions by relevance
    sessions = sessions.sort((a, b) => {
        return (statusMap[a.status] -
            statusMap[b.status] +
            (a.activities.length - b.activities.length) * 2);
    });
    return sessions.first();
};
async function getMembers(guild_id, range) {
    if (!Array.isArray(range) || range.length !== 2) {
        throw new Error("range is not a valid array");
    }
    // TODO: wait for typeorm to implement ordering for .find queries https://github.com/typeorm/typeorm/issues/2620
    let members = [];
    try {
        members =
            (await (0, util_1.getDatabase)()
                ?.getRepository(util_1.Member)
                .createQueryBuilder("member")
                .where("member.guild_id = :guild_id", { guild_id })
                .leftJoinAndSelect("member.roles", "role")
                .leftJoinAndSelect("member.user", "user")
                .leftJoinAndSelect("user.sessions", "session")
                .addSelect("user.settings")
                .addSelect("CASE WHEN session.status = 'offline' THEN 0 ELSE 1 END", "_status")
                .orderBy("role.position", "DESC")
                .addOrderBy("_status", "DESC")
                .addOrderBy("user.username", "ASC")
                .offset(Number(range[0]) || 0)
                .limit(Number(range[1]) || 100)
                .getMany()) ?? [];
    }
    catch (e) {
        console.error(`LazyRequest`, e);
    }
    if (!members) {
        return {
            items: [],
            groups: [],
            range: [],
            members: [],
        };
    }
    const groups = [];
    const items = [];
    const member_roles = members
        .map((m) => m.roles)
        .flat()
        .unique((r) => r.id);
    member_roles.push(member_roles.splice(member_roles.findIndex((x) => x.id === x.guild_id), 1)[0]);
    const offlineItems = [];
    for (const role of member_roles) {
        const [role_members, other_members] = partition(members, (m) => !!m.roles.find((r) => r.id === role.id));
        const group = {
            count: role_members.length,
            id: role.id === guild_id ? "online" : role.id,
        };
        items.push({ group });
        groups.push(group);
        for (const member of role_members) {
            const roles = member.roles
                .filter((x) => x.id !== guild_id)
                .map((x) => x.id);
            const session = getMostRelevantSession(member.user.sessions);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (session?.status == "unknown") {
                session.status = member?.user?.settings?.status || "online";
            }
            const item = {
                member: {
                    ...member,
                    roles,
                    user: member.user.toPublicUser(),
                    presence: {
                        ...session,
                        activities: session?.activities || [],
                        user: { id: member.user.id },
                    },
                },
            };
            if (!session ||
                session.status == "invisible" ||
                session.status == "offline") {
                item.member.presence.status = "offline";
                offlineItems.push(item);
                group.count--;
                continue;
            }
            items.push(item);
        }
        members = other_members;
    }
    if (offlineItems.length) {
        const group = {
            count: offlineItems.length,
            id: "offline",
        };
        items.push({ group });
        groups.push(group);
        items.push(...offlineItems);
    }
    return {
        items,
        groups,
        range,
        members: items
            .map((x) => "member" in x
            ? { ...x.member, settings: undefined }
            : undefined)
            .filter((x) => !!x),
    };
}
async function subscribeToMemberEvents(user_id) {
    if (this.events[user_id])
        return false; // already subscribed as friend
    if (this.member_events[user_id])
        return false; // already subscribed in member list
    this.member_events[user_id] = await (0, util_1.listenEvent)(user_id, gateway_1.handlePresenceUpdate.bind(this), this.listen_options);
    return true;
}
async function onLazyRequest({ d }) {
    // TODO: check data
    instanceOf_1.check.call(this, util_1.LazyRequestSchema, d);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { guild_id, typing, channels, activities, members } = d;
    if (members) {
        // Client has requested a PRESENCE_UPDATE for specific member
        await Promise.all([
            members.map(async (x) => {
                if (!x)
                    return;
                const didSubscribe = await subscribeToMemberEvents.call(this, x);
                if (!didSubscribe)
                    return;
                // if we didn't subscribe just now, this is a new subscription
                // and we should send a PRESENCE_UPDATE immediately
                const sessions = await util_1.Session.find({ where: { user_id: x } });
                const session = getMostRelevantSession(sessions);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                if (session?.status == "unknown")
                    session.status = "online";
                const user = (await util_1.User.getPublicUser(x)).toPublicUser(); // why is this needed?
                return (0, gateway_1.Send)(this, {
                    op: gateway_1.OPCODES.Dispatch,
                    s: this.sequence++,
                    t: "PRESENCE_UPDATE",
                    d: {
                        user: user,
                        activities: session?.activities || [],
                        client_status: session?.client_info,
                        status: session?.status || "offline",
                    },
                });
            }),
        ]);
        if (!channels)
            return;
    }
    if (!channels)
        throw new Error("Must provide channel ranges");
    const channel_id = Object.keys(channels || {}).first();
    if (!channel_id)
        return;
    const permissions = await (0, util_1.getPermission)(this.user_id, guild_id, channel_id);
    permissions.hasThrow("VIEW_CHANNEL");
    const ranges = channels[channel_id];
    if (!Array.isArray(ranges))
        throw new Error("Not a valid Array");
    const member_count = await util_1.Member.count({ where: { guild_id } });
    const ops = await Promise.all(ranges.map((x) => getMembers(guild_id, x)));
    // TODO: unsubscribe member_events that are not in op.members
    ops.forEach((op) => {
        op.members.forEach(async (member) => {
            if (!member?.user.id)
                return;
            return subscribeToMemberEvents.call(this, member.user.id);
        });
    });
    const groups = ops
        .map((x) => x.groups)
        .flat()
        .unique();
    return await (0, gateway_1.Send)(this, {
        op: gateway_1.OPCODES.Dispatch,
        s: this.sequence++,
        t: "GUILD_MEMBER_LIST_UPDATE",
        d: {
            ops: ops.map((x) => ({
                items: x.items,
                op: "SYNC",
                range: x.range,
            })),
            online_count: member_count -
                (groups.find((x) => x.id == "offline")?.count ?? 0),
            member_count,
            id: "everyone",
            guild_id,
            groups,
        },
    });
}
exports.onLazyRequest = onLazyRequest;
/* https://stackoverflow.com/a/50636286 */
function partition(array, filter) {
    const pass = [], fail = [];
    array.forEach((e) => (filter(e) ? pass : fail).push(e));
    return [pass, fail];
}
//# sourceMappingURL=LazyRequest.js.map