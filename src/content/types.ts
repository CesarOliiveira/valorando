export type RoleId = 'duelist' | 'initiator' | 'controller' | 'sentinel';

export type AbilitySlot = 'C' | 'Q' | 'E' | 'X';

export type AbilityType = 'basic' | 'signature' | 'ultimate';

export interface Agent {
  readonly id: string;
  readonly name: string;
  readonly role: { readonly id: RoleId; readonly name: string };
  readonly country: string | null;
  readonly releaseDate: string | null;
  readonly color: string;
  readonly image: string;
  readonly icon: string;
  readonly hints: readonly string[];
}

export interface Ability {
  readonly id: string;
  readonly agentId: string;
  readonly name: string;
  readonly slot: AbilitySlot;
  readonly type: AbilityType;
  readonly icon: string;
  readonly description: string;
  readonly hints: readonly string[];
}

export interface Weapon {
  readonly id: string;
  readonly name: string;
  readonly category: { readonly id: string; readonly name: string };
  readonly price: number | null;
  readonly image: string;
  readonly ammo: number | null;
  readonly fireMode: string | null;
  readonly fireRate: number | null;
  readonly wallPenetration: string | null;
  readonly usage: string | null;
  readonly aliases: readonly string[];
  readonly hints: readonly string[];
}

export interface Skin {
  readonly id: string;
  readonly name: string;
  readonly weaponId: string;
  readonly collection: { readonly id: string; readonly name: string };
  readonly edition: string;
  readonly image: string;
  readonly variants: readonly string[];
  readonly hasEffects: boolean;
  readonly hints: readonly string[];
}

export interface GameContent {
  readonly agents: readonly Agent[];
  readonly abilities: readonly Ability[];
  readonly weapons: readonly Weapon[];
  readonly skins: readonly Skin[];
}
