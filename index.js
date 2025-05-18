const Parser = require('rss-parser');
const fs = require('fs');
const parser = new Parser();

const feeds = [
  {
    name: 'Organic Letters',
    url: 'https://pubs.acs.org/action/showFeed?journalCode=orlef7&type=etoc&feed=rss'
  },
  {
    name: 'Journal of Organic Chemistry',
    url: 'https://pubs.acs.org/action/showFeed?journalCode=joceah&type=etoc&feed=rss'
  },
  {
    name: 'Dalton Transactions',
    url: 'https://pubs.rsc.org/en/journals/journalissues/dt#!recentarticles&rss=1'
  },
  {
    name: 'Chemistry – A European Journal',
    url: 'https://chemistry-europe.onlinelibrary.wiley.com/feed/15213765/most-recent'
  }
];

(async () => {
  let allPapers = [];

  for (const feed of feeds) {
    try {
      const rss = await parser.parseURL(feed.url);
      const papers = rss.items.map(item => ({
        journal: feed.name,
        title: item.title,
        authors: item.creator || 'N/A',
        doi: item.link?.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i)?.[0] || 'N/A',
        link: item.link,
        abstract: item.contentSnippet || 'No abstract available'
      }));
      allPapers.push(...papers);
    } catch (err) {
      console.error(`Failed to parse ${feed.name}:`, err.message);
    }
  }

  fs.writeFileSync('papers.json', JSON.stringify(allPapers, null, 2));
  console.log('✅ Aggregated papers saved to papers.json');
})();
