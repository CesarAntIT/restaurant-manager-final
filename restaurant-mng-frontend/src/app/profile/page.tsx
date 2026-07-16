"use client";

import { useEffect } from "react";
import { LoadingScreen, useProfileSession } from "./_shared";

export default function ProfilePage() {
  const { router, sessionLoaded, isAuthenticated, user, userView } = useProfileSession();

  useEffect(() => {
    if (!sessionLoaded || !isAuthenticated || !user) return;
    router.replace(userView.isOwner ? "/profile/owner" : "/profile/user");
  }, [isAuthenticated, router, sessionLoaded, user, userView.isOwner]);

  return <LoadingScreen />;
}
