# normalise.py
# Advanced security (section 2.8): detection evasion.
# A phisher can swap letters for ones that LOOK the same but are different characters,
# for example a Cyrillic "а" instead of a normal "a" in "pаypal". A person sees "paypal",
# but our model sees a different word, so the brand check and the suspicious-word check miss it.
# This file turns those look-alike letters back into normal letters BEFORE the model sees the link.

import unicodedata

# Look-alike letters from other alphabets that phishers use most, and the normal letter they copy.
# Cyrillic, Greek and Armenian letters plus a few Latin "special" letters.
LOOKALIKES = {
    # Cyrillic
    "а": "a", "в": "b", "е": "e", "ё": "e", "һ": "h", "і": "i", "ї": "i", "ј": "j", "к": "k",
    "ӏ": "l", "м": "m", "н": "h", "о": "o", "р": "p", "с": "c", "ԛ": "q", "ѕ": "s", "т": "t",
    "у": "y", "ԝ": "w", "х": "x", "ԁ": "d", "ɡ": "g", "ү": "y", "ь": "b", "п": "n",
    # Greek
    "α": "a", "β": "b", "ε": "e", "η": "n", "ι": "i", "κ": "k", "ν": "v", "ο": "o", "ρ": "p",
    "τ": "t", "υ": "u", "χ": "x", "ω": "w", "γ": "y",
    # Armenian
    "օ": "o", "ս": "u", "հ": "h", "ց": "g", "զ": "q", "ո": "n",
    # Latin letters that look like plain ones
    "ı": "i", "ȷ": "j", "ɑ": "a", "ɩ": "i", "ʟ": "l", "ɴ": "n", "ʀ": "r",
}


def normalise_url(url):
    # 1. remove invisible characters, like the zero-width space (Unicode group "Cf")
    url = "".join(ch for ch in url if unicodedata.category(ch) != "Cf")
    # 2. NFKC turns "wide" and fancy letters into normal ones, e.g. "ｐａｙｐａｌ" -> "paypal"
    url = unicodedata.normalize("NFKC", url)
    # 3. lower case, then swap look-alike letters from other alphabets for the normal letter
    url = url.lower()
    url = "".join(LOOKALIKES.get(ch, ch) for ch in url)
    # 4. remove accents, e.g. "pаypаl" with a dot on top -> "paypal"
    url = unicodedata.normalize("NFKD", url)
    url = "".join(ch for ch in url if not unicodedata.combining(ch))
    return url


def has_unusual_characters(url):
    # True if the link has any character outside normal keyboard text
    return any(ord(ch) > 127 for ch in url)