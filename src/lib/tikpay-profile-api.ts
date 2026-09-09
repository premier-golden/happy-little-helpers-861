import { getTikPayAuthConfig } from "@/lib/tikpay-auth-config.functions";
import { getTikPaySession, tikPayAuthenticatedFetch } from "@/lib/tikpay-auth";

const AVATAR_BUCKET = "tikpay-avatars";

function extensionFor(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadTikPayAvatar(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Usa una imagen JPG, PNG o WEBP.");
  }

  if (file.size > 3 * 1024 * 1024) {
    throw new Error("La imagen debe pesar menos de 3 MB.");
  }

  const session = await getTikPaySession();
  if (!session) throw new Error("not_authenticated");

  const { url, publishableKey } = await getTikPayAuthConfig();
  const ext = extensionFor(file);
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now());
  const objectPath = `${session.user.id}/avatar-${id}.${ext}`;

  const upload = await fetch(
    `${url}/storage/v1/object/${AVATAR_BUCKET}/${objectPath}`,
    {
      method: "POST",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": file.type,
        "Cache-Control": "3600",
      },
      body: file,
    },
  );

  if (!upload.ok) {
    const message = await upload.text();
    throw new Error(message || "No se pudo subir la foto.");
  }

  const avatarUrl = `${url}/storage/v1/object/public/${AVATAR_BUCKET}/${objectPath}`;

  const save = await tikPayAuthenticatedFetch("rpc/update_tikpay_profile_avatar", {
    method: "POST",
    body: JSON.stringify({ p_avatar_url: avatarUrl }),
  });

  if (!save.ok) {
    const raw = await save.text();
    throw new Error(raw || "No se pudo guardar la foto.");
  }

  window.dispatchEvent(new Event("tikpay:member-state-update"));
  return avatarUrl;
}
