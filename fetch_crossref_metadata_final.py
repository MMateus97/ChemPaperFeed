
import requests
import json
import re
from html import unescape
from datetime import datetime, timedelta
import os

JOURNALS = {
    "Nature Chemistry": ("1755-4330", "General"),
    "Chemical Reviews": ("0009-2665", "General"),
    "Accounts of Chemical Research": ("0001-4842", "General"),
    "Nature Catalysis": ("2520-1158", "General"),
    "Chem": ("2451-9294", "General"),
    "Chemical Science": ("2041-6520", "General"),
    "Angewandte Chemie International Edition": ("1521-3773", "General"),
    "Journal of the American Chemical Society": ("0002-7863", "General"),
    "Chemical Communications": ("1359-7345", "General"),
    "Chemistry – A European Journal": ("0947-6539", "General"),
    "Organic Letters": ("1523-7060", "Organic"),
    "The Journal of Organic Chemistry": ("0022-3263", "Organic"),
    "Synthesis": ("0039-7881", "Organic"),
    "Synlett": ("0936-5214", "Organic"),
    "Beilstein Journal of Organic Chemistry": ("1860-5397", "Organic"),
    "European Journal of Organic Chemistry": ("1434-193X", "Organic"),
    "Tetrahedron": ("0040-4020", "Organic"),
    "Tetrahedron Letters": ("0040-4039", "Organic"),
    "Organic & Biomolecular Chemistry": ("1477-0520", "Organic"),
    "Advanced Synthesis & Catalysis": ("1615-4150", "Organic"),
    "Organometallics": ("0276-7333", "Catalysis"),
    "Dalton Transactions": ("1477-9226", "Catalysis"),
    "Catalysis Science & Technology": ("2044-4753", "Catalysis"),
    "ACS Catalysis": ("2155-5435", "Catalysis"),
    "Journal of Catalysis": ("0021-9517", "Catalysis"),
    "Bioorganic & Medicinal Chemistry": ("0968-0896", "Medicinal"),
    "Bioorganic & Medicinal Chemistry Letters": ("0960-894X", "Medicinal"),
    "MedChemComm": ("2040-2503", "Medicinal"),
    "European Journal of Medicinal Chemistry": ("0223-5234", "Medicinal"),
    "Journal of Medicinal Chemistry": ("0022-2623", "Medicinal"),
    "Advanced Materials": ("0935-9648", "Materials"),
    "ACS Materials Letters": ("2639-4979", "Materials"),
    "Chemistry of Materials": ("0897-4756", "Materials"),
    "Advanced Functional Materials": ("1616-301X", "Materials"),
    "Materials Horizons": ("2051-6347", "Materials"),
    "Green Chemistry": ("1463-9262", "Green"),
    "Sustainable Chemistry & Engineering": ("2168-0485", "Green"),
    "ACS Sustainable Chemistry & Engineering": ("2168-0485", "Green"),
    "ChemSusChem": ("1864-5631", "Green"),
    "Journal of Cleaner Production": ("0959-6526", "Green"),
    "New Journal of Chemistry": ("1144-0546", "Specialized"),
    "Crystal Growth & Design": ("1528-7483", "Specialized"),
    "Molecules": ("1420-3049", "Specialized"),
    "RSC Advances": ("2046-2069", "Specialized"),
    "Frontiers in Chemistry": ("2296-2646", "Specialized"),
    "Chemical Society Reviews": ("0306-0012", "Review"),
    "Chemistry – An Asian Journal": ("1861-4728", "Review"),
    "Nature Reviews Chemistry": ("2397-3358", "Review"),
    "Trends in Chemistry": ("2589-5974", "Review"),
    "Comprehensive Reviews in Analytical Chemistry": ("0734-2608", "Review"),
    "Science": ("0036-8075", "General"),
    "Nature": ("0028-0836", "General"),
    "Nature Communications": ("2041-1723", "Interdisciplinary"),
    "Science Advances": ("2375-2548", "General"),
    "Nature Synthesis": ("2731-0582", "Organic/Synthetic"),
    "ACS Photonics": ("2330-4022", "Photochemistry"),
    "ACS Omega": ("2470-1343", "General"),
    "Chemistry–Select": ("2365-6549", "General"),
    "chempluschem": ("2192-6506", "General"),
    "ChemistryOpen": ("2191-1363", "General"),
    "ChemElectroChem": ("2196-0216", "Electrochemistry"),
    "ChemPhotoChem": ("2367-0932", "Photochemistry"),
    "ChemCatChem": ("1867-3880", "Catalysis"),
    "Coordination Chemistry Reviews": ("0010-8545", "Inorganic"),
    "Inorganic Chemistry Frontiers": ("2052-1553", "Inorganic"),
    "Reaction Chemistry & Engineering": ("2058-9883", "Engineering"),
    "Communications Chemistry": ("2399-3669", "General"),
    "ACS Organic & Inorganic Au": ("2694-2445", "General"),
    "Inorganic Chemistry": ("0020-1669", "Inorganic"),
    "Journal of Natural Products": ("0163-3864", "Natural Products"),
    "Organic Process Research & Development": ("1083-6160", "Organic"),
    "JACS Au": ("2691-3704", "General"),
}

MAX_ARTICLES_PER_JOURNAL = 20
OUTPUT_FILE = "papers.json"
DAYS_TO_KEEP = 60

def clean_abstract(jats_text):
    text = unescape(jats_text)
    return re.sub("<[^>]+>", "", text).strip()

def extract_date(article):
    parts = (
        article.get("published-print") or
        article.get("published-online") or
        article.get("issued")
    ).get("date-parts", [[None]])
    date = parts[0]
    return {
        "year": date[0] if len(date) > 0 else None,
        "month": date[1] if len(date) > 1 else None,
        "day": date[2] if len(date) > 2 else None
    }

def article_is_recent(article, cutoff_date):
    try:
        d = article.get("date", {})
        pub_date = datetime(d["year"], d.get("month", 1), d.get("day", 1))
        return pub_date >= cutoff_date
    except:
        return False

def fetch_articles(issn, count):
    url = f"https://api.crossref.org/journals/{issn}/works"
    params = {
        "sort": "published",
        "order": "desc",
        "rows": count,
        "filter": "type:journal-article"
    }
    try:
        r = requests.get(url, params=params, headers={"User-Agent": "ChemPaperFeed/1.0 (mailto:your-email@example.com)"}, timeout=20)
        r.raise_for_status()
        return r.json()["message"]["items"]
    except Exception as e:
        raise RuntimeError(f"Request failed: {e}")

def format_article(article, journal_name, discipline):
    title = article.get("title", ["Untitled"])[0]
    if any(kw in title.lower() for kw in ["cover", "correction", "masthead", "issue", "editorial", "erratum", "retraction"]):
        return None
    if not article.get("author"):
        return None
    entry = {
        "title": title,
        "authors": ", ".join([
            f"{a.get('given', '')} {a.get('family', '')}".strip()
            for a in article.get("author", [])
        ]) or "Unknown",
        "doi": article.get("DOI"),
        "link": f"https://doi.org/{article['DOI']}" if "DOI" in article else None,
        "journal": journal_name,
        "discipline": discipline,
        "date": extract_date(article)
    }
    if "abstract" in article:
        entry["abstract"] = clean_abstract(article["abstract"])
    return entry

def load_existing_articles(path, days_to_keep):
    if not os.path.exists(path):
        return [], set()
    with open(path, "r", encoding="utf-8") as f:
        articles = json.load(f)
    cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
    recent_articles = []
    existing_dois = set()
    for a in articles:
        if article_is_recent(a, cutoff_date):
            recent_articles.append(a)
            existing_dois.add(a["doi"])
    return recent_articles, existing_dois

def main():
    all_articles, existing_dois = load_existing_articles(OUTPUT_FILE, DAYS_TO_KEEP)
    for journal, (issn, discipline) in JOURNALS.items():
        print(f"📚 Fetching from {journal}...")
        try:
            works = fetch_articles(issn, MAX_ARTICLES_PER_JOURNAL)
            for work in works:
                if work.get("DOI") in existing_dois:
                    continue
                formatted = format_article(work, journal, discipline)
                if formatted:
                    all_articles.append(formatted)
                    existing_dois.add(formatted["doi"])
        except RuntimeError as e:
            print(f"⏭️ Skipped: {journal} ({e})")
    print(f"✅ Total articles saved: {len(all_articles)}")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_articles, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
