if ($response.statusCode !== 200) {
    $done(null);
}

const emojis = ['🌋', '⛰️', '🏔️', '🗻', '🌵', '🌊', '🌀', '💠', '🌐', '🐳', '🐋', '🐷', '🐽', '🪽', '🦚', '🕊️', '🦢', '🐦‍🔥', '🎋', '✨', '🌟', '⚡️', '🍟', '🥞', '🥯', '🍥', '🍿', '🧊', '🪁', '🥏', '🛹', '🎿', '🪂', '⛷️', '🏂', '🏄🏻', '🤽🏻‍♂️', '🪃', '🎮', '🎯', '🕹️', '🖲️', '📟', '📠', '💸', '🪙', '💎', '🔫', '🎏', '🪩', '💮', '🈵', '🔞', '📵', '🚼', '🏮', '👰🏻‍♀️', '👩🏻‍🦳', '👺', '👹', '👾', '🤑', '🫨', '🤤', '🙂‍↔️', '🙂‍↕️'];
const fixedSymbols = ['', '★', '✧', '✿', '❂'];

const flags = new Map([
  ["AC", "🇦🇨"], ["AE", "🇦🇪"], ["AF", "🇦🇫"], ["AI", "🇦🇮"], ["AL", "🇦🇱"], ["AM", "🇦🇲"], ["AQ", "🇦🇶"], ["AR", "🇦🇷"], ["AS", "🇦🇸"], ["AT", "🇦🇹"], ["AU", "🇦🇺"], ["AW", "🇦🇼"], ["AX", "🇦🇽"], ["AZ", "🇦🇿"], ["BA", "🇧🇦"], ["BB", "🇧🇧"], ["BD", "🇧🇩"], ["BE", "🇧🇪"], ["BF", "🇧🇫"], ["BG", "🇧🇬"], 
  ["BH", "🇧🇭"], ["BI", "🇧🇮"], ["BJ", "🇧🇯"], ["BM", "🇧🇲"], ["BN", "🇧🇳"], ["BO", "🇧🇴"], ["BR", "🇧🇷"], ["BS", "🇧🇸"], ["BT", "🇧🇹"], ["BV", "🇧🇻"], ["BW", "🇧🇼"], ["BY", "🇧🇾"], ["BZ", "🇧🇿"], ["CA", "🇨🇦"], ["CF", "🇨🇫"], ["CH", "🇨🇭"], ["CK", "🇨🇰"], ["CL", "🇨🇱"], ["CM", "🇨🇲"], ["CN", "🇨🇳"], ["CO", "🇨🇴"], ["CP", "🇨🇵"], ["CR", "🇨🇷"], ["CU", "🇨🇺"], ["CV", "🇨🇻"], ["CW", "🇨🇼"], ["CX", "🇨🇽"], ["CY", "🇨🇾"], ["CZ", "🇨🇿"], ["DE", "🇩🇪"], ["DG", "🇩🇬"], ["DJ", "🇩🇯"], ["DK", "🇩🇰"], ["DM", "🇩🇲"], ["DO", "🇩🇴"], ["DZ", "🇩🇿"], ["EA", "🇪🇦"], ["EC", "🇪🇨"], ["EE", "🇪🇪"], ["EG", "🇪🇬"], ["EH", "🇪🇭"], ["ER", "🇪🇷"], ["ES", "🇪🇸"], ["ET", "🇪🇹"], ["EU", "🇪🇺"], ["FI", "🇫🇮"], ["FJ", "🇫🇯"], ["FK", "🇫🇰"], ["FM", "🇫🇲"], ["FO", "🇫🇴"], ["FR", "🇫🇷"], ["GA", "🇬🇦"], ["GB", "🇬🇧"], ["HK", "🇭🇰"], ["HU", "🇭🇺"], ["ID", "🇮🇩"], ["IE", "🇮🇪"], ["IL", "🇮🇱"], ["IM", "🇮🇲"], ["IN", "🇮🇳"], ["IS", "🇮🇸"], ["IT", "🇮🇹"], ["JP", "🇯🇵"], ["KR", "🇰🇷"], ["LU", "🇱🇺"], ["MO", "🇲🇴"], ["MX", "🇲🇽"], ["MY", "🇲🇾"], ["NL", "🇳🇱"], ["PH", "🇵🇭"], ["RO", "🇷🇴"], ["RS", "🇷🇸"], ["RU", "🇷🇺"], ["RW", "🇷🇼"], ["SA", "🇸🇦"], ["SB", "🇸🇧"], ["SC", "🇸🇨"], ["SD", "🇸🇩"], ["SE", "🇸🇪"], ["SG", "🇸🇬"], ["TH", "🇹🇭"], ["TN", "🇹🇳"], ["TO", "🇹🇴"], ["TR", "🇹🇷"], ["TV", "🇹🇻"], ["TW", "🇹🇼"], ["UK", "🇬🇧"], ["UM", "🇺🇲"], ["US", "🇺🇸"], ["UY", "🇺🇾"], ["UZ", "🇺🇿"], ["VA", "🇻🇦"], ["VE", "🇻🇪"], ["VG", "🇻🇬"], ["VI", "🇻🇮"], ["VN", "🇻🇳"], ["ZA", "🇿🇦"]
]);

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function ValidCheck(para) {
  return para ? para : emojis[getRandomInt(emojis.length)];
}

function getFlag(countryCode) {
  return flags.get(countryCode) || '🏳️‍🌈';
}

function removeCity(name) {
    return name.replace(/\s*city\s*/i, '').trim();
}

function processASInfo(as, asname) {
    const asMatch = as.match(/AS(\d+)\s*(.*)/);
    if (!asMatch) return { asNumber: '', asName: asname || '' };

    const asNumber = asMatch[1];
    let processedAsName = asMatch[2] || asname || '';

    processedAsName = processedAsName
        .replace(new RegExp(`-?AS?${asNumber}$`), '')
        .replace(new RegExp(`^AS${asNumber}\\s*-?\\s*`), '')
        .replace(new RegExp(`^${asNumber}\\s*-?\\s*`), '')
        .trim();

    // Handle special cases
    if (processedAsName.toUpperCase() === (asname || '').toUpperCase()) {
        processedAsName = processedAsName.split('-')[0].trim();
    }

    // If processedAsName is empty, use the original asname
    if (!processedAsName && asname) {
        processedAsName = asname.replace(/^AS-/, '');
    }

    return { asNumber, asName: processedAsName };
}

function getRandomFixedSymbol() {
  return fixedSymbols[getRandomInt(fixedSymbols.length)];
}

function getRandomEmoji() {
  return emojis[getRandomInt(emojis.length)];
}

var body = $response.body;
var obj = JSON.parse(body);

var countryFlag = getFlag(obj.countryCode);
var cityName = obj.city ? removeCity(obj.city) : '';

// Generate title
var title;
if (obj.countryCode === 'US') {
    if (obj.region && obj.regionName) {
        title = Math.random() < 0.5
            ? `${countryFlag} ${cityName}, ${obj.region}, ${obj.countryCode}`
            : `${countryFlag} ${cityName}-(${obj.region}), ${obj.countryCode}`;
    } else {
        title = `${countryFlag} ${cityName}, ${obj.countryCode}`;
    }
} else {
    title = `${countryFlag} ${cityName}, ${obj.countryCode}`;
}

// Generate subtitle
var { asNumber, asName } = processASInfo(obj.as, obj.asname);
var subtitle = Math.random() < 0.5
    ? `${getRandomEmoji()} AS${asNumber} · ${asName}`
    : `${getRandomFixedSymbol()}AS${asNumber}-(${asName})${getRandomFixedSymbol()}`;

// Generate description
var description = `🌐 ${obj.query}
📍 ${ValidCheck(obj.city)}, ${ValidCheck(obj.regionName)}, ${obj.country}
🔢 ${obj.as}
🏢 ${obj.org}`;

$done({ title, subtitle, ip: obj.query, description });