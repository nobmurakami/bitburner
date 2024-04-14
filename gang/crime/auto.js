const CrimeAugs = ["Bionic Spine", "Bionic Arms", "Bionic Legs", "Graphene Bone Lacings", "Synthetic Heart", "BrachiBlades", "Nanofiber Weave", "Synfibril Muscle"];
const Wepons = ["Baseball Bat", "Katana", "Glock 18C", "P90C", "Steyr AUG", "AK-47", "M15A10 Assault Rifle", "AWM Sniper Rifle"];
const Armor = ["Liquid Body Armor", "Bulletproof Vest", "Full Body Armor", "Graphene Plating Armor"];
const Vehicles = ["Ford Flex V20", "White Ferrari", "ATX1070 Superbike", "Mercedes-Benz S9001"];
const MoneyTasks = ["Human Trafficking", "Traffick Illegal Arms", "Armed Robbery", "Threaten & Blackmail", "Run a Con", "Deal Drugs", "Strongarm Civilians", "Mug People"];
const RespectTasks = ["Terrorism", "Human Trafficking", "Threaten & Blackmail", "Traffick Illegal Arms", "Armed Robbery", "Run a Con", "Deal Drugs", "Mug People", "Strongarm Civilians"];
const MemberNames = ["Viper", "Cobra", "Python", "Boa", "Rattler", "Mamba", "Anaconda", "Sidewinder", "Asp", "Cottonmouth", "Taipan", "Coral"];

class Enemy {
  constructor(name, power, territory, chanceToWinClash) {
    this.name = name;
    this.power = power;
    this.territory = territory;
    this.chanceToWinClash = chanceToWinClash;
  }
}

/** @param {NS} ns */
export async function main(ns) {
  while (true) {
    const members = ns.gang.getMemberNames();

    for (const member of members) {
      // Ascend
      if (shouldAscend(ns, member)) {
        ascend(ns, member);
      }

      // Purchase Equipments
      purchaseAugmentations(ns, member, CrimeAugs);

      if (isAugsCompleted(ns, member)) {
        purchaseUpgrades(ns, member, [...Wepons, ...Armor, ...Vehicles]);
      }

      // Assign Task
      assign(ns, member);
    }

    // Recruit
    if (ns.gang.canRecruitMember()) {
      recruit(ns);
    }

    if (isReadyForTerritoryClashes(ns)) {
      ns.gang.setTerritoryWarfare(true);
    }

    await ns.sleep(1000);
  }
}

/**
 * @param {NS} ns
 * @param {string} memberName
 */
function shouldAscend(ns, memberName) {
  const ascMultKeys = {
    str: "str_asc_mult",
    def: "def_asc_mult",
    dex: "dex_asc_mult",
    agi: "agi_asc_mult",
  };
  const memberInfo = ns.gang.getMemberInformation(memberName);
  const ascensionResult = ns.gang.getAscensionResult(memberName);

  if (ascensionResult === undefined) {
    return false;
  }

  // 現在のmultの平均値で、しきい値を算出する
  let sumMult = 0;
  for (const skill in ascMultKeys) {
    const key = ascMultKeys[skill];
    sumMult += memberInfo[key];
  }
  const avarageMult = sumMult / Object.keys(ascMultKeys).length;
  const ascThreshold = calculateAscendTreshold(avarageMult);

  // ascentionResultの平均値を求める
  let sumAscResult = 0;
  for (const skill in ascMultKeys) {
    sumAscResult += ascensionResult[skill];
  }
  const avarageAscResult = sumAscResult / Object.keys(ascMultKeys).length;

  // ascentionResultの平均値がしきい値を超えていたらAscend
  return avarageAscResult >= ascThreshold;
}

function calculateAscendTreshold(currentMult) {
  const nextMult = currentMult + 1;
  return nextMult / currentMult;
}

/**
 * @param {NS} ns
 * @param {string} memberName
 */
function ascend(ns, memberName) {
  ns.gang.ascendMember(memberName);
  ns.gang.setMemberTask(memberName, "Train Combat");
}

/**
 * @param {NS} ns
 * @param {string} memberName
 * @param {string[]} purchaseUpgrades
 */
function purchaseUpgrades(ns, memberName, purchaseUpgrades) {
  for (const upgrade of purchaseUpgrades) {
    const memberUpgrages = ns.gang.getMemberInformation(memberName).upgrades;

    if (memberUpgrages.includes(upgrade)) {
      continue;
    }

    if (ns.gang.getEquipmentCost(upgrade) <= ns.getPlayer().money) {
      ns.gang.purchaseEquipment(memberName, upgrade);
    }
  }
}

/**
 * @param {NS} ns
 * @param {string} memberName
 * @param {string[]} purchaseAugmentations
 */
function purchaseAugmentations(ns, memberName, purchaseAugmentations) {
  for (const augmentation of purchaseAugmentations) {
    const memberAugmentations = ns.gang.getMemberInformation(memberName).augmentations;

    if (memberAugmentations.includes(augmentation)) {
      continue;
    }

    if (ns.gang.getEquipmentCost(augmentation) <= ns.getPlayer().money) {
      ns.gang.purchaseEquipment(memberName, augmentation);
    }
  }
}

/**
 * @param {NS} ns
 * @param {string} memberName
 */
function assign(ns, memberName) {
  const memberInfo = ns.gang.getMemberInformation(memberName);

  const skillAverage = (memberInfo.str + memberInfo.def + memberInfo.dex + memberInfo.agi) / 4;
  if (skillAverage < 400) {
    return ns.gang.setMemberTask(memberName, "Train Combat");
  }

  const wantedLevel = ns.gang.getGangInformation().wantedLevel;
  const wantedLevelPenalty = ns.gang.getGangInformation().wantedPenalty - 1;
  if (wantedLevel > 1 && wantedLevelPenalty <= -0.001) {
    return ns.gang.setMemberTask(memberName, "Vigilante Justice");
  }

  if (ns.gang.getMemberNames().length < 12 || memberInfo.earnedRespect < 10000) {
    for (const task of RespectTasks) {
      ns.gang.setMemberTask(memberName, task);

      if (ns.gang.getMemberInformation(memberName).respectGain > 0) {
        return true;
      }
    }
  }

  if (isAugsCompleted(ns, memberName) && ! isReadyForTerritoryClashes(ns)) {
    return ns.gang.setMemberTask(memberName, "Territory Warfare");
  }

  for (const task of MoneyTasks) {
    ns.gang.setMemberTask(memberName, task);

    if (ns.gang.getMemberInformation(memberName).moneyGain > 0) {
      return true;
    }
  }
}

/** @param {NS} ns */
function recruit(ns) {
  const currentMembers = ns.gang.getMemberNames();
  const availableNames = MemberNames.filter(name => !currentMembers.includes(name));

  ns.gang.recruitMember(availableNames[0]);
  ns.gang.setMemberTask(availableNames[0], "Train Combat");
}

/**
 * @param {NS} ns
 * @return {Enemy[]}
 */
function getEnemies(ns) {
  const enemies = [];
  const otherGangInfo = ns.gang.getOtherGangInformation();

  for (const gang in otherGangInfo) {
    if (gang === ns.gang.getGangInformation().faction || otherGangInfo[gang].territory === 0) {
      continue;
    }

    const enemy = new Enemy(
      gang,
      otherGangInfo[gang].power,
      otherGangInfo[gang].territory,
      ns.gang.getChanceToWinClash(gang),
    );

    enemies.push(enemy);
  }

  return enemies;
}

/** @param {NS} ns */
function isReadyForTerritoryClashes(ns) {
  let isReadyForTerritoryClashes = true;
  const enemies = getEnemies(ns);

  for (const enemy of enemies) {
    if (enemy.chanceToWinClash < 0.55) {
      isReadyForTerritoryClashes = false;
    }
  }

  return isReadyForTerritoryClashes;
}

/**
 * @param {NS} ns
 * @param {string} memberName
 */
function isAugsCompleted(ns, memberName) {
  const memberInfo = ns.gang.getMemberInformation(memberName);

  return CrimeAugs.filter((aug) => ! memberInfo.augmentations.includes(aug)).length === 0;
}
