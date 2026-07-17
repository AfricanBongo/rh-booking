import { createAvatar } from "@dicebear/core";
import * as thumbs from "@dicebear/thumbs";

export function getAvatarUrl(seed: string): string {
  const avatar = createAvatar(thumbs, {
    seed: seed || "anonymous",
    size: 128,
  });
  return avatar.toDataUri();
}
