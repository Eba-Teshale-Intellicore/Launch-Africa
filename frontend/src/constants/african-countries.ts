export const AFRICAN_COUNTRIES = [
  { name: "Algeria", flag: "🇩🇿" },
  { name: "Angola", flag: "🇦🇴" },
  { name: "Benin", flag: "🇧🇯" },
  { name: "Botswana", flag: "🇧🇼" },
  { name: "Burkina Faso", flag: "🇧🇫" },
  { name: "Burundi", flag: "🇧🇮" },
  { name: "Cabo Verde", flag: "🇨🇻" },
  { name: "Cameroon", flag: "🇨🇲" },
  { name: "Central African Republic", flag: "🇨🇫" },
  { name: "Chad", flag: "🇹🇩" },
  { name: "Comoros", flag: "🇰🇲" },
  { name: "Republic of the Congo", flag: "🇨🇬" },
  { name: "Democratic Republic of the Congo", flag: "🇨🇩" },
  { name: "Côte d’Ivoire", flag: "🇨🇮" },
  { name: "Djibouti", flag: "🇩🇯" },
  { name: "Egypt", flag: "🇪🇬" },
  { name: "Equatorial Guinea", flag: "🇬🇶" },
  { name: "Eritrea", flag: "🇪🇷" },
  { name: "Eswatini", flag: "🇸🇿" },
  { name: "Ethiopia", flag: "🇪🇹" },
  { name: "Gabon", flag: "🇬🇦" },
  { name: "The Gambia", flag: "🇬🇲" },
  { name: "Ghana", flag: "🇬🇭" },
  { name: "Guinea", flag: "🇬🇳" },
  { name: "Guinea-Bissau", flag: "🇬🇼" },
  { name: "Kenya", flag: "🇰🇪" },
  { name: "Lesotho", flag: "🇱🇸" },
  { name: "Liberia", flag: "🇱🇷" },
  { name: "Libya", flag: "🇱🇾" },
  { name: "Madagascar", flag: "🇲🇬" },
  { name: "Malawi", flag: "🇲🇼" },
  { name: "Mali", flag: "🇲🇱" },
  { name: "Mauritania", flag: "🇲🇷" },
  { name: "Mauritius", flag: "🇲🇺" },
  { name: "Morocco", flag: "🇲🇦" },
  { name: "Mozambique", flag: "🇲🇿" },
  { name: "Namibia", flag: "🇳🇦" },
  { name: "Niger", flag: "🇳🇪" },
  { name: "Nigeria", flag: "🇳🇬" },
  { name: "Rwanda", flag: "🇷🇼" },
  { name: "São Tomé and Príncipe", flag: "🇸🇹" },
  { name: "Senegal", flag: "🇸🇳" },
  { name: "Seychelles", flag: "🇸🇨" },
  { name: "Sierra Leone", flag: "🇸🇱" },
  { name: "Somalia", flag: "🇸🇴" },
  { name: "South Africa", flag: "🇿🇦" },
  { name: "South Sudan", flag: "🇸🇸" },
  { name: "Sudan", flag: "🇸🇩" },
  { name: "Tanzania", flag: "🇹🇿" },
  { name: "Togo", flag: "🇹🇬" },
  { name: "Tunisia", flag: "🇹🇳" },
  { name: "Uganda", flag: "🇺🇬" },
  { name: "Zambia", flag: "🇿🇲" },
  { name: "Zimbabwe", flag: "🇿🇼" },
] as const;

export type AfricanCountry = (typeof AFRICAN_COUNTRIES)[number]["name"];
export function getAfricanCountryFlag(countryName: string): string {
  return (
    AFRICAN_COUNTRIES.find((country) => country.name === countryName)?.flag ??
    "🌍"
  );
}
// <span>
//   {getAfricanCountryFlag(product.country)}{" "}
//   {product.country}
// </span>
