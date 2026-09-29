import abilities from '../data/abilities.json';
import agents from '../data/agents.json';
import skins from '../data/skins.json';
import weapons from '../data/weapons.json';
import type { GameContent } from './types';

export function loadGameContent(): GameContent {
  const content = { agents, abilities, weapons, skins } as unknown as GameContent;
  assertUniqueIds(content);
  assertReferences(content);
  return content;
}

function assertUniqueIds(content: GameContent): void {
  for (const [label, records] of Object.entries(content) as [string, readonly { id: string }[]][]) {
    const ids = new Set<string>();
    for (const record of records) {
      if (ids.has(record.id)) throw new Error(`Registro duplicado em ${label}: ${record.id}`);
      ids.add(record.id);
    }
  }
}

function assertReferences(content: GameContent): void {
  const agentIds = new Set(content.agents.map((agent) => agent.id));
  const weaponIds = new Set(content.weapons.map((weapon) => weapon.id));
  const orphanAbility = content.abilities.find((ability) => !agentIds.has(ability.agentId));
  if (orphanAbility) throw new Error(`Habilidade sem agente: ${orphanAbility.id}`);
  const orphanSkin = content.skins.find((skin) => !weaponIds.has(skin.weaponId));
  if (orphanSkin) throw new Error(`Skin sem arma: ${orphanSkin.id}`);
}
