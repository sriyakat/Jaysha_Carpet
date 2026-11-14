const countries = [
    ["IN", "India"],
    ["AT", "Austria"], ["BE", "Belgium"], ["BG", "Bulgaria"],
    ["HR", "Croatia"], ["CY", "Cyprus"], ["CZ", "Czechia"],
    ["DK", "Denmark"], ["EE", "Estonia"], ["FI", "Finland"],
    ["FR", "France"], ["DE", "Germany"], ["GR", "Greece"],
    ["HU", "Hungary"], ["IE", "Ireland"], ["IT", "Italy"],
    ["LV", "Latvia"], ["LT", "Lithuania"], ["LU", "Luxembourg"],
    ["MT", "Malta"], ["NL", "Netherlands"], ["PL", "Poland"],
    ["PT", "Portugal"], ["RO", "Romania"], ["SK", "Slovakia"],
    ["SI", "Slovenia"], ["ES", "Spain"], ["SE", "Sweden"],
    ["GB", "United Kingdom"], ["AE", "United Arab Emirates"],
    ["SA", "Saudi Arabia"], ["QA", "Qatar"], ["KW", "Kuwait"],
    ["BH", "Bahrain"], ["OM", "Oman"], ["US", "United States"],
    ["CA", "Canada"], ["AU", "Australia"], ["NZ", "New Zealand"]
].map(([code, name]) => ({ code, name }));

const aliases = new Map([
    ["uk", "GB"],
    ["great britain", "GB"],
    ["usa", "US"],
    ["u.s.a.", "US"],
    ["united states of america", "US"],
    ["uae", "AE"]
]);

const getCountryCode = (countryName) => {
    const normalized = String(countryName || "").trim().toLowerCase();
    const alias = aliases.get(normalized);
    if (alias) return alias;

    return countries.find((country) =>
        country.code.toLowerCase() === normalized
        || country.name.toLowerCase() === normalized
    )?.code || "";
};

const getCountryName = (countryCode) =>
    countries.find((country) => country.code === countryCode)?.name || "";

module.exports = { countries, getCountryCode, getCountryName };
