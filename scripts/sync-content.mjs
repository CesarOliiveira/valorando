import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const API = 'https://valorant-api.com/v1';
const LANGUAGE = 'pt-BR';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = join(ROOT, 'public');
const DATA_DIR = join(ROOT, 'src', 'data');
const FORCE_DOWNLOAD = process.argv.includes('--force');
const DOWNLOAD_CONCURRENCY = 8;
const UNKNOWN_API_DATE = '1970-01-01';

const ROLE_IDS = { Duelista: 'duelist', Iniciador: 'initiator', Controlador: 'controller', Sentinela: 'sentinel' };
const ABILITY_SLOTS = {
  Grenade: { key: 'C', type: 'basic' },
  Ability1: { key: 'Q', type: 'basic' },
  Ability2: { key: 'E', type: 'signature' },
  Ultimate: { key: 'X', type: 'ultimate' },
};
const WEAPON_CATEGORIES = {
  Sidearm: 'Pistola',
  SMG: 'Submetralhadora',
  Shotgun: 'Escopeta',
  Rifle: 'Fuzil',
  Sniper: 'Rifle de precisão',
  Heavy: 'Metralhadora',
  Melee: 'Corpo a corpo',
};
const WALL_PENETRATION = { Low: 'Baixa', Medium: 'Média', High: 'Alta' };
const SKIN_RULES = { minTierRank: 2, minSkinsPerCollection: 3, excludedCategories: ['Melee'] };

const toSlug = (name) =>
  name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const enumSuffix = (value) => (value ? value.split('::').pop() : null);

async function fetchData(path) {
  const separator = path.includes('?') ? '&' : '?';
  const response = await fetch(`${API}/${path}${separator}language=${LANGUAGE}`);
  if (!response.ok) throw new Error(`Falha ao buscar ${path}: HTTP ${response.status}`);
  return (await response.json()).data;
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadAsWebp({ url, assetPath, resize, quality = 82 }) {
  const outputPath = join(PUBLIC_DIR, assetPath);
  if (!FORCE_DOWNLOAD && (await fileExists(outputPath))) return;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${response.status}`);
  await mkdir(dirname(outputPath), { recursive: true });
  await sharp(Buffer.from(await response.arrayBuffer())).resize(resize).webp({ quality }).toFile(outputPath);
}

async function downloadAll(jobs) {
  for (let index = 0; index < jobs.length; index += DOWNLOAD_CONCURRENCY) {
    await Promise.all(jobs.slice(index, index + DOWNLOAD_CONCURRENCY).map(downloadAsWebp));
  }
}

async function readExtras(fileName) {
  return JSON.parse(await readFile(join(ROOT, 'scripts', fileName), 'utf8'));
}

function releaseDateOf(apiAgent, extra) {
  const apiDate = apiAgent.releaseDate?.slice(0, 10);
  return apiDate && apiDate !== UNKNOWN_API_DATE ? apiDate : (extra.releaseDate ?? null);
}

function buildAgentContent(apiAgents, extras) {
  const agents = [];
  const abilities = [];
  const jobs = [];
  for (const apiAgent of apiAgents) {
    const id = toSlug(apiAgent.displayName);
    const extra = extras[id] ?? {};
    const image = `assets/agents/${apiAgent.uuid}.webp`;
    const icon = `assets/icons/${apiAgent.uuid}.webp`;
    jobs.push(
      { url: apiAgent.fullPortrait, assetPath: image, resize: { height: 900, withoutEnlargement: true } },
      { url: apiAgent.displayIcon, assetPath: icon, resize: { width: 96 } },
    );
    agents.push({
      id,
      name: apiAgent.displayName,
      role: { id: ROLE_IDS[apiAgent.role.displayName], name: apiAgent.role.displayName },
      country: extra.country ?? null,
      releaseDate: releaseDateOf(apiAgent, extra),
      color: `#${apiAgent.backgroundGradientColors[0].slice(0, 6).toLowerCase()}`,
      image,
      icon,
      hints: extra.hints ?? [],
    });
    for (const [slot, meta] of Object.entries(ABILITY_SLOTS)) {
      const ability = apiAgent.abilities.find((item) => item.slot === slot && item.displayIcon);
      if (!ability) continue;
      const abilityIcon = `assets/abilities/${apiAgent.uuid}-${meta.key.toLowerCase()}.webp`;
      jobs.push({ url: ability.displayIcon, assetPath: abilityIcon, resize: { width: 256, withoutEnlargement: true } });
      abilities.push({
        id: `${id}-${meta.key.toLowerCase()}`,
        agentId: id,
        name: ability.displayName.replace(/\s+/g, ' ').trim(),
        slot: meta.key,
        type: meta.type,
        icon: abilityIcon,
        description: ability.description.replace(/\s+/g, ' ').trim(),
        hints: [],
      });
    }
  }
  return { agents, abilities, jobs };
}

function buildWeaponContent(apiWeapons, extras) {
  const jobs = [];
  const weapons = apiWeapons.map((apiWeapon) => {
    const id = toSlug(apiWeapon.displayName);
    const extra = extras[id] ?? {};
    const categoryId = enumSuffix(apiWeapon.category);
    const stats = apiWeapon.weaponStats;
    const image = `assets/weapons/${apiWeapon.uuid}.webp`;
    jobs.push({ url: apiWeapon.displayIcon, assetPath: image, resize: { width: 640, withoutEnlargement: true } });
    return {
      id,
      name: apiWeapon.displayName,
      category: { id: categoryId.toLowerCase(), name: WEAPON_CATEGORIES[categoryId] ?? categoryId },
      price: apiWeapon.shopData?.cost ?? null,
      image,
      ammo: stats?.magazineSize ?? null,
      fireMode: stats ? (enumSuffix(stats.fireMode) === 'SemiAutomatic' ? 'Semiautomático' : 'Automático') : null,
      fireRate: stats?.fireRate ?? null,
      wallPenetration: stats ? (WALL_PENETRATION[enumSuffix(stats.wallPenetration)] ?? null) : null,
      usage: extra.usage ?? null,
      aliases: extra.aliases ?? [],
      hints: extra.hints ?? [],
    };
  });
  return { weapons, jobs };
}

function eligibleSkins(apiWeapons, tiers, themes) {
  const tierByUuid = new Map(tiers.map((tier) => [tier.uuid, tier]));
  const themeByUuid = new Map(themes.map((theme) => [theme.uuid, theme.displayName]));
  const candidates = apiWeapons
    .filter((weapon) => !SKIN_RULES.excludedCategories.includes(enumSuffix(weapon.category)))
    .flatMap((weapon) =>
      weapon.skins.map((skin) => ({
        weapon,
        skin,
        tier: tierByUuid.get(skin.contentTierUuid),
        collection: themeByUuid.get(skin.themeUuid),
        render: skin.displayIcon ?? skin.chromas[0]?.fullRender ?? null,
      })),
    )
    .filter((entry) => entry.tier && entry.tier.rank >= SKIN_RULES.minTierRank && entry.collection && entry.render);
  const perCollection = new Map();
  candidates.forEach((entry) => perCollection.set(entry.collection, (perCollection.get(entry.collection) ?? 0) + 1));
  return candidates.filter((entry) => perCollection.get(entry.collection) >= SKIN_RULES.minSkinsPerCollection);
}

function buildSkinContent(apiWeapons, tiers, themes) {
  const jobs = [];
  const skins = eligibleSkins(apiWeapons, tiers, themes).map(({ weapon, skin, tier, collection, render }) => {
    const image = `assets/skins/${skin.uuid}.webp`;
    jobs.push({ url: render, assetPath: image, resize: { width: 512, withoutEnlargement: true }, quality: 78 });
    return {
      id: toSlug(skin.displayName),
      name: skin.displayName,
      weaponId: toSlug(weapon.displayName),
      collection: { id: toSlug(collection), name: collection },
      edition: tier.displayName,
      image,
      variants: skin.chromas.slice(1).map((chroma) => chroma.displayName.replace(/\s+/g, ' ').trim()),
      hasEffects: skin.levels.some((level) => enumSuffix(level.levelItem) === 'VFX'),
      hints: [],
    };
  });
  return { skins, jobs };
}

async function writeData(fileName, records) {
  const sorted = [...records].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  await writeFile(join(DATA_DIR, fileName), `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`${sorted.length} registros em src/data/${fileName}`);
}

async function main() {
  const [apiAgents, apiWeapons, tiers, themes, agentExtras, weaponExtras] = await Promise.all([
    fetchData('agents?isPlayableCharacter=true'),
    fetchData('weapons'),
    fetchData('contenttiers'),
    fetchData('themes'),
    readExtras('agent-extras.json'),
    readExtras('weapon-extras.json'),
  ]);
  const agentContent = buildAgentContent(apiAgents, agentExtras);
  const weaponContent = buildWeaponContent(apiWeapons, weaponExtras);
  const skinContent = buildSkinContent(apiWeapons, tiers, themes);

  await downloadAll([...agentContent.jobs, ...weaponContent.jobs, ...skinContent.jobs]);
  await mkdir(DATA_DIR, { recursive: true });
  await writeData('agents.json', agentContent.agents);
  await writeData('abilities.json', agentContent.abilities);
  await writeData('weapons.json', weaponContent.weapons);
  await writeData('skins.json', skinContent.skins);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
