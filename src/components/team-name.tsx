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
  "Türkiye": "tr",
  "USA": "us",
  "United States": "us",
  "Uruguay": "uy",
  "Venezuela": "ve",
  "Wales": "gb-wls",
  "Algeria": "dz",
  "Austria": "at",
  "Bahrain": "bh",
  "Bosnia-Herzegovina": "ba",
  "Cape Verde Islands": "cv",
  "China PR": "cn",
  "Congo DR": "cd",
  "Czech Republic": "cz",
  "Czechia": "cz",
  "Curaçao": "cw",
  "El Salvador": "sv",
  "Finland": "fi",
  "Greece": "gr",
  "Guatemala": "gt",
  "Haiti": "ht",
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
    <span className="inline-flex items-center gap-1.5">
      {flagUrl && (
        <img
          src={flagUrl}
          alt=""
          className="h-3.5 w-5 rounded-[2px] object-cover"
          loading="lazy"
        />
      )}
      <span className="text-sm font-semibold text-white">{name}</span>
    </span>
  );
}
