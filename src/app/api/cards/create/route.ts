import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { callCashwyreAPI } from '@/lib/cashwyre-client';
import { generateRequestId, decrypt } from '@/lib/utils';
import { getBridgeQuote } from '@/lib/bridge-client';
import { buildTransferManifest, signAndSubmitManifest } from '@/lib/radix-engine';
import { checkXRDForBridge, getUSDCBalance } from '@/lib/radix-rpc';

// Function to generate phone number based on country code
function generatePhoneNumber(phoneCode: string): string {
  // Generate random digits based on country code patterns
  const generateDigits = (count: number) => {
    let digits = '';
    for (let i = 0; i < count; i++) {
      digits += Math.floor(Math.random() * 10).toString();
    }
    return digits;
  };

  // Phone number patterns by country code
  const phonePatterns: Record<string, { length: number; format?: (digits: string) => string }> = {
    '+1': { length: 10 }, // US/Canada: 10 digits
    '+7': { length: 10 }, // Russia/Kazakhstan: 10 digits
    '+20': { length: 10 }, // Egypt: 10 digits
    '+27': { length: 9 }, // South Africa: 9 digits
    '+30': { length: 10 }, // Greece: 10 digits
    '+31': { length: 9 }, // Netherlands: 9 digits
    '+32': { length: 9 }, // Belgium: 9 digits
    '+33': { length: 9 }, // France: 9 digits
    '+34': { length: 9 }, // Spain: 9 digits
    '+36': { length: 9 }, // Hungary: 9 digits
    '+39': { length: 9 }, // Italy: 9-10 digits
    '+40': { length: 9 }, // Romania: 9 digits
    '+41': { length: 9 }, // Switzerland: 9 digits
    '+43': { length: 10 }, // Austria: 10 digits
    '+44': { length: 10 }, // UK: 10-11 digits
    '+45': { length: 8 }, // Denmark: 8 digits
    '+46': { length: 9 }, // Sweden: 9 digits
    '+47': { length: 8 }, // Norway: 8 digits
    '+48': { length: 9 }, // Poland: 9 digits
    '+49': { length: 10 }, // Germany: 10-11 digits
    '+51': { length: 9 }, // Peru: 9 digits
    '+52': { length: 10 }, // Mexico: 10 digits
    '+53': { length: 8 }, // Cuba: 8 digits
    '+54': { length: 10 }, // Argentina: 10 digits
    '+55': { length: 10 }, // Brazil: 10-11 digits
    '+56': { length: 9 }, // Chile: 9 digits
    '+57': { length: 10 }, // Colombia: 10 digits
    '+58': { length: 10 }, // Venezuela: 10 digits
    '+60': { length: 9 }, // Malaysia: 9-10 digits
    '+61': { length: 9 }, // Australia: 9 digits
    '+62': { length: 9 }, // Indonesia: 9-11 digits
    '+63': { length: 10 }, // Philippines: 10 digits
    '+64': { length: 8 }, // New Zealand: 8-9 digits
    '+65': { length: 8 }, // Singapore: 8 digits
    '+66': { length: 9 }, // Thailand: 9 digits
    '+81': { length: 10 }, // Japan: 10-11 digits
    '+82': { length: 9 }, // South Korea: 9-10 digits
    '+84': { length: 9 }, // Vietnam: 9-10 digits
    '+86': { length: 11 }, // China: 11 digits
    '+90': { length: 10 }, // Turkey: 10 digits
    '+91': { length: 10 }, // India: 10 digits
    '+92': { length: 10 }, // Pakistan: 10 digits
    '+93': { length: 9 }, // Afghanistan: 9 digits
    '+94': { length: 9 }, // Sri Lanka: 9 digits
    '+95': { length: 9 }, // Myanmar: 9 digits
    '+98': { length: 10 }, // Iran: 10 digits
    '+212': { length: 9 }, // Morocco: 9 digits
    '+213': { length: 9 }, // Algeria: 9 digits
    '+216': { length: 8 }, // Tunisia: 8 digits
    '+218': { length: 9 }, // Libya: 9 digits
    '+220': { length: 7 }, // Gambia: 7 digits
    '+221': { length: 9 }, // Senegal: 9 digits
    '+222': { length: 8 }, // Mauritania: 8 digits
    '+223': { length: 8 }, // Mali: 8 digits
    '+224': { length: 9 }, // Guinea: 9 digits
    '+225': { length: 10 }, // Ivory Coast: 10 digits
    '+226': { length: 8 }, // Burkina Faso: 8 digits
    '+227': { length: 8 }, // Niger: 8 digits
    '+228': { length: 8 }, // Togo: 8 digits
    '+229': { length: 8 }, // Benin: 8 digits
    '+230': { length: 7 }, // Mauritius: 7 digits
    '+231': { length: 8 }, // Liberia: 8 digits
    '+232': { length: 8 }, // Sierra Leone: 8 digits
    '+233': { length: 9 }, // Ghana: 9 digits
    '+234': { length: 10 }, // Nigeria: 10-11 digits
    '+235': { length: 8 }, // Chad: 8 digits
    '+236': { length: 8 }, // Central African Republic: 8 digits
    '+237': { length: 9 }, // Cameroon: 9 digits
    '+238': { length: 7 }, // Cape Verde: 7 digits
    '+239': { length: 7 }, // São Tomé and Príncipe: 7 digits
    '+240': { length: 9 }, // Equatorial Guinea: 9 digits
    '+241': { length: 7 }, // Gabon: 7 digits
    '+242': { length: 9 }, // Republic of the Congo: 9 digits
    '+243': { length: 9 }, // DR Congo: 9 digits
    '+244': { length: 9 }, // Angola: 9 digits
    '+245': { length: 7 }, // Guinea-Bissau: 7 digits
    '+246': { length: 7 }, // British Indian Ocean Territory: 7 digits
    '+248': { length: 7 }, // Seychelles: 7 digits
    '+249': { length: 9 }, // Sudan: 9 digits
    '+250': { length: 9 }, // Rwanda: 9 digits
    '+251': { length: 9 }, // Ethiopia: 9 digits
    '+252': { length: 8 }, // Somalia: 8 digits
    '+253': { length: 8 }, // Djibouti: 8 digits
    '+254': { length: 9 }, // Kenya: 9 digits
    '+255': { length: 9 }, // Tanzania: 9 digits
    '+256': { length: 9 }, // Uganda: 9 digits
    '+257': { length: 8 }, // Burundi: 8 digits
    '+258': { length: 9 }, // Mozambique: 9 digits
    '+260': { length: 9 }, // Zambia: 9 digits
    '+261': { length: 9 }, // Madagascar: 9 digits
    '+262': { length: 9 }, // Réunion: 9 digits
    '+263': { length: 9 }, // Zimbabwe: 9 digits
    '+264': { length: 9 }, // Namibia: 9 digits
    '+265': { length: 9 }, // Malawi: 9 digits
    '+266': { length: 8 }, // Lesotho: 8 digits
    '+267': { length: 8 }, // Botswana: 8 digits
    '+268': { length: 8 }, // Eswatini: 8 digits
    '+269': { length: 7 }, // Comoros: 7 digits
    '+290': { length: 4 }, // Saint Helena: 4 digits
    '+291': { length: 7 }, // Eritrea: 7 digits
    '+297': { length: 7 }, // Aruba: 7 digits
    '+298': { length: 6 }, // Faroe Islands: 6 digits
    '+299': { length: 6 }, // Greenland: 6 digits
    '+350': { length: 8 }, // Gibraltar: 8 digits
    '+351': { length: 9 }, // Portugal: 9 digits
    '+352': { length: 9 }, // Luxembourg: 9 digits
    '+353': { length: 9 }, // Ireland: 9 digits
    '+354': { length: 7 }, // Iceland: 7 digits
    '+355': { length: 9 }, // Albania: 9 digits
    '+356': { length: 8 }, // Malta: 8 digits
    '+357': { length: 8 }, // Cyprus: 8 digits
    '+358': { length: 9 }, // Finland: 9 digits
    '+359': { length: 9 }, // Bulgaria: 9 digits
    '+370': { length: 8 }, // Lithuania: 8 digits
    '+371': { length: 8 }, // Latvia: 8 digits
    '+372': { length: 7 }, // Estonia: 7-8 digits
    '+373': { length: 8 }, // Moldova: 8 digits
    '+374': { length: 8 }, // Armenia: 8 digits
    '+375': { length: 9 }, // Belarus: 9 digits
    '+376': { length: 6 }, // Andorra: 6 digits
    '+377': { length: 8 }, // Monaco: 8 digits
    '+378': { length: 6 }, // San Marino: 6 digits
    '+380': { length: 9 }, // Ukraine: 9 digits
    '+381': { length: 9 }, // Serbia: 9 digits
    '+382': { length: 8 }, // Montenegro: 8 digits
    '+383': { length: 8 }, // Kosovo: 8 digits
    '+385': { length: 9 }, // Croatia: 9 digits
    '+386': { length: 8 }, // Slovenia: 8 digits
    '+387': { length: 8 }, // Bosnia and Herzegovina: 8 digits
    '+389': { length: 8 }, // North Macedonia: 8 digits
    '+420': { length: 9 }, // Czech Republic: 9 digits
    '+421': { length: 9 }, // Slovakia: 9 digits
    '+423': { length: 7 }, // Liechtenstein: 7 digits
    '+500': { length: 5 }, // Falkland Islands: 5 digits
    '+501': { length: 7 }, // Belize: 7 digits
    '+502': { length: 8 }, // Guatemala: 8 digits
    '+503': { length: 8 }, // El Salvador: 8 digits
    '+504': { length: 8 }, // Honduras: 8 digits
    '+505': { length: 8 }, // Nicaragua: 8 digits
    '+506': { length: 8 }, // Costa Rica: 8 digits
    '+507': { length: 8 }, // Panama: 8 digits
    '+508': { length: 6 }, // Saint Pierre and Miquelon: 6 digits
    '+509': { length: 8 }, // Haiti: 8 digits
    '+590': { length: 9 }, // Guadeloupe: 9 digits
    '+591': { length: 8 }, // Bolivia: 8 digits
    '+592': { length: 7 }, // Guyana: 7 digits
    '+593': { length: 9 }, // Ecuador: 9 digits
    '+594': { length: 9 }, // French Guiana: 9 digits
    '+595': { length: 9 }, // Paraguay: 9 digits
    '+596': { length: 9 }, // Martinique: 9 digits
    '+597': { length: 7 }, // Suriname: 7 digits
    '+598': { length: 8 }, // Uruguay: 8 digits
    '+599': { length: 7 }, // Curaçao: 7 digits
    '+670': { length: 8 }, // East Timor: 8 digits
    '+672': { length: 5 }, // Antarctica: 5 digits
    '+673': { length: 7 }, // Brunei: 7 digits
    '+674': { length: 7 }, // Nauru: 7 digits
    '+675': { length: 8 }, // Papua New Guinea: 8 digits
    '+676': { length: 5 }, // Tonga: 5 digits
    '+677': { length: 7 }, // Solomon Islands: 7 digits
    '+678': { length: 7 }, // Vanuatu: 7 digits
    '+679': { length: 7 }, // Fiji: 7 digits
    '+680': { length: 7 }, // Palau: 7 digits
    '+681': { length: 6 }, // Wallis and Futuna: 6 digits
    '+682': { length: 5 }, // Cook Islands: 5 digits
    '+683': { length: 4 }, // Niue: 4 digits
    '+685': { length: 6 }, // Samoa: 6 digits
    '+686': { length: 5 }, // Kiribati: 5 digits
    '+687': { length: 6 }, // New Caledonia: 6 digits
    '+688': { length: 5 }, // Tuvalu: 5 digits
    '+689': { length: 6 }, // French Polynesia: 6 digits
    '+690': { length: 4 }, // Tokelau: 4 digits
    '+691': { length: 7 }, // Micronesia: 7 digits
    '+692': { length: 7 }, // Marshall Islands: 7 digits
    '+850': { length: 8 }, // North Korea: 8 digits
    '+852': { length: 8 }, // Hong Kong: 8 digits
    '+853': { length: 8 }, // Macau: 8 digits
    '+855': { length: 9 }, // Cambodia: 9 digits
    '+856': { length: 9 }, // Laos: 9 digits
    '+880': { length: 10 }, // Bangladesh: 10 digits
    '+886': { length: 9 }, // Taiwan: 9 digits
    '+960': { length: 7 }, // Maldives: 7 digits
    '+961': { length: 8 }, // Lebanon: 8 digits
    '+962': { length: 9 }, // Jordan: 9 digits
    '+963': { length: 9 }, // Syria: 9 digits
    '+964': { length: 10 }, // Iraq: 10 digits
    '+965': { length: 8 }, // Kuwait: 8 digits
    '+966': { length: 9 }, // Saudi Arabia: 9 digits
    '+967': { length: 9 }, // Yemen: 9 digits
    '+968': { length: 8 }, // Oman: 8 digits
    '+970': { length: 9 }, // Palestine: 9 digits
    '+971': { length: 9 }, // UAE: 9 digits
    '+972': { length: 9 }, // Israel: 9 digits
    '+973': { length: 8 }, // Bahrain: 8 digits
    '+974': { length: 8 }, // Qatar: 8 digits
    '+975': { length: 8 }, // Bhutan: 8 digits
    '+976': { length: 8 }, // Mongolia: 8 digits
    '+977': { length: 10 }, // Nepal: 10 digits
    '+992': { length: 9 }, // Tajikistan: 9 digits
    '+993': { length: 8 }, // Turkmenistan: 8 digits
    '+994': { length: 9 }, // Azerbaijan: 9 digits
    '+995': { length: 9 }, // Georgia: 9 digits
    '+996': { length: 9 }, // Kyrgyzstan: 9 digits
    '+998': { length: 9 }, // Uzbekistan: 9 digits
  };

  const pattern = phonePatterns[phoneCode] || { length: 10 }; // Default to 10 digits if not found
  const digits = generateDigits(pattern.length);
  
  return pattern.format ? pattern.format(digits) : digits;
}

// Function to randomly select a country code
function getRandomCountryCode(): string {
  const countryCodes = [
    '+1', '+7', '+20', '+27', '+30', '+31', '+32', '+33', '+34', '+36', '+39', '+40', '+41', '+43', '+44',
    '+45', '+46', '+47', '+48', '+49', '+51', '+52', '+53', '+54', '+55', '+56', '+57', '+58', '+60', '+61',
    '+62', '+63', '+64', '+65', '+66', '+81', '+82', '+84', '+86', '+90', '+91', '+92', '+93', '+94', '+95',
    '+98', '+212', '+213', '+216', '+218', '+220', '+221', '+222', '+223', '+224', '+225', '+226', '+227',
    '+228', '+229', '+230', '+231', '+232', '+233', '+234', '+235', '+236', '+237', '+238', '+239', '+240',
    '+241', '+242', '+243', '+244', '+245', '+246', '+248', '+249', '+250', '+251', '+252', '+253', '+254',
    '+255', '+256', '+257', '+258', '+260', '+261', '+262', '+263', '+264', '+265', '+266', '+267', '+268',
    '+269', '+290', '+291', '+297', '+298', '+299', '+350', '+351', '+352', '+353', '+354', '+355', '+356',
    '+357', '+358', '+359', '+370', '+371', '+372', '+373', '+374', '+375', '+376', '+377', '+378', '+380',
    '+381', '+382', '+383', '+385', '+386', '+387', '+389', '+420', '+421', '+423', '+500', '+501', '+502',
    '+503', '+504', '+505', '+506', '+507', '+508', '+509', '+590', '+591', '+592', '+593', '+594', '+595',
    '+596', '+597', '+598', '+599', '+670', '+672', '+673', '+674', '+675', '+676', '+677', '+678', '+679',
    '+680', '+681', '+682', '+683', '+685', '+686', '+687', '+688', '+689', '+690', '+691', '+692', '+850',
    '+852', '+853', '+855', '+856', '+880', '+886', '+960', '+961', '+962', '+963', '+964', '+965', '+966',
    '+967', '+968', '+970', '+971', '+972', '+973', '+974', '+975', '+976', '+977', '+992', '+993', '+994',
    '+995', '+996', '+998',
  ];
  
  return countryCodes[Math.floor(Math.random() * countryCodes.length)];
}

// Function to generate random address based on country code
function generateAddress(phoneCode: string): { homeAddressNumber: string; homeAddress: string } {
  const streetNames = [
    'Main Street', 'Oak Avenue', 'Park Road', 'Elm Street', 'Maple Drive', 'Cedar Lane', 'Pine Street',
    'Washington Avenue', 'Lincoln Boulevard', 'Jefferson Street', 'Madison Avenue', 'Adams Street',
    'Broadway', 'First Street', 'Second Street', 'Third Avenue', 'Fourth Street', 'Fifth Avenue',
    'Church Street', 'Market Street', 'High Street', 'Queen Street', 'King Street', 'Victoria Road',
    'Garden Street', 'Hill Road', 'River Street', 'Lake Avenue', 'Forest Lane', 'Sunset Boulevard',
    'Spring Street', 'Summer Avenue', 'Winter Road', 'Autumn Lane', 'Green Street', 'Blue Avenue',
    'Red Road', 'White Street', 'Black Avenue', 'Brown Lane', 'Rose Street', 'Lily Avenue',
  ];

  const cityNames: Record<string, string[]> = {
    '+1': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
    '+7': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Almaty', 'Nur-Sultan'],
    '+20': ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said'],
    '+27': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth'],
    '+30': ['Athens', 'Thessaloniki', 'Patras', 'Heraklion', 'Larissa'],
    '+31': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
    '+32': ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège'],
    '+33': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'],
    '+34': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza'],
    '+36': ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs'],
    '+39': ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo'],
    '+40': ['Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța'],
    '+41': ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne'],
    '+43': ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck'],
    '+44': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool'],
    '+45': ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg'],
    '+46': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås'],
    '+47': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Bærum'],
    '+48': ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań'],
    '+49': ['Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt'],
    '+51': ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura'],
    '+52': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana'],
    '+53': ['Havana', 'Santiago de Cuba', 'Camagüey', 'Holguín', 'Santa Clara'],
    '+54': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata'],
    '+55': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'],
    '+56': ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta'],
    '+57': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'],
    '+58': ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay'],
    '+60': ['Kuala Lumpur', 'George Town', 'Ipoh', 'Shah Alam', 'Petaling Jaya'],
    '+61': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
    '+62': ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'],
    '+63': ['Manila', 'Quezon City', 'Caloocan', 'Davao City', 'Cebu City'],
    '+64': ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga'],
    '+65': ['Singapore'],
    '+66': ['Bangkok', 'Nonthaburi', 'Nakhon Ratchasima', 'Chiang Mai', 'Hat Yai'],
    '+81': ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo'],
    '+82': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon'],
    '+84': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho'],
    '+86': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu'],
    '+90': ['Istanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'],
    '+91': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'],
    '+92': ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan'],
    '+93': ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Kunduz'],
    '+94': ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo'],
    '+95': ['Yangon', 'Mandalay', 'Naypyidaw', 'Bago', 'Mawlamyine'],
    '+98': ['Tehran', 'Mashhad', 'Isfahan', 'Karaj', 'Shiraz'],
    '+234': ['Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt'],
    '+971': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman'],
    '+966': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam'],
  };

  const countries: Record<string, string> = {
    '+1': 'United States',
    '+7': 'Russia',
    '+20': 'Egypt',
    '+27': 'South Africa',
    '+30': 'Greece',
    '+31': 'Netherlands',
    '+32': 'Belgium',
    '+33': 'France',
    '+34': 'Spain',
    '+36': 'Hungary',
    '+39': 'Italy',
    '+40': 'Romania',
    '+41': 'Switzerland',
    '+43': 'Austria',
    '+44': 'United Kingdom',
    '+45': 'Denmark',
    '+46': 'Sweden',
    '+47': 'Norway',
    '+48': 'Poland',
    '+49': 'Germany',
    '+51': 'Peru',
    '+52': 'Mexico',
    '+53': 'Cuba',
    '+54': 'Argentina',
    '+55': 'Brazil',
    '+56': 'Chile',
    '+57': 'Colombia',
    '+58': 'Venezuela',
    '+60': 'Malaysia',
    '+61': 'Australia',
    '+62': 'Indonesia',
    '+63': 'Philippines',
    '+64': 'New Zealand',
    '+65': 'Singapore',
    '+66': 'Thailand',
    '+81': 'Japan',
    '+82': 'South Korea',
    '+84': 'Vietnam',
    '+86': 'China',
    '+90': 'Turkey',
    '+91': 'India',
    '+92': 'Pakistan',
    '+93': 'Afghanistan',
    '+94': 'Sri Lanka',
    '+95': 'Myanmar',
    '+98': 'Iran',
    '+234': 'Nigeria',
    '+971': 'United Arab Emirates',
    '+966': 'Saudi Arabia',
  };

  const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
  const streetNumber = Math.floor(Math.random() * 9999) + 1;
  const unitTypes = ['Apt', 'Unit', 'Suite', 'Apt', ''];
  const unitType = unitTypes[Math.floor(Math.random() * unitTypes.length)];
  const unitNumber = unitType ? Math.floor(Math.random() * 500) + 1 : null;

  const cities = cityNames[phoneCode] || ['City'];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const country = countries[phoneCode] || 'Country';

  const homeAddressNumber = unitNumber ? `${streetNumber}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}, ${unitType} ${unitNumber}` : `${streetNumber}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
  const homeAddress = `${streetName}, ${city}, ${country}`;

  return { homeAddressNumber, homeAddress };
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const {
      cardName,
      referralCode,
      initialAmount,
    } = await request.json();

    // Card type and brand are always fixed
    const cardType = 'physical';
    const cardBrand = 'visa';

    // Generate random date of birth (at least 25 years old)
    const today = new Date();
    const minAge = 25;
    const maxAge = 65; // Random age between 25 and 65
    const randomAge = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
    const birthYear = today.getFullYear() - randomAge;
    const randomMonth = Math.floor(Math.random() * 12) + 1; // 1-12
    const daysInMonth = new Date(birthYear, randomMonth, 0).getDate();
    const randomDay = Math.floor(Math.random() * daysInMonth) + 1; // 1-daysInMonth
    const dateOfBirth = `${birthYear}-${String(randomMonth).padStart(2, '0')}-${String(randomDay).padStart(2, '0')}`;

    // Generate random country code, phone number, and address
    const phoneCode = getRandomCountryCode();
    const phoneNumber = generatePhoneNumber(phoneCode);
    const { homeAddressNumber, homeAddress } = generateAddress(phoneCode);

    // Validation
    if (!cardName) {
      return NextResponse.json(
        { success: false, message: 'Card name is required' },
        { status: 400 }
      );
    }

    if (!initialAmount || initialAmount < 15) {
      return NextResponse.json(
        { success: false, message: 'Initial amount must be at least $15' },
        { status: 400 }
      );
    }

    // Check if user has less than 4 cards
    const { count } = await supabaseAdmin
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.userId);

    if (count && count >= 4) {
      return NextResponse.json(
        { success: false, message: 'Maximum 4 cards allowed per user' },
        { status: 400 }
      );
    }

    // Get user details
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('first_name, last_name, email, eth_deposit_address')
      .eq('id', user.userId)
      .single();

    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's Radix wallet (internal, stored in Supabase)
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('radix_wallet_address, radix_private_key')
      .eq('user_id', user.userId)
      .single();

    if (!wallet) {
      return NextResponse.json(
        { success: false, message: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Find unused ETH address from previous cancelled card creations, or create new one
    const { data: unusedCard } = await supabaseAdmin
      .from('cards')
      .select('card_wallet_address')
      .eq('user_id', user.userId)
      .eq('status', 'processing')
      .is('card_code', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let ethAddress: string;

    if (unusedCard?.card_wallet_address) {
      // Reuse unused ETH address from cancelled card creation
      ethAddress = unusedCard.card_wallet_address;
    } else {
      // Create new ETH address for this card
      const cryptoAddressResponse = await callCashwyreAPI('/CustomerCryptoAddress/createCryptoAddress', {
        requestId: generateRequestId(),
        FirstName: userData.first_name,
        LastName: userData.last_name,
        Email: userData.email,
        AssetType: 'ETH',
        Network: 'USDC',
        Amount: 0.0001,
      });

      ethAddress = cryptoAddressResponse.data.address;
    }

    // Charge: $10 insurance + user's initial amount to card
    const INSURANCE_FEE = 10;
    const CARD_AMOUNT = initialAmount; // Amount user wants to fund the card with
    const TOTAL_AMOUNT = INSURANCE_FEE + CARD_AMOUNT;

    // Check USDC balance
    const usdcBalance = await getUSDCBalance(wallet.radix_wallet_address);
    if (usdcBalance < TOTAL_AMOUNT) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient USDC balance. You need $${TOTAL_AMOUNT} USDC ($${INSURANCE_FEE} insurance + $${CARD_AMOUNT} to card). You have $${usdcBalance.toFixed(
            2,
          )} USDC`,
        },
        { status: 400 },
      );
    }

    // Check XRD balance for bridge transaction (needs ~410 XRD)
    const xrdBridgeCheck = await checkXRDForBridge(wallet.radix_wallet_address);
    if (!xrdBridgeCheck.hasEnough) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient XRD for bridge transaction. You need roughly 410 XRD for Ethereum tx cost and bridge fee. Current: ${xrdBridgeCheck.balance.toFixed(
            2,
          )} XRD`,
        },
        { status: 400 },
      );
    }

    // Get insurance wallet address
    const insuranceWalletAddress = process.env.CASHBACK_WALLET_ADDRESS!;
    if (!insuranceWalletAddress) {
      return NextResponse.json(
        { success: false, message: 'Insurance wallet not configured' },
        { status: 500 },
      );
    }

    // Decrypt private key
    const privateKey = decrypt(wallet.radix_private_key);

    // Step 1: Send $10 USDC to insurance wallet
    const insuranceManifest = await buildTransferManifest(
      wallet.radix_wallet_address,
      insuranceWalletAddress,
      INSURANCE_FEE,
    );
    const insuranceHash = await signAndSubmitManifest(insuranceManifest, privateKey);

    // Store form data for webhook use
    const formData = {
      phoneCode,
      phoneNumber,
      dateOfBirth,
      homeAddressNumber,
      homeAddress,
      cardName,
      cardType,
      cardBrand,
      initialAmount,
    };

    // Create pending card record
    const { data: card, error: cardError } = await supabaseAdmin
      .from('cards')
      .insert({
        user_id: user.userId,
        card_wallet_address: ethAddress,
        card_name: cardName,
        card_type: cardType,
        card_brand: cardBrand,
        status: 'processing',
        form_data: formData, // Store form data for webhook
      })
      .select()
      .single();

    if (cardError || !card) {
      console.error('Error creating card record:', cardError);
      return NextResponse.json(
        { success: false, message: 'Failed to create card' },
        { status: 500 },
      );
    }

    // Step 2: Bridge the amount user wants to fund the card with (from Radix to ETH)
    const bridgeQuote = await getBridgeQuote(CARD_AMOUNT, wallet.radix_wallet_address, ethAddress);
    const bridgeManifest = bridgeQuote.route.tx.manifest;

    // Sign and submit bridge transaction
    const bridgeHash = await signAndSubmitManifest(bridgeManifest, privateKey);

    // Store transactions
    await supabaseAdmin.from('transactions').insert([
      {
        user_id: user.userId,
        card_id: card.id,
        type: 'insurance_fee',
        amount: INSURANCE_FEE,
        status: 'success',
        hash: insuranceHash,
        recipient_address: insuranceWalletAddress,
        sender_address: wallet.radix_wallet_address,
        description: 'Card creation insurance fee ($10 USDC to team wallet)',
      },
      {
        user_id: user.userId,
        card_id: card.id,
        type: 'bridge',
        amount: CARD_AMOUNT,
        status: 'pending',
        hash: bridgeHash,
        description: 'Bridging funds to card wallet',
      },
    ]);

    // Process referral if provided
    if (referralCode) {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('referral_code', referralCode.toLowerCase())
        .single();

      if (referrer) {
        const referrerId = referrer.id === user.userId ? user.userId : referrer.id;
        const earnings = 0.5;

        await supabaseAdmin.from('referrals').insert({
          referrer_id: referrerId,
          referred_id: user.userId,
          referral_code: referralCode.toLowerCase(),
          card_id: card.id,
          earnings,
          status: 'pending',
        });

        // Update earnings
        await supabaseAdmin.rpc('increment_earnings', {
          user_id: referrerId,
          amount: earnings,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Card creation initiated. Processing...',
      cardId: card.id,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }
    console.error('Error in create card:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}


