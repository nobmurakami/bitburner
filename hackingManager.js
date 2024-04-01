import { getRootAccess, getServerList } from './lib.js';

const moneyRate = 0.9;
const portPrograms = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];

/** @param {NS} ns */
export async function main(ns) {
  const target = ns.args[0];

  const moneyThresh = ns.getServerMaxMoney(target);
  const securityThresh = ns.getServerMinSecurityLevel(target);
  const securityDecreasePerThread = ns.weakenAnalyze(1);
  const servers = getServerList(ns, 25, true, true).filter(server => server.maxRam > 0);

  while (true) {
    let script;
    let requiredThreads;

    const securityLevel = ns.getServerSecurityLevel(target);
    if (securityLevel > securityThresh) {
      script = "weaken.js";
      const requiredDecrease = securityLevel - securityThresh;
      requiredThreads = Math.ceil(requiredDecrease / securityDecreasePerThread);

      log(ns, script, requiredThreads);

      await action(ns, script, servers, requiredThreads, ns.getWeakenTime(target), target);
      continue;
    }

    const moneyAvailable = ns.getServerMoneyAvailable(target);
    if (moneyAvailable < moneyThresh) {
      script = "grow.js";
      const requiredMultiplier = moneyAvailable > 0 ? Math.ceil(moneyThresh / moneyAvailable) : moneyThresh;
      requiredThreads = Math.ceil(ns.growthAnalyze(target, requiredMultiplier));

      log(ns, script, requiredThreads);

      await action(ns, script, servers, requiredThreads, ns.getGrowTime(target), target);
      continue;
    }

    script = "hack.js";
    const hackAmount = Math.floor(moneyThresh * moneyRate);
    requiredThreads = Math.ceil(ns.hackAnalyzeThreads(target, hackAmount));

    log(ns, script, requiredThreads);

    await action(ns, script, servers, requiredThreads, ns.getHackTime(target), target);
  }
}

/**
 * @param {NS} ns
 * @param {string} script
 * @param {array} servers
 * @param {number} requiredThreads
 * @param {number} sleepTime
 * @param {string} target
 */
async function action(ns, script, servers, requiredThreads, sleepTime, target) {
  const scriptRam = ns.getScriptRam(script);
  const numPortPrograms = ns.ls("home").filter(file => portPrograms.includes(file)).length;
  let reservedThreads = 0;

  for (const server of servers) {
    const host = server.host;

    if (reservedThreads >= requiredThreads) {
      break;
    }

    if (host === "home") {
      continue;
    }

    if (!ns.hasRootAccess(host)) {
      if (server.numPorts > numPortPrograms) {
        continue;
      }

      getRootAccess(ns, host);
    }

    if (!ns.hasRootAccess(host)) {
      continue;
    }

    const availableRam = server.maxRam - ns.getServerUsedRam(host);

    ns.print(`${host}: ${ns.formatRam(availableRam)}`);

    if (availableRam < scriptRam) {
      continue;
    }

    const threads = Math.min(Math.floor(availableRam / scriptRam), requiredThreads - reservedThreads);
    if (threads < 1) {
      continue;
    }

    if (!ns.fileExists(script, host)) {
      ns.scp(script, host, "home");
    }

    ns.exec(script, host, threads, target);
    reservedThreads += threads;

    ns.print(`${threads} threads have been reserved in ${host}. ${requiredThreads - reservedThreads} threads remaining.`)
  }

  if (reservedThreads < requiredThreads) {
    const availableRam = ns.getServerMaxRam("home") - ns.getServerUsedRam("home") - 32;
    const threads = Math.min(Math.floor(availableRam / scriptRam), requiredThreads - reservedThreads);

    if (threads >= 1) {
      ns.exec(script, "home", threads, target);
      reservedThreads += threads;
    }
  }

  await ns.sleep(1000 + (requiredThreads ? sleepTime : 0));
}

/**
 * @param {NS} ns
 * @param {string} script
 * @param {number} requiredThreads
 */
function log(ns, script, requiredThreads) {
  ns.print(JSON.stringify({ script: script, requiredThreads: requiredThreads }, null, 2));
}
