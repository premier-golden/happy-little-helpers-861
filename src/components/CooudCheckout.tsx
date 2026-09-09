export interface CooudCheckoutProps {
  productId: string;
  className?: string;
  showSummary?: boolean;
  returnPath?: string;
}

// Keep existing page imports compatible while payment processing is removed.
export function CooudCheckout({ className }: CooudCheckoutProps) {
  return (
    <div className={className}>
      <p className="mb-4 text-sm text-neutral-600">Demo only — payments disabled.</p>
      <a
        href="https://www.google.com"
        className="inline-flex rounded-lg bg-black px-6 py-3 font-semibold text-white"
      >
        Open Google
      </a>
    </div>
  );
}
