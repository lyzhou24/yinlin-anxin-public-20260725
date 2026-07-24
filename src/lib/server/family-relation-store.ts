import 'server-only';
import { MOCK_FAMILY_RELATIONS } from '@/lib/mock-data';
import type { FamilyRelation } from '@/lib/types';

const globalFamilyStore = globalThis as typeof globalThis & {
  yinlingFamilyRelations?: Map<string, FamilyRelation>;
  yinlingFamilyRelationsVersion?: number;
};

const MOCK_FAMILY_RELATIONS_VERSION = 2;

function createInitialStore() {
  return new Map<string, FamilyRelation>(MOCK_FAMILY_RELATIONS.map((relation) => [
    relation.relation_id,
    {
      ...relation,
      permissions: { ...relation.permissions },
    },
  ]));
}

export const familyRelationStore =
  globalFamilyStore.yinlingFamilyRelationsVersion === MOCK_FAMILY_RELATIONS_VERSION
    ? globalFamilyStore.yinlingFamilyRelations ?? createInitialStore()
    : createInitialStore();

globalFamilyStore.yinlingFamilyRelations = familyRelationStore;
globalFamilyStore.yinlingFamilyRelationsVersion = MOCK_FAMILY_RELATIONS_VERSION;
