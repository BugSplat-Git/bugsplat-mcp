import { XMLParser } from 'fast-xml-parser';

export async function getDocsUrls(): Promise<string[]> {
  const response = await fetch('https://docs.bugsplat.com/sitemap-pages.xml');

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
  }

  const xmlContent = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text'
  });

  const parsedXml = parser.parse(xmlContent);

  if (!parsedXml.urlset?.url) {
    return [];
  }

  const urlEntries = Array.isArray(parsedXml.urlset.url)
    ? parsedXml.urlset.url
    : [parsedXml.urlset.url];

  const urls: string[] = [];

  for (const urlEntry of urlEntries) {
    if (!urlEntry.loc || typeof urlEntry.loc !== 'string') {
      continue;
    }

    const url = urlEntry.loc.endsWith('/') ? urlEntry.loc.slice(0, -1) : urlEntry.loc;

    if (url === 'https://docs.bugsplat.com') {
      continue;
    }

    urls.push(url + '.md');
  }

  return urls;
}
