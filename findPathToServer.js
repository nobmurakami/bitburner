import { findPathToServer } from "./lib.js";

/** @param {NS} ns */
export async function main(ns) {
  const target = ns.args[0];
  const path = await findPathToServer(ns, target);
  ns.tprint(path);
}

/** @param {AutocompleteData} data */
export function autocomplete(data) {
  return data.servers;
}
