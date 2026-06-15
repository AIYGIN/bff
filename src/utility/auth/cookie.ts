export const readCookie = (
  cookieHeader: string | undefined,
  name: string,
): string | undefined => {
  if (cookieHeader === undefined) {
    return undefined;
  }
  for (const pair of cookieHeader.split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0 || pair.slice(0, separator).trim() !== name) {
      continue;
    }
    const value = pair.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
  }

  return undefined;
};
