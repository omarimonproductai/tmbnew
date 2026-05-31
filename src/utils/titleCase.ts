// Catalan/Spanish connector words kept lowercase when not the first word, so
// title-casing an ALL-CAPS name (e.g. the Bicing GBFS feed) reads naturally:
// "C/ VILLAR, 2" → "C/ Villar, 2", "CARRER DE LA MARINA" → "Carrer de la Marina".
const LOWER = new Set([
  'de', 'del', 'dels', 'la', 'les', 'el', 'els', 'l', 'd', 'i', 'en', 'a',
  'amb', 'per', 'o', 'al', 'als', 'sense', 'sobre',
]);

function capitalizeWord(word: string): string {
  // Uppercase the first letter and any letter after an apostrophe, slash, dot
  // or hyphen (so "l'hospitalet" → "L'Hospitalet", "c/" → "C/").
  return word.replace(/(^|['’/.\-])(\p{L})/gu, (_, sep, ch) =>
    sep + ch.toLocaleUpperCase('ca'),
  );
}

export function titleCaseName(input: string): string {
  const s = input.trim();
  if (!s) return s;
  return s
    .toLocaleLowerCase('ca')
    .split(/\s+/)
    .map((word, idx) => {
      if (idx === 0) return capitalizeWord(word);
      if (LOWER.has(word)) return word;
      // Elided article (l' / d') stays lowercase, the noun after it is capitalized.
      const elision = word.match(/^([ld])['’](.+)$/u);
      if (elision) return `${elision[1]}'${capitalizeWord(elision[2])}`;
      return capitalizeWord(word);
    })
    .join(' ');
}
