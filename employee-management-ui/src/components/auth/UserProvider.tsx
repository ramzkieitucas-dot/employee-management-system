"use client";

import { createContext, useContext } from "react";
import { CurrentUser } from "@/types/user";

const UserContext = createContext<CurrentUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const user = useContext(UserContext);
  if (!user) throw new Error("useUser must be used inside UserProvider");
  return user;
}
