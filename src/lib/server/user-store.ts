import 'server-only';
import {
  MOCK_ELDER_PROFILES,
  MOCK_FAMILY_PROFILES,
  MOCK_USER_ACCOUNT,
} from '@/lib/mock-data';
import type { UserAccount, UserProfile } from '@/lib/types';

export interface StoredUser {
  account: UserAccount;
  profile: UserProfile;
}

const globalUserStore = globalThis as typeof globalThis & {
  yinlingUsers?: Map<string, StoredUser>;
};

function createInitialStore() {
  const profiles = [...MOCK_ELDER_PROFILES, ...MOCK_FAMILY_PROFILES];
  return new Map<string, StoredUser>(profiles.map((profile, index) => [
    profile.user_id,
    {
      account: profile.user_id === MOCK_USER_ACCOUNT.user_id
        ? { ...MOCK_USER_ACCOUNT }
        : {
            ...MOCK_USER_ACCOUNT,
            user_id: profile.user_id,
            username: profile.display_name || `家庭成员${index + 1}`,
            phone: `139****${String(index + 1).padStart(4, '0')}`,
          },
      profile: { ...profile },
    },
  ]));
}

export const userStore = globalUserStore.yinlingUsers ?? createInitialStore();

globalUserStore.yinlingUsers = userStore;
