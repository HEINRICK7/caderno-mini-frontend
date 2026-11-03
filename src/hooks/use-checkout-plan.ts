"use client";

import { useSyncExternalStore } from "react";
import { parseCheckoutPlan } from "../domain/checkout-plan";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

function getPlanFromLocation() {
  return new URLSearchParams(window.location.search).get("plan");
}

function getServerPlan() {
  return null;
}

export function useCheckoutPlan() {
  return parseCheckoutPlan(useSyncExternalStore(subscribe, getPlanFromLocation, getServerPlan));
}
