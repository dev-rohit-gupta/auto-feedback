/** All live WebView interactions must be restricted to the real ERP origin. */
export const ERP_URL = "https://erp.mitra.ac.in";

export function isErpUrl(url: string): boolean {
  return /^https:\/\/erp\.mitra\.ac\.in(?:[/?#]|$)/i.test(url);
}
