-- Migration: V9__seed_expanded_packages.sql
-- Description: Expand package catalog to 10 unique destinations while preserving IDs 1-4

INSERT INTO packages (slug, title, destination, description, base_price, duration, cover_image, detail_image, itinerary_json, inclusions_json, available)
SELECT
    'ooty-hill-station-escape',
    'Ooty Hill Station Escape',
    'Ooty, Tamil Nadu',
    'Unwind amid mist-draped Nilgiri hills, emerald tea estates, heritage toy trains, and serene botanical gardens in the Queen of Hill Stations.',
    11499.00,
    '4 Days / 3 Nights',
    'ooty.jpg',
    'ooty.jpg',
    CAST('[
        {"day": 1, "title": "Arrival in Ooty & Lake Leisure", "details": "Scenic drive up the Nilgiri ghats, hotel check-in, evening boating at Ooty Lake and Thread Garden visit."},
        {"day": 2, "title": "Doddabetta Peak & Tea Estates", "details": "Panoramic views from Doddabetta Peak, Tea Factory & Museum tasting tour, and stroll through Government Botanical Gardens."},
        {"day": 3, "title": "Coonoor & Nilgiri Mountain Railway", "details": "Heritage toy train ride to Coonoor, Sim''s Park, Dolphin''s Nose viewpoint, and Lamb''s Rock."},
        {"day": 4, "title": "Rose Garden & Departure", "details": "Morning walk at the Government Rose Garden, local chocolate shopping, and transfer for departure."}
    ]' AS JSON),
    CAST('[
        "3 Nights stay in scenic hillside resort",
        "Daily buffet breakfast and dinner",
        "Nilgiri Toy Train experience ticket",
        "Private AC cab transfers and sightseeing"
    ]' AS JSON),
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE slug = 'ooty-hill-station-escape');

INSERT INTO packages (slug, title, destination, description, base_price, duration, cover_image, detail_image, itinerary_json, inclusions_json, available)
SELECT
    'coorg-coffee-trails',
    'Coorg Coffee Trails',
    'Coorg, Karnataka',
    'Immerse yourself in aromatic coffee plantations, cascading Abbey Falls, misty Western Ghats peaks, and tranquil Tibetan monastery heritage.',
    10999.00,
    '3 Days / 2 Nights',
    'coorg.jpg',
    'coorg.jpg',
    CAST('[
        {"day": 1, "title": "Arrival & Plantation Walk", "details": "Check-in at a lush coffee estate homestay, guided spice and coffee plantation tour, and sunset at Raja''s Seat."},
        {"day": 2, "title": "Waterfalls, Dubare & Golden Temple", "details": "Visit Abbey Falls, elephant interaction camp at Dubare, and Namdroling Monastery (Golden Temple) at Bylakuppe."},
        {"day": 3, "title": "Talacauvery & Departure", "details": "Morning trip to Talacauvery and Bhagamandala confluence, local honey and coffee shopping, and departure."}
    ]' AS JSON),
    CAST('[
        "2 Nights accommodation in boutique coffee estate",
        "Daily Coorg-style breakfast",
        "Guided coffee & spice plantation walk",
        "Private chauffeur-driven sightseeing cab"
    ]' AS JSON),
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE slug = 'coorg-coffee-trails');

INSERT INTO packages (slug, title, destination, description, base_price, duration, cover_image, detail_image, itinerary_json, inclusions_json, available)
SELECT
    'munnar-tea-garden-retreat',
    'Munnar Tea Garden Retreat',
    'Munnar, Kerala',
    'Wake up above clouds surrounded by rolling velvety tea slopes, crystal waterfalls, wildlife sanctuaries, and cool Western Ghats breezes.',
    11999.00,
    '4 Days / 3 Nights',
    'munnar.jpg',
    'munnar.jpg',
    CAST('[
        {"day": 1, "title": "Kochi to Munnar Scenic Drive", "details": "Pickup from Kochi, stop at Cheeyappara and Valara waterfalls, check-in to misty valley resort in Munnar."},
        {"day": 2, "title": "Eravikulam & Tea Museum", "details": "Spot Nilgiri Tahr at Eravikulam National Park, visit Tata Tea Museum, Mattupetty Dam, and Echo Point."},
        {"day": 3, "title": "Top Station & Spice Gardens", "details": "Sunrise drive to Top Station viewpoint, Kundala Lake pedal boating, and guided Ayurvedic spice garden tour."},
        {"day": 4, "title": "Kathakali Souvenirs & Departure", "details": "Breakfast overlooking tea valleys and comfortable transfer back to Kochi airport or railway station."}
    ]' AS JSON),
    CAST('[
        "3 Nights stay in valley-view mountain resort",
        "Daily breakfast",
        "Eravikulam National Park entry passes",
        "Private AC cab for complete itinerary"
    ]' AS JSON),
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE slug = 'munnar-tea-garden-retreat');

INSERT INTO packages (slug, title, destination, description, base_price, duration, cover_image, detail_image, itinerary_json, inclusions_json, available)
SELECT
    'andaman-island-adventure',
    'Andaman Island Adventure',
    'Port Blair & Havelock, Andaman',
    'Discover turquoise lagoons, pristine Radhanagar white-sand beaches, coral snorkeling reefs, and historic coastal heritage across the Andaman Islands.',
    22999.00,
    '5 Days / 4 Nights',
    'andaman.jpg',
    'andaman.jpg',
    CAST('[
        {"day": 1, "title": "Port Blair & Cellular Jail", "details": "Arrival at Port Blair, Corbyn''s Cove Beach visit, and evening Light & Sound show at historic Cellular Jail."},
        {"day": 2, "title": "Cruise to Havelock & Radhanagar Beach", "details": "High-speed Makruzz ferry to Havelock Island and sunset swim at Asia''s award-winning Radhanagar Beach."},
        {"day": 3, "title": "Elephant Beach Snorkeling", "details": "Speedboat excursion to Elephant Beach for coral reef snorkeling, sea walking options, and water sports."},
        {"day": 4, "title": "Kalapathar & Neil Island", "details": "Sunrise at Kalapathar Beach, ferry to Neil Island to explore Bharatpur Beach and Natural Bridge rock formation."},
        {"day": 5, "title": "Return Ferry & Departure", "details": "Morning return cruise to Port Blair, pearl souvenir market stop, and airport drop-off."}
    ]' AS JSON),
    CAST('[
        "4 Nights beachfront resort stay (Port Blair + Havelock + Neil)",
        "Daily breakfast",
        "Inter-island private ferry tickets (Makruzz / Nautika)",
        "Complimentary coral snorkeling session at Elephant Beach",
        "All airport, jetty, and sightseeing transfers"
    ]' AS JSON),
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE slug = 'andaman-island-adventure');

INSERT INTO packages (slug, title, destination, description, base_price, duration, cover_image, detail_image, itinerary_json, inclusions_json, available)
SELECT
    'rishikesh-adventure-escape',
    'Rishikesh Adventure Escape',
    'Rishikesh, Uttarakhand',
    'Combine thrilling Grade-III Ganga river rafting, cliff jumping, and Himalayan foothills camping with serene evening Ganga Aarti rituals.',
    8999.00,
    '3 Days / 2 Nights',
    'rishikesh.jpg',
    'rishikesh.jpg',
    CAST('[
        {"day": 1, "title": "Arrival at Riverside Camp & Bonfire", "details": "Check-in to luxury riverside camp in Shivpuri, afternoon nature walk, riverside volleyball, bonfire and music."},
        {"day": 2, "title": "16km Ganga Rafting & Ganga Aarti", "details": "Guided 16 km white-water rafting from Shivpuri to Laxman Jhula, cliff jumping, and evening Triveni Ghat Ganga Aarti."},
        {"day": 3, "title": "Sunrise Yoga & Beatles Ashram", "details": "Morning Himalayan yoga session, visit Ram Jhula and Beatles Ashram murals, and departure after brunch."}
    ]' AS JSON),
    CAST('[
        "2 Nights luxury riverside Swiss camp stay",
        "All 3 meals (breakfast, lunch, evening snacks, dinner)",
        "16 km certified Ganga white-water rafting with gear",
        "Morning guided yoga and evening bonfire"
    ]' AS JSON),
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE slug = 'rishikesh-adventure-escape');

INSERT INTO packages (slug, title, destination, description, base_price, duration, cover_image, detail_image, itinerary_json, inclusions_json, available)
SELECT
    'udaipur-royal-heritage-tour',
    'Udaipur Royal Heritage Tour',
    'Udaipur, Rajasthan',
    'Sail across shimmering Lake Pichola past marble palaces, explore grand Mewar architecture, and savor authentic royal Rajasthani hospitality.',
    13499.00,
    '4 Days / 3 Nights',
    'udaipur.jpg',
    'udaipur.jpg',
    CAST('[
        {"day": 1, "title": "Arrival & Lake Pichola Sunset Cruise", "details": "Welcome in the City of Lakes, heritage haveli check-in, and sunset boat cruise past Jag Mandir on Lake Pichola."},
        {"day": 2, "title": "City Palace & Jagdish Temple", "details": "Guided tour of the grand City Palace complex, Crystal Gallery, Jagdish Temple, and evening Dharohar folk dance at Bagore Ki Haveli."},
        {"day": 3, "title": "Saheliyon Ki Bari & Monsoon Palace", "details": "Stroll through Saheliyon Ki Bari gardens, Fateh Sagar Lake promenade, and panoramic sunset from Sajjangarh Monsoon Palace."},
        {"day": 4, "title": "Hathi Pol Bazaar & Departure", "details": "Morning miniature painting bazaar shopping at Hathi Pol and private transfer to Udaipur airport or station."}
    ]' AS JSON),
    CAST('[
        "3 Nights stay in heritage lake-area hotel",
        "Daily royal breakfast",
        "Sunset boat ride on Lake Pichola",
        "Private AC cab and heritage monument guide"
    ]' AS JSON),
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE slug = 'udaipur-royal-heritage-tour');
