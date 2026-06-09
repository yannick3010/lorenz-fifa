const FLAGS: Record<string, string> = {
  "Argentina": "ar",
  "Australia": "au",
  "Belgium": "be",
  "Bolivia": "bo",
  "Brazil": "br",
  "Cameroon": "cm",
  "Canada": "ca",
  "Chile": "cl",
  "Colombia": "co",
  "Costa Rica": "cr",
  "Croatia": "hr",
  "Denmark": "dk",
  "Ecuador": "ec",
  "Egypt": "eg",
  "England": "gb-eng",
  "France": "fr",
  "Germany": "de",
  "Ghana": "gh",
  "Iran": "ir",
  "Italy": "it",
  "Ivory Coast": "ci",
  "Jamaica": "jm",
  "Japan": "jp",
  "Korea Republic": "kr",
  "South Korea": "kr",
  "Mexico": "mx",
  "Morocco": "ma",
  "Netherlands": "nl",
  "New Zealand": "nz",
  "Nigeria": "ng",
  "Norway": "no",
  "Panama": "pa",
  "Paraguay": "py",
  "Peru": "pe",
  "Poland": "pl",
  "Portugal": "pt",
  "Qatar": "qa",
  "Saudi Arabia": "sa",
  "Scotland": "gb-sct",
  "Senegal": "sn",
  "Serbia": "rs",
  "Slovenia": "si",
  "South Africa": "za",
  "Spain": "es",
  "Sweden": "se",
  "Switzerland": "ch",
  "Tunisia": "tn",
  "Turkey": "tr",
  "USA": "us",
  "United States": "us",
  "Uruguay": "uy",
  "Venezuela": "ve",
  "Wales": "gb-wls",
  "Algeria": "dz",
  "Austria": "at",
  "Bahrain": "bh",
  "China PR": "cn",
  "Congo DR": "cd",
  "Czech Republic": "cz",
  "Czechia": "cz",
  "El Salvador": "sv",
  "Finland": "fi",
  "Greece": "gr",
  "Guatemala": "gt",
  "Honduras": "hn",
  "Hungary": "hu",
  "Iceland": "is",
  "Indonesia": "id",
  "Iraq": "iq",
  "Ireland": "ie",
  "Israel": "il",
  "Jordan": "jo",
  "Kenya": "ke",
  "Oman": "om",
  "Palestine": "ps",
  "Philippines": "ph",
  "Romania": "ro",
  "Russia": "ru",
  "Slovakia": "sk",
  "Suriname": "sr",
  "Thailand": "th",
  "Trinidad and Tobago": "tt",
  "Türkiye": "tr",
  "Ukraine": "ua",
  "Uzbekistan": "uz",
  "Vietnam": "vn",
};

export function getFlagUrl(teamName: string): string | null {
  const code = FLAGS[teamName];
  if (!code) return null;
  return `https://flagcdn.com/w40/${code}.png`;
}

export function TeamName({ name }: { name: string }) {
  const flagUrl = getFlagUrl(name);
  return (
    <span className="inline-flex items-center gap-2">
      {flagUrl && (
        <img
          src={flagUrl}
          alt={`${name} flag`}
          className="h-4 w-6 rounded-sm object-cover"
          loading="lazy"
        />
      )}
      <span>{name}</span>
    </span>
  );
}
