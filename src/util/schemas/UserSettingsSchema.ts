

import { UserSettings } from "@fosscord/util";

export type UserSettingsSchema = Omit<Partial<UserSettings>, "index">;
