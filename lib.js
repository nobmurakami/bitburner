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
export function getServerList(ns, depth = 10, shouldIncludeNoMoney = true) {
  const allHosts = getAllHosts(ns, depth);
  const purchasedHosts = ns.getPurchasedServers();
  const hosts = allHosts.filter(item => !purchasedHosts.includes(item) && item !== "home");
  const servers = [];

  for (const host of hosts) {
    if (!shouldIncludeNoMoney && ns.getServerMaxMoney(host) < 1) {
      continue;
    }

    const serverMaxMoney = ns.formatNumber(ns.getServerMaxMoney(host));
    const serverMoneyAvailable = ns.formatNumber(ns.getServerMoneyAvailable(host));
    const requiredHackingLevel = ns.getServerRequiredHackingLevel(host);

    const serverInfo = {
      host: host,
      requiredHackingLevel: requiredHackingLevel,
      moneyAvailable: serverMoneyAvailable,
      maxMoney: serverMaxMoney,
    }

    servers.push(serverInfo);
  };

  servers.sort((a, b) => a.requiredHackingLevel - b.requiredHackingLevel);

  return servers;
}
