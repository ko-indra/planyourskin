"use client";
import { useEffect } from "react";
import { useAccount } from "@/lib/account-store";
import { useWishlist } from "@/lib/wishlist-store";

export default function WishlistHydrator() {
  const accessToken = useAccount((s) => s.accessToken);
  const expiresAt = useAccount((s) => s.expiresAt);
  const hydrate = useWishlist((s) => s.hydrate);
  const clear = useWishlist((s) => s.clear);

  useEffect(() => {
    const loggedIn = !!accessToken && !!expiresAt && new Date(expiresAt).getTime() > Date.now();
    if (loggedIn && accessToken) {
      hydrate(accessToken);
    } else {
      clear();
    }
  }, [accessToken, expiresAt, hydrate, clear]);

  return null;
}
