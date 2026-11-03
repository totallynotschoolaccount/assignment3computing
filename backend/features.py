# features.py
# This file turns a URL into numbers (features) so the model can use it.
# We use the same file in the notebooks and in predict.py.

import re

# words that phishing links use a lot
SUSPICIOUS_WORDS = ["login", "signin", "verify", "account", "update", "secure",
                    "banking", "confirm", "password", "webscr", "ebayisapi", "wp-admin"]

# brands that scammers like to copy
BRANDS = ["paypal", "apple", "microsoft", "amazon", "google", "facebook", "ebay",
          "netflix", "outlook", "office365", "dropbox", "instagram", "whatsapp",
          "auspost", "commbank", "westpac", "mygov", "telstra"]

# fake spellings of brands (0 instead of o, 1 instead of l)
LOOKALIKES = ["paypa1", "pay-pal", "g00gle", "goog1e", "micros0ft", "app1e",
              "amaz0n", "faceb00k", "netfl1x", "rnicrosoft", "arnazon"]

# cheap domain endings that are used a lot for scams
SUSPICIOUS_TLDS = ["tk", "ml", "ga", "cf", "gq", "xyz", "top", "work", "click",
                   "link", "info", "ru", "cn", "zip", "live", "online", "site"]

# link shortener websites
SHORTENERS = ["bit.ly", "goo.gl", "tinyurl.com", "ow.ly", "t.co", "is.gd",
              "buff.ly", "adf.ly", "bitly.com", "cutt.ly", "rb.gy"]

# pattern for an IP address like 192.168.1.1
IP_PATTERN = re.compile(r"^\d{1,3}(\.\d{1,3}){3}$")


def clean_url(url):
    # make it lowercase, remove http://, https://, www. and the / at the end
    url = str(url).strip().lower()
    for start in ["https://", "http://"]:
        if url.startswith(start):
            url = url[len(start):]
    if url.startswith("www."):
        url = url[4:]
    url = url.rstrip("/")
    return url


def split_url(url):
    # split the URL into the website name (host) and the rest (path)
    host = re.split(r"[/?#]", url, maxsplit=1)[0]
    path = url[len(host):]
    host = host.split("@")[-1]
    host = host.split(":")[0]
    return host, path


def extract_features(url):
    url = clean_url(url)
    host, path = split_url(url)
    host_parts = host.split(".")
    tld = host_parts[-1] if len(host_parts) > 1 else ""
    main_domain = ".".join(host_parts[-2:])
    # for endings like .com.au or .co.uk the main domain has 3 parts
    if len(host_parts) >= 3 and len(tld) == 2 and host_parts[-2] in ["com", "net", "org", "gov", "edu", "co", "ac"]:
        main_domain = ".".join(host_parts[-3:])
    digits = sum(c.isdigit() for c in url)

    return {
        # length of the URL and its parts
        "url_length": len(url),
        "host_length": len(host),
        "path_length": len(path),

        # counting symbols
        "num_dots": url.count("."),
        "num_hyphens": url.count("-"),
        "num_slashes": path.count("/"),
        "num_subdomains": max(len(host_parts) - 2, 0),
        "num_params": url.count("=") + url.count("&"),
        "num_digits": digits,
        "digit_ratio": round(digits / len(url), 4) if len(url) > 0 else 0,

        # tricks in the website name (1 = yes, 0 = no)
        "has_ip": int(bool(IP_PATTERN.match(host))),
        "has_at": int("@" in url),
        "has_punycode": int("xn--" in host),
        "suspicious_tld": int(tld in SUSPICIOUS_TLDS),
        "is_shortener": int(host in SHORTENERS),

        # words and brands
        "suspicious_words": sum(w in url for w in SUSPICIOUS_WORDS),
        "brand_not_in_domain": int(any(b in url for b in BRANDS)
                                   and not any(b in main_domain for b in BRANDS)),
        "lookalike_brand": int(any(w in url for w in LOOKALIKES)),

        # download files like .exe or .apk
        "has_exe": int(bool(re.search(r"\.(exe|apk|scr|zip|rar|bin)(\?|$)", path))),

        # URL is only a domain with nothing after it
        "no_path": int(path in ["", "/"]),
    }


# list of all feature names
FEATURE_NAMES = list(extract_features("example.com").keys())