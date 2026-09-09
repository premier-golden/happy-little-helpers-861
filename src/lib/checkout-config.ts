// ID do produto padrão. Pode ser sobrescrito por ?productId=... na URL.
export const DEFAULT_PRODUCT_ID = "01KZ7W13DD2MVBGG66NPG9EA9T";

// Produto da oferta de back-redirect.
export const BACK_REDIRECT_PRODUCT_ID = "43ca5d35-3492-4567-913d-dc2843ba6931";

// Produto do upsell /up1 (página "El pago no se ha completado").
export const UP1_PRODUCT_ID = "65009b71-7660-44ef-ba87-24f29c7599a4";

export function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase(),
  }).format(cents / 100);
}
