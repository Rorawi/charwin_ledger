import { buildProductCaption } from "./calendar";

export async function shareProduct({ item, formatCurrency, imageUrl }) {
  const caption = buildProductCaption(item, formatCurrency);
  const shareData = {
    title: item.name,
    text: caption,
  };

  if (navigator.share) {
    try {
      if (imageUrl && navigator.canShare) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `${item.name.replace(/\s+/g, "-")}.jpg`, {
          type: blob.type || "image/jpeg",
        });
        const withFile = { ...shareData, files: [file] };
        if (navigator.canShare(withFile)) {
          await navigator.share(withFile);
          return { method: "share", success: true };
        }
      }
      await navigator.share(shareData);
      return { method: "share", success: true };
    } catch (err) {
      if (err.name === "AbortError") return { method: "share", success: false, cancelled: true };
    }
  }

  return { method: "fallback", success: false };
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
