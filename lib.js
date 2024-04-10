/** @param {NS} ns */
export function getAllHosts(ns, depth = 10) {
  let list = ["home"];

  // サーバーを再帰的に検索する関数
  function scanServer(hostname, depth) {
    if (depth <= 0) {
      return;
    }

    ns.scan(hostname).forEach((nextHostname) => {
      if (!list.includes(nextHostname)) {
        list.push(nextHostname);
        scanServer(nextHostname, depth - 1);
      }
    });
  }

  scanServer("home", depth);

  return list;
}

/** 
 * @param {NS} ns
 * @param {string} host
 */
export function getRootAccess(ns, host) {
    if (ns.fileExists("BruteSSH.exe", "home")) {
      ns.brutessh(host);
    }

    if (ns.fileExists("FTPCrack.exe", "home")) {
      ns.ftpcrack(host);
    }

    if (ns.fileExists("relaySMTP.exe", "home")) {
      ns.relaysmtp(host);
    }

    if (ns.fileExists("HTTPWorm.exe", "home")) {
      ns.httpworm(host);
    }

    if (ns.fileExists("SQLInject.exe", "home")) {
      ns.sqlinject(host);
    }

    try {
      ns.nuke(host);
    } catch (err) {
    }
}

/** @param {NS} ns */
export function getServerList(ns, depth = 25, shouldIncludeNoMoney = true, shouldIncludePurchased = false) {
  const allHosts = getAllHosts(ns, depth);

  let hosts = allHosts.filter(host => host !== "home");
  if (! shouldIncludePurchased) {
    const purchasedHosts = ns.getPurchasedServers();
    hosts = hosts.filter(host => ! purchasedHosts.includes(host));
  }

  const servers = [];
  for (const host of hosts) {
    if (!shouldIncludeNoMoney && ns.getServerMaxMoney(host) < 1) {
      continue;
    }

    const serverInfo = {
      host: host,
      requiredHackingLevel: ns.getServerRequiredHackingLevel(host),
      moneyAvailable: ns.formatNumber(ns.getServerMoneyAvailable(host)),
      maxMoney: ns.formatNumber(ns.getServerMaxMoney(host)),
      maxRam: ns.getServerMaxRam(host),
      numPorts: ns.getServerNumPortsRequired(host),
    }

    servers.push(serverInfo);
  };

  servers.sort((a, b) => a.requiredHackingLevel - b.requiredHackingLevel);

  return servers;
}

/** @param {NS} ns */
export async function findPathToServer(ns, target, depth = 20) {
  // 初期パンくずリスト
  let breadcrumbs = [];

  // サーバーを再帰的に検索し、パンくずリストを更新する関数
  function scanServer(hostname, path, depth) {
    if (hostname === target) {
      breadcrumbs = path;
      return true;
    }
    if (depth <= 0) {
      return false;
    }

    for (const nextHostname of ns.scan(hostname)) {
      if (!path.includes(nextHostname)) {
        const found = scanServer(nextHostname, [...path, nextHostname], depth - 1);
        if (found) return true;
      }
    }

    return false;
  }

  scanServer("home", ["home"], depth);

  return breadcrumbs;
}
