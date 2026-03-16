// Plaid Link dynamic loader used by the onboarding page

export async function openPlaidLink(
  linkToken: string,
  onSuccess: (publicToken: string, metadata: unknown) => void,
  onExit?: () => void
) {
  // Dynamically load Plaid Link script
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.onload = () => {
      // @ts-expect-error Plaid global
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: (public_token: string, metadata: unknown) => {
          onSuccess(public_token, metadata);
          resolve();
        },
        onExit: () => {
          onExit?.();
          resolve();
        },
      });
      handler.open();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
