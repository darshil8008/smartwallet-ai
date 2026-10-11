import { Card, Merchant } from './contracts';

// Published product benefits, checked 2026-10-10. Ownership and prior spending are user assumptions.
// This curated catalog is intentional: the deployed GET catalog still contains synthetic products.
export const WALLET_CARDS: Card[] = [
  {
    "id": "amex-blue-cash-everyday",
    "name": "Blue Cash Everyday",
    "issuer": "American Express",
    "network": "AMEX",
    "last4": "",
    "accent": "#268BC9",
    "surface": "#DDEFFC",
    "ink": "#173D67",
    "terms_label": "3% at U.S. supermarkets and gas stations, each up to $6,000/year, then 1%; 1% on other purchases.",
    "exclusions": [
      "Superstores and warehouse clubs do not qualify as supermarkets.",
      "Online-retail and statement-credit benefits are outside this purchase comparison."
    ],
    "base_rate": 0.01,
    "bonus_rules": [
      {
        "category": "groceries",
        "rate": 0.03,
        "cap_amount": 6000,
        "spent_to_date": 0,
        "period": "calendar year"
      },
      {
        "category": "gas",
        "rate": 0.03,
        "cap_amount": 6000,
        "spent_to_date": 0,
        "period": "calendar year"
      }
    ],
    "source_url": "https://www.americanexpress.com/us/credit-cards/card/blue-cash-everyday/"
  },
  {
    "id": "chase-freedom-unlimited",
    "name": "Freedom Unlimited",
    "issuer": "Chase",
    "network": "VISA",
    "last4": "",
    "accent": "#337EBD",
    "surface": "#163D68",
    "ink": "#FFFFFF",
    "terms_label": "3% on dining and drugstores; 1.5% on other direct purchases.",
    "exclusions": [
      "5% Chase Travel bookings require the issuer portal and are not modeled as ordinary merchant purchases."
    ],
    "base_rate": 0.015,
    "bonus_rules": [
      {
        "category": "dining",
        "rate": 0.03,
        "cap_amount": null,
        "spent_to_date": 0,
        "period": "unlimited"
      },
      {
        "category": "drugstores",
        "rate": 0.03,
        "cap_amount": null,
        "spent_to_date": 0,
        "period": "unlimited"
      }
    ],
    "source_url": "https://creditcards.chase.com/cash-back-credit-cards/freedom"
  },
  {
    "id": "capital-one-quicksilver",
    "name": "Quicksilver",
    "issuer": "Capital One",
    "network": "CASH BACK",
    "last4": "",
    "accent": "#8795A8",
    "surface": "#DDE2E8",
    "ink": "#233348",
    "terms_label": "Unlimited 1.5% cash back on ordinary purchases.",
    "exclusions": [
      "Issuer-portal travel and entertainment bonuses are outside this direct-purchase comparison."
    ],
    "base_rate": 0.015,
    "bonus_rules": [],
    "source_url": "https://www.capitalone.com/learn-grow/money-management/quicksilver-card-benefits/"
  },
  {
    "id": "citi-double-cash",
    "name": "Double Cash",
    "issuer": "Citi",
    "network": "MASTERCARD",
    "last4": "",
    "accent": "#31A3BD",
    "surface": "#064C72",
    "ink": "#FFFFFF",
    "terms_label": "2% total: 1% when buying + 1% when paying. Estimates assume the purchase is paid.",
    "exclusions": [
      "The second 1% is conditional on eligible payment; it is not earned at checkout.",
      "Issuer-portal travel bonuses are not included."
    ],
    "base_rate": 0.02,
    "bonus_rules": [],
    "source_url": "https://www.citi.com/credit-cards/citi-double-cash-credit-card"
  }
];

// Selected around 330 W 9th St, Kansas City; no live GPS or distance claims.
export const NEARBY_MERCHANTS: Merchant[] = [
  {
    "id": "cosentinos-downtown",
    "name": "Cosentino's Downtown Market",
    "category": "groceries",
    "address": "10 E 13th St",
    "kind": "Groceries",
    "source_url": "https://cosentinos.com/stores/cosentinos-downtown-market/",
    "mcc": "unverified",
    "neighborhood": "10 E 13th St / Kansas City",
    "category_status": "assumed",
    "category_source": "Published business directory; payment-network category unverified"
  },
  {
    "id": "mildreds-baltimore",
    "name": "Mildred's",
    "category": "dining",
    "address": "908 Baltimore Ave",
    "kind": "Coffee & breakfast",
    "source_url": "https://www.mildredskc.com/locations",
    "mcc": "unverified",
    "neighborhood": "908 Baltimore Ave / Kansas City",
    "category_status": "assumed",
    "category_source": "Published business directory; payment-network category unverified"
  },
  {
    "id": "milwaukee-deli",
    "name": "Milwaukee Delicatessen",
    "category": "dining",
    "address": "101 W 9th St",
    "kind": "Lunch & pizza",
    "source_url": "https://milwaukeedelikc.com/",
    "mcc": "unverified",
    "neighborhood": "101 W 9th St / Kansas City",
    "category_status": "assumed",
    "category_source": "Published business directory; payment-network category unverified"
  },
  {
    "id": "phoenix-kc",
    "name": "The Phoenix",
    "category": "dining",
    "address": "302 W 8th St",
    "kind": "Food & brunch",
    "source_url": "https://www.thephoenixkc.com/location/the-phoenix/",
    "mcc": "unverified",
    "neighborhood": "302 W 8th St / Kansas City",
    "category_status": "assumed",
    "category_source": "Published business directory; payment-network category unverified"
  },
  {
    "id": "pts-power-light",
    "name": "PT's Coffee",
    "category": "dining",
    "address": "1310 Baltimore Ave",
    "kind": "Coffee & cafe",
    "source_url": "https://ptscoffee.com/pages/pts-power-light-kansas-city-mo",
    "mcc": "unverified",
    "neighborhood": "1310 Baltimore Ave / Kansas City",
    "category_status": "assumed",
    "category_source": "Published business directory; payment-network category unverified"
  },
  {
    "id": "meshuggah-downtown",
    "name": "Meshuggah Bagels",
    "category": "dining",
    "address": "40 E 13th St",
    "kind": "Breakfast & bagels",
    "source_url": "https://www.meshuggahbagels.com/",
    "mcc": "unverified",
    "neighborhood": "40 E 13th St / Kansas City",
    "category_status": "assumed",
    "category_source": "Published business directory; payment-network category unverified"
  },
  {
    "id": "city-market-coffee",
    "name": "City Market Coffee",
    "category": "dining",
    "address": "305 Main St",
    "kind": "Coffee & cafe",
    "source_url": "https://kcrivermarket.com/explore/dine/",
    "mcc": "unverified",
    "neighborhood": "305 Main St / Kansas City",
    "category_status": "assumed",
    "category_source": "Published business directory; payment-network category unverified"
  },
  {
    "id": "turnsol-books",
    "name": "Turnsol Books",
    "category": "other",
    "address": "1664 Broadway Blvd",
    "kind": "Books & shopping",
    "source_url": "https://www.turnsolbooks.net/",
    "mcc": "unverified",
    "neighborhood": "1664 Broadway Blvd / Kansas City",
    "category_status": "assumed",
    "category_source": "Published business directory; payment-network category unverified"
  }
];
