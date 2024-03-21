import { getAllHosts } from './lib.js';

/** @param {NS} ns */
export async function main(ns) {
  const target = ns.args[0];
  const moneyRate = ns.args[1] ?? 0.5;

  const moneyThresh = ns.getServerMaxMoney(target);
  const securityThresh = ns.getServerMinSecurityLevel(target);
  const securityDecreasePerThread = ns.weakenAnalyze(1);
  const requiredRam = 1.75;
  const hosts = getAllHosts(ns);

  async function action(script, requiredThreads, sleepTime) {
    if (requiredThreads <= 0) {
      return;
    }

    ns.print(`${script}: requiredThreads: ${requiredThreads}`);

    for (const host of hosts) {
      if (requiredThreads <= 0) {
        break;
      }

      const maxRam = ns.getServerMaxRam(host);
      if (maxRam < requiredRam) {
        continue;
      }

      const availableRam = maxRam - ns.getServerUsedRam(host) - (host === "home" ? 16 : 0);
      if (availableRam < requiredRam) {
        continue;
      }

      const threads = Math.min(Math.floor(availableRam / requiredRam), requiredThreads);
      if (threads < 1) {
        continue;
      }

      ns.scp(script, host, "home");
      ns.exec(script, host, threads, target);
      requiredThreads -= threads;
    }

    await ns.sleep(sleepTime + 1000);
  }

  while (true) {
    const securityLevel = ns.getServerSecurityLevel(target);
    const moneyAvailable = ns.getServerMoneyAvailable(target);
    let requiredThreads;

    if (securityLevel > securityThresh) {
      ns.print(`security Level: ${securityLevel}(min: ${securityThresh})`);

      const requiredDecrease = securityLevel - securityThresh;
      ns.print(`required security decrease: ${requiredDecrease}`);

      requiredThreads = Math.ceil(requiredDecrease / securityDecreasePerThread);
      ns.print(`required threads: ${requiredThreads}`);

      await action("weaken.js", requiredThreads, ns.getWeakenTime(target));
      continue;
    }

    if (moneyAvailable < moneyThresh) {
      ns.print('Money: $' + ns.formatNumber(moneyAvailable) + '/' + ns.formatNumber(moneyThresh));

      const requiredMultiplier = moneyAvailable > 0 ? Math.ceil(moneyThresh / moneyAvailable) : moneyThresh;
      requiredThreads = Math.ceil(ns.growthAnalyze(target, requiredMultiplier));

      await action("grow.js", requiredThreads, ns.getGrowTime(target));
      continue;
    }

    const hackAmount = Math.floor(moneyThresh * moneyRate);
    requiredThreads = Math.ceil(ns.hackAnalyzeThreads(target, hackAmount));

    ns.print("hackAmount: $" + ns.formatNumber(hackAmount) + ", requiredThreads: " + requiredThreads);

    await action("hack.js", requiredThreads, ns.getHackTime(target));
  }
}
