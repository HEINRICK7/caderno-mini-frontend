"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { PlatformAccessSummary } from "@/lib/api-contracts";

type WorkspaceState = {
  status: "loading" | "guest" | "authenticated";
  email: string | null;
  access: PlatformAccessSummary | null;
};

export function useCustomerWorkspace(): WorkspaceState {
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    status: "loading",
    email: null,
    access: null,
  });

  useEffect(() => {
    let active = true;
    void api.getCustomerPortal().then((portal) => {
      if (!active) return;
      setWorkspace({
        status: "authenticated",
        email: portal.user.email,
        access: portal.platformAccess,
      });
    }).catch(() => {
      if (!active) return;
      setWorkspace({ status: "guest", email: null, access: null });
    });
    return () => { active = false; };
  }, []);

  return workspace;
}
