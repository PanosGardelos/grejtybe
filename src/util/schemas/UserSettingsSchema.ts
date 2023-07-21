

import { UserSettings } from "@greektube/util";

export type UserSettingsSchema = Omit<Partial<UserSettings>, "index">;
