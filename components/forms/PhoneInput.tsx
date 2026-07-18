'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import {
  AsYouType,
  getCountryCallingCode,
  parsePhoneNumber,
  type CountryCode,
} from "libphonenumber-js";

interface Country {
  code: CountryCode;
  name: string;
  dial: string;
  flag: string;
}

const PRIORITY_COUNTRIES: Country[] = [
  { code: "US", name: "United States", dial: "+1", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "CA", name: "Canada", dial: "+1", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "GH", name: "Ghana", dial: "+233", flag: "\u{1F1EC}\u{1F1ED}" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "\u{1F1F3}\u{1F1EC}" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "\u{1F1FF}\u{1F1E6}" },
];

const OTHER_COUNTRIES: Country[] = [
  { code: "AF", name: "Afghanistan", dial: "+93", flag: "\u{1F1E6}\u{1F1EB}" },
  { code: "AL", name: "Albania", dial: "+355", flag: "\u{1F1E6}\u{1F1F1}" },
  { code: "DZ", name: "Algeria", dial: "+213", flag: "\u{1F1E9}\u{1F1FF}" },
  { code: "AD", name: "Andorra", dial: "+376", flag: "\u{1F1E6}\u{1F1E9}" },
  { code: "AO", name: "Angola", dial: "+244", flag: "\u{1F1E6}\u{1F1F4}" },
  { code: "AG", name: "Antigua & Barbuda", dial: "+1", flag: "\u{1F1E6}\u{1F1EC}" },
  { code: "AR", name: "Argentina", dial: "+54", flag: "\u{1F1E6}\u{1F1F7}" },
  { code: "AM", name: "Armenia", dial: "+374", flag: "\u{1F1E6}\u{1F1F2}" },
  { code: "AU", name: "Australia", dial: "+61", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "AT", name: "Austria", dial: "+43", flag: "\u{1F1E6}\u{1F1F9}" },
  { code: "AZ", name: "Azerbaijan", dial: "+994", flag: "\u{1F1E6}\u{1F1FF}" },
  { code: "BS", name: "Bahamas", dial: "+1", flag: "\u{1F1E7}\u{1F1F8}" },
  { code: "BH", name: "Bahrain", dial: "+973", flag: "\u{1F1E7}\u{1F1ED}" },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "\u{1F1E7}\u{1F1E9}" },
  { code: "BB", name: "Barbados", dial: "+1", flag: "\u{1F1E7}\u{1F1E7}" },
  { code: "BY", name: "Belarus", dial: "+375", flag: "\u{1F1E7}\u{1F1FE}" },
  { code: "BE", name: "Belgium", dial: "+32", flag: "\u{1F1E7}\u{1F1EA}" },
  { code: "BZ", name: "Belize", dial: "+501", flag: "\u{1F1E7}\u{1F1FF}" },
  { code: "BJ", name: "Benin", dial: "+229", flag: "\u{1F1E7}\u{1F1EF}" },
  { code: "BT", name: "Bhutan", dial: "+975", flag: "\u{1F1E7}\u{1F1F9}" },
  { code: "BO", name: "Bolivia", dial: "+591", flag: "\u{1F1E7}\u{1F1F4}" },
  { code: "BA", name: "Bosnia & Herzegovina", dial: "+387", flag: "\u{1F1E7}\u{1F1E6}" },
  { code: "BW", name: "Botswana", dial: "+267", flag: "\u{1F1E7}\u{1F1FC}" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "BN", name: "Brunei", dial: "+673", flag: "\u{1F1E7}\u{1F1F3}" },
  { code: "BG", name: "Bulgaria", dial: "+359", flag: "\u{1F1E7}\u{1F1EC}" },
  { code: "BF", name: "Burkina Faso", dial: "+226", flag: "\u{1F1E7}\u{1F1EB}" },
  { code: "BI", name: "Burundi", dial: "+257", flag: "\u{1F1E7}\u{1F1EE}" },
  { code: "KH", name: "Cambodia", dial: "+855", flag: "\u{1F1F0}\u{1F1ED}" },
  { code: "CM", name: "Cameroon", dial: "+237", flag: "\u{1F1E8}\u{1F1F2}" },
  { code: "CV", name: "Cape Verde", dial: "+238", flag: "\u{1F1E8}\u{1F1FB}" },
  { code: "CF", name: "Central African Republic", dial: "+236", flag: "\u{1F1E8}\u{1F1EB}" },
  { code: "TD", name: "Chad", dial: "+235", flag: "\u{1F1F9}\u{1F1E9}" },
  { code: "CL", name: "Chile", dial: "+56", flag: "\u{1F1E8}\u{1F1F1}" },
  { code: "CN", name: "China", dial: "+86", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "CO", name: "Colombia", dial: "+57", flag: "\u{1F1E8}\u{1F1F4}" },
  { code: "KM", name: "Comoros", dial: "+269", flag: "\u{1F1F0}\u{1F1F2}" },
  { code: "CG", name: "Congo - Brazzaville", dial: "+242", flag: "\u{1F1E8}\u{1F1EC}" },
  { code: "CD", name: "Congo - Kinshasa", dial: "+243", flag: "\u{1F1E8}\u{1F1E9}" },
  { code: "CR", name: "Costa Rica", dial: "+506", flag: "\u{1F1E8}\u{1F1F7}" },
  { code: "CI", name: "Ivory Coast", dial: "+225", flag: "\u{1F1E8}\u{1F1EE}" },
  { code: "HR", name: "Croatia", dial: "+385", flag: "\u{1F1ED}\u{1F1F7}" },
  { code: "CU", name: "Cuba", dial: "+53", flag: "\u{1F1E8}\u{1F1FA}" },
  { code: "CY", name: "Cyprus", dial: "+357", flag: "\u{1F1E8}\u{1F1FE}" },
  { code: "CZ", name: "Czech Republic", dial: "+420", flag: "\u{1F1E8}\u{1F1FF}" },
  { code: "DK", name: "Denmark", dial: "+45", flag: "\u{1F1E9}\u{1F1F0}" },
  { code: "DJ", name: "Djibouti", dial: "+253", flag: "\u{1F1E9}\u{1F1EF}" },
  { code: "DM", name: "Dominica", dial: "+1", flag: "\u{1F1E9}\u{1F1F2}" },
  { code: "DO", name: "Dominican Republic", dial: "+1", flag: "\u{1F1E9}\u{1F1F4}" },
  { code: "EC", name: "Ecuador", dial: "+593", flag: "\u{1F1EA}\u{1F1E8}" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "\u{1F1EA}\u{1F1EC}" },
  { code: "SV", name: "El Salvador", dial: "+503", flag: "\u{1F1F8}\u{1F1FB}" },
  { code: "GQ", name: "Equatorial Guinea", dial: "+240", flag: "\u{1F1EC}\u{1F1F6}" },
  { code: "ER", name: "Eritrea", dial: "+291", flag: "\u{1F1EA}\u{1F1F7}" },
  { code: "EE", name: "Estonia", dial: "+372", flag: "\u{1F1EA}\u{1F1EA}" },
  { code: "SZ", name: "Eswatini", dial: "+268", flag: "\u{1F1F8}\u{1F1FF}" },
  { code: "ET", name: "Ethiopia", dial: "+251", flag: "\u{1F1EA}\u{1F1F9}" },
  { code: "FJ", name: "Fiji", dial: "+679", flag: "\u{1F1EB}\u{1F1EF}" },
  { code: "FI", name: "Finland", dial: "+358", flag: "\u{1F1EB}\u{1F1EE}" },
  { code: "FR", name: "France", dial: "+33", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "GA", name: "Gabon", dial: "+241", flag: "\u{1F1EC}\u{1F1E6}" },
  { code: "GM", name: "Gambia", dial: "+220", flag: "\u{1F1EC}\u{1F1F2}" },
  { code: "GE", name: "Georgia", dial: "+995", flag: "\u{1F1EC}\u{1F1EA}" },
  { code: "DE", name: "Germany", dial: "+49", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "GR", name: "Greece", dial: "+30", flag: "\u{1F1EC}\u{1F1F7}" },
  { code: "GD", name: "Grenada", dial: "+1", flag: "\u{1F1EC}\u{1F1E9}" },
  { code: "GT", name: "Guatemala", dial: "+502", flag: "\u{1F1EC}\u{1F1F9}" },
  { code: "GN", name: "Guinea", dial: "+224", flag: "\u{1F1EC}\u{1F1F3}" },
  { code: "GW", name: "Guinea-Bissau", dial: "+245", flag: "\u{1F1EC}\u{1F1FC}" },
  { code: "GY", name: "Guyana", dial: "+592", flag: "\u{1F1EC}\u{1F1FE}" },
  { code: "HT", name: "Haiti", dial: "+509", flag: "\u{1F1ED}\u{1F1F9}" },
  { code: "HN", name: "Honduras", dial: "+504", flag: "\u{1F1ED}\u{1F1F3}" },
  { code: "HK", name: "Hong Kong", dial: "+852", flag: "\u{1F1ED}\u{1F1F0}" },
  { code: "HU", name: "Hungary", dial: "+36", flag: "\u{1F1ED}\u{1F1FA}" },
  { code: "IS", name: "Iceland", dial: "+354", flag: "\u{1F1EE}\u{1F1F8}" },
  { code: "IN", name: "India", dial: "+91", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "ID", name: "Indonesia", dial: "+62", flag: "\u{1F1EE}\u{1F1E9}" },
  { code: "IR", name: "Iran", dial: "+98", flag: "\u{1F1EE}\u{1F1F7}" },
  { code: "IQ", name: "Iraq", dial: "+964", flag: "\u{1F1EE}\u{1F1F6}" },
  { code: "IE", name: "Ireland", dial: "+353", flag: "\u{1F1EE}\u{1F1EA}" },
  { code: "IL", name: "Israel", dial: "+972", flag: "\u{1F1EE}\u{1F1F1}" },
  { code: "IT", name: "Italy", dial: "+39", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "JM", name: "Jamaica", dial: "+1", flag: "\u{1F1EF}\u{1F1F2}" },
  { code: "JP", name: "Japan", dial: "+81", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "JO", name: "Jordan", dial: "+962", flag: "\u{1F1EF}\u{1F1F4}" },
  { code: "KZ", name: "Kazakhstan", dial: "+7", flag: "\u{1F1F0}\u{1F1FF}" },
  { code: "KE", name: "Kenya", dial: "+254", flag: "\u{1F1F0}\u{1F1EA}" },
  { code: "KW", name: "Kuwait", dial: "+965", flag: "\u{1F1F0}\u{1F1FC}" },
  { code: "KG", name: "Kyrgyzstan", dial: "+996", flag: "\u{1F1F0}\u{1F1EC}" },
  { code: "LA", name: "Laos", dial: "+856", flag: "\u{1F1F1}\u{1F1E6}" },
  { code: "LV", name: "Latvia", dial: "+371", flag: "\u{1F1F1}\u{1F1FB}" },
  { code: "LB", name: "Lebanon", dial: "+961", flag: "\u{1F1F1}\u{1F1E7}" },
  { code: "LS", name: "Lesotho", dial: "+266", flag: "\u{1F1F1}\u{1F1F8}" },
  { code: "LR", name: "Liberia", dial: "+231", flag: "\u{1F1F1}\u{1F1F7}" },
  { code: "LY", name: "Libya", dial: "+218", flag: "\u{1F1F1}\u{1F1FE}" },
  { code: "LI", name: "Liechtenstein", dial: "+423", flag: "\u{1F1F1}\u{1F1EE}" },
  { code: "LT", name: "Lithuania", dial: "+370", flag: "\u{1F1F1}\u{1F1F9}" },
  { code: "LU", name: "Luxembourg", dial: "+352", flag: "\u{1F1F1}\u{1F1FA}" },
  { code: "MG", name: "Madagascar", dial: "+261", flag: "\u{1F1F2}\u{1F1EC}" },
  { code: "MW", name: "Malawi", dial: "+265", flag: "\u{1F1F2}\u{1F1FC}" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "\u{1F1F2}\u{1F1FE}" },
  { code: "MV", name: "Maldives", dial: "+960", flag: "\u{1F1F2}\u{1F1FB}" },
  { code: "ML", name: "Mali", dial: "+223", flag: "\u{1F1F2}\u{1F1F1}" },
  { code: "MT", name: "Malta", dial: "+356", flag: "\u{1F1F2}\u{1F1F9}" },
  { code: "MR", name: "Mauritania", dial: "+222", flag: "\u{1F1F2}\u{1F1F7}" },
  { code: "MU", name: "Mauritius", dial: "+230", flag: "\u{1F1F2}\u{1F1FA}" },
  { code: "MX", name: "Mexico", dial: "+52", flag: "\u{1F1F2}\u{1F1FD}" },
  { code: "MD", name: "Moldova", dial: "+373", flag: "\u{1F1F2}\u{1F1E9}" },
  { code: "MC", name: "Monaco", dial: "+377", flag: "\u{1F1F2}\u{1F1E8}" },
  { code: "MN", name: "Mongolia", dial: "+976", flag: "\u{1F1F2}\u{1F1F3}" },
  { code: "ME", name: "Montenegro", dial: "+382", flag: "\u{1F1F2}\u{1F1EA}" },
  { code: "MA", name: "Morocco", dial: "+212", flag: "\u{1F1F2}\u{1F1E6}" },
  { code: "MZ", name: "Mozambique", dial: "+258", flag: "\u{1F1F2}\u{1F1FF}" },
  { code: "MM", name: "Myanmar", dial: "+95", flag: "\u{1F1F2}\u{1F1F2}" },
  { code: "NA", name: "Namibia", dial: "+264", flag: "\u{1F1F3}\u{1F1E6}" },
  { code: "NP", name: "Nepal", dial: "+977", flag: "\u{1F1F3}\u{1F1F5}" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "NZ", name: "New Zealand", dial: "+64", flag: "\u{1F1F3}\u{1F1FF}" },
  { code: "NI", name: "Nicaragua", dial: "+505", flag: "\u{1F1F3}\u{1F1EE}" },
  { code: "NE", name: "Niger", dial: "+227", flag: "\u{1F1F3}\u{1F1EA}" },
  { code: "KP", name: "North Korea", dial: "+850", flag: "\u{1F1F0}\u{1F1F5}" },
  { code: "MK", name: "North Macedonia", dial: "+389", flag: "\u{1F1F2}\u{1F1F0}" },
  { code: "NO", name: "Norway", dial: "+47", flag: "\u{1F1F3}\u{1F1F4}" },
  { code: "OM", name: "Oman", dial: "+968", flag: "\u{1F1F4}\u{1F1F2}" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "\u{1F1F5}\u{1F1F0}" },
  { code: "PA", name: "Panama", dial: "+507", flag: "\u{1F1F5}\u{1F1E6}" },
  { code: "PG", name: "Papua New Guinea", dial: "+675", flag: "\u{1F1F5}\u{1F1EC}" },
  { code: "PY", name: "Paraguay", dial: "+595", flag: "\u{1F1F5}\u{1F1FE}" },
  { code: "PE", name: "Peru", dial: "+51", flag: "\u{1F1F5}\u{1F1EA}" },
  { code: "PH", name: "Philippines", dial: "+63", flag: "\u{1F1F5}\u{1F1ED}" },
  { code: "PL", name: "Poland", dial: "+48", flag: "\u{1F1F5}\u{1F1F1}" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "QA", name: "Qatar", dial: "+974", flag: "\u{1F1F6}\u{1F1E6}" },
  { code: "RO", name: "Romania", dial: "+40", flag: "\u{1F1F7}\u{1F1F4}" },
  { code: "RU", name: "Russia", dial: "+7", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "RW", name: "Rwanda", dial: "+250", flag: "\u{1F1F7}\u{1F1FC}" },
  { code: "KN", name: "Saint Kitts & Nevis", dial: "+1", flag: "\u{1F1F0}\u{1F1F3}" },
  { code: "LC", name: "Saint Lucia", dial: "+1", flag: "\u{1F1F1}\u{1F1E8}" },
  { code: "VC", name: "Saint Vincent", dial: "+1", flag: "\u{1F1FB}\u{1F1E8}" },
  { code: "WS", name: "Samoa", dial: "+685", flag: "\u{1F1FC}\u{1F1F8}" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "SN", name: "Senegal", dial: "+221", flag: "\u{1F1F8}\u{1F1F3}" },
  { code: "RS", name: "Serbia", dial: "+381", flag: "\u{1F1F7}\u{1F1F8}" },
  { code: "SL", name: "Sierra Leone", dial: "+232", flag: "\u{1F1F8}\u{1F1F1}" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "\u{1F1F8}\u{1F1EC}" },
  { code: "SK", name: "Slovakia", dial: "+421", flag: "\u{1F1F8}\u{1F1F0}" },
  { code: "SI", name: "Slovenia", dial: "+386", flag: "\u{1F1F8}\u{1F1EE}" },
  { code: "SO", name: "Somalia", dial: "+252", flag: "\u{1F1F8}\u{1F1F4}" },
  { code: "KR", name: "South Korea", dial: "+82", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "SS", name: "South Sudan", dial: "+211", flag: "\u{1F1F8}\u{1F1F8}" },
  { code: "ES", name: "Spain", dial: "+34", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "\u{1F1F1}\u{1F1F0}" },
  { code: "SD", name: "Sudan", dial: "+249", flag: "\u{1F1F8}\u{1F1E9}" },
  { code: "SR", name: "Suriname", dial: "+597", flag: "\u{1F1F8}\u{1F1F7}" },
  { code: "SE", name: "Sweden", dial: "+46", flag: "\u{1F1F8}\u{1F1EA}" },
  { code: "CH", name: "Switzerland", dial: "+41", flag: "\u{1F1E8}\u{1F1ED}" },
  { code: "TW", name: "Taiwan", dial: "+886", flag: "\u{1F1F9}\u{1F1FC}" },
  { code: "TJ", name: "Tajikistan", dial: "+992", flag: "\u{1F1F9}\u{1F1EF}" },
  { code: "TZ", name: "Tanzania", dial: "+255", flag: "\u{1F1F9}\u{1F1FF}" },
  { code: "TH", name: "Thailand", dial: "+66", flag: "\u{1F1F9}\u{1F1ED}" },
  { code: "TL", name: "Timor-Leste", dial: "+670", flag: "\u{1F1F9}\u{1F1F1}" },
  { code: "TG", name: "Togo", dial: "+228", flag: "\u{1F1F9}\u{1F1EC}" },
  { code: "TO", name: "Tonga", dial: "+676", flag: "\u{1F1F9}\u{1F1F4}" },
  { code: "TT", name: "Trinidad & Tobago", dial: "+1", flag: "\u{1F1F9}\u{1F1F9}" },
  { code: "TN", name: "Tunisia", dial: "+216", flag: "\u{1F1F9}\u{1F1F3}" },
  { code: "TR", name: "Turkey", dial: "+90", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "TM", name: "Turkmenistan", dial: "+993", flag: "\u{1F1F9}\u{1F1F2}" },
  { code: "UG", name: "Uganda", dial: "+256", flag: "\u{1F1FA}\u{1F1EC}" },
  { code: "UA", name: "Ukraine", dial: "+380", flag: "\u{1F1FA}\u{1F1E6}" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "UY", name: "Uruguay", dial: "+598", flag: "\u{1F1FA}\u{1F1FE}" },
  { code: "UZ", name: "Uzbekistan", dial: "+998", flag: "\u{1F1FA}\u{1F1FF}" },
  { code: "VE", name: "Venezuela", dial: "+58", flag: "\u{1F1FB}\u{1F1EA}" },
  { code: "VN", name: "Vietnam", dial: "+84", flag: "\u{1F1FB}\u{1F1F3}" },
  { code: "YE", name: "Yemen", dial: "+967", flag: "\u{1F1FE}\u{1F1EA}" },
  { code: "ZM", name: "Zambia", dial: "+260", flag: "\u{1F1FF}\u{1F1F2}" },
  { code: "ZW", name: "Zimbabwe", dial: "+263", flag: "\u{1F1FF}\u{1F1FC}" },
];

const ALL_COUNTRIES = [...PRIORITY_COUNTRIES, ...OTHER_COUNTRIES];

interface PhoneInputProps {
  value: string;
  onChange: (e164: string) => void;
  id?: string;
  error?: boolean;
}

export function PhoneInput({ value, onChange, id, error }: PhoneInputProps): React.ReactElement {
  const [country, setCountry] = useState<Country>(() => {
    if (value) {
      try {
        const parsed = parsePhoneNumber(value);
        if (parsed?.country) {
          const found = ALL_COUNTRIES.find(c => c.code === parsed.country);
          if (found) return found;
        }
      } catch { /* leave default */ }
    }
    return PRIORITY_COUNTRIES[0];
  });
  const [nationalNumber, setNationalNumber] = useState(() => {
    if (value) {
      try {
        const parsed = parsePhoneNumber(value);
        if (parsed) return parsed.formatNational();
      } catch { /* leave empty */ }
    }
    return "";
  });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  const updateE164 = useCallback((national: string, c: Country) => {
    const digits = national.replace(/\D/g, "");
    if (!digits) {
      onChange("");
      return;
    }
    const full = `+${getCountryCallingCode(c.code)}${digits}`;
    try {
      const parsed = parsePhoneNumber(full, c.code);
      if (parsed) {
        onChange(parsed.format("E.164"));
        return;
      }
    } catch {
      // fall through
    }
    onChange(full);
  }, [onChange]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const formatter = new AsYouType(country.code);
    const formatted = formatter.input(raw);
    setNationalNumber(formatted);
    updateE164(raw, country);
  }

  function selectCountry(c: Country) {
    setCountry(c);
    setOpen(false);
    setSearch("");
    updateE164(nationalNumber, c);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
  }

  const filtered = search
    ? ALL_COUNTRIES.filter(
        c => c.name.toLowerCase().includes(search.toLowerCase()) ||
             c.dial.includes(search) ||
             c.code.toLowerCase().includes(search.toLowerCase())
      )
    : ALL_COUNTRIES;

  const priorityCodes = new Set(PRIORITY_COUNTRIES.map(c => c.code));
  const filteredPriority = filtered.filter(c => priorityCodes.has(c.code));
  const filteredOther = filtered.filter(c => !priorityCodes.has(c.code));

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <div className={`flex rounded-xl border ${error ? "border-danger" : "border-border"} bg-background focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all duration-200`}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 border-r border-border text-sm shrink-0 hover:bg-surface-secondary/50 rounded-l-xl transition-colors"
          aria-label="Select country code"
          aria-expanded={open}
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="text-muted text-xs">{country.dial}</span>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-muted">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <input
          id={id}
          type="tel"
          autoComplete="tel-national"
          value={nationalNumber}
          onChange={handleInputChange}
          className="flex-1 px-3 py-3.5 text-foreground bg-transparent outline-none rounded-r-xl"
          placeholder="(555) 123-4567"
        />
      </div>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full left-0 mt-1.5 w-full max-h-64 overflow-auto rounded-xl border border-border bg-background shadow-lg"
          role="listbox"
        >
          <div className="sticky top-0 p-2 bg-background border-b border-border">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground bg-surface-secondary outline-none focus:border-accent"
              placeholder="Search countries..."
            />
          </div>
          {filteredPriority.length > 0 && (
            <>
              {filteredPriority.map(c => (
                <button
                  key={c.code}
                  type="button"
                  role="option"
                  aria-selected={c.code === country.code}
                  onClick={() => selectCountry(c)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-surface-secondary/60 transition-colors ${c.code === country.code ? "bg-accent/5 text-accent" : "text-foreground"}`}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="flex-1 text-left">{c.name}</span>
                  <span className="text-muted text-xs">{c.dial}</span>
                </button>
              ))}
              {filteredOther.length > 0 && (
                <div className="border-t border-border" />
              )}
            </>
          )}
          {filteredOther.map(c => (
            <button
              key={c.code}
              type="button"
              role="option"
              aria-selected={c.code === country.code}
              onClick={() => selectCountry(c)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-surface-secondary/60 transition-colors ${c.code === country.code ? "bg-accent/5 text-accent" : "text-foreground"}`}
            >
              <span className="text-base leading-none">{c.flag}</span>
              <span className="flex-1 text-left">{c.name}</span>
              <span className="text-muted text-xs">{c.dial}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted text-center">No countries found</p>
          )}
        </div>
      )}
    </div>
  );
}
