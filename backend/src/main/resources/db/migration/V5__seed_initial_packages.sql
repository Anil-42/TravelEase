-- Migration: V5__seed_initial_packages.sql
-- Description: Seed initial 4 packages preserved from TravelEase prototype

INSERT INTO packages (slug, title, description, base_price, duration, cover_image, detail_image, itinerary_json, inclusions_json, available)
VALUES 
(
    'goa-beach-escape',
    'Goa Beach Escape',
    'Golden beaches, vibrant nightlife, and endless coastal adventure await you.',
    9999.00,
    '4 Days / 3 Nights',
    'tour1.jpg',
    'goa.jpg',
    CAST('[
        {"day": 1, "title": "Arrival in Goa", "details": "Arrival at Goa Airport, beachside leisure at Baga."},
        {"day": 2, "title": "North Goa Sightseeing", "details": "North Goa sightseeing – Fort Aguada, Calangute, Anjuna Beach."},
        {"day": 3, "title": "South Goa Heritage & Cruise", "details": "South Goa – Miramar Beach, Basilica of Bom Jesus, Mandovi cruise."},
        {"day": 4, "title": "Departure", "details": "Local shopping and departure."}
    ]' AS JSON),
    CAST('[
        "3 Nights in a 3-star hotel",
        "Daily breakfast",
        "Airport transfers",
        "Guided sightseeing"
    ]' AS JSON),
    TRUE
),
(
    'manali-mountain-getaway',
    'Manali Mountain Getaway',
    'Experience snow peaks, adventure sports, and serene mountain beauty.',
    9499.00,
    '4 Days / 3 Nights',
    'tour2.jpg',
    'manali.jpg',
    CAST('[
        {"day": 1, "title": "Arrival in Manali", "details": "Arrival at Manali and leisure evening at Mall Road."},
        {"day": 2, "title": "Solang Valley Adventures", "details": "Solang Valley snow adventures and paragliding."},
        {"day": 3, "title": "Old Manali & Hot Springs", "details": "Visit Hidimba Temple, Vashisht Hot Springs, and Old Manali."},
        {"day": 4, "title": "Departure", "details": "Departure after breakfast."}
    ]' AS JSON),
    CAST('[
        "3 Nights in mountain-view resort",
        "Daily breakfast and dinner",
        "Local sightseeing",
        "Cab transfers"
    ]' AS JSON),
    TRUE
),
(
    'jaipur-royal-heritage-tour',
    'Jaipur Royal Heritage Tour',
    'Explore royal palaces, colorful bazaars, and timeless Rajasthani heritage.',
    9999.00,
    '4 Days / 3 Nights',
    'tour3.jpg',
    'jaipur.jpg',
    CAST('[
        {"day": 1, "title": "Arrival in Jaipur", "details": "Arrival in Jaipur, visit Hawa Mahal and local markets."},
        {"day": 2, "title": "Forts & Palaces", "details": "Explore Amber Fort, City Palace, and Jantar Mantar."},
        {"day": 3, "title": "Nahargarh & Heritage Dining", "details": "Visit Nahargarh Fort, enjoy Rajasthani cuisine at Chokhi Dhani."},
        {"day": 4, "title": "Departure", "details": "Departure after breakfast."}
    ]' AS JSON),
    CAST('[
        "3 Nights accommodation in heritage hotel",
        "Daily breakfast",
        "Private cab transfers",
        "Local sightseeing and guide"
    ]' AS JSON),
    TRUE
),
(
    'kerala-backwater-bliss',
    'Kerala Backwater Bliss',
    'Relax in lush backwaters, tea gardens, and tropical tranquility.',
    10499.00,
    '4 Days / 3 Nights',
    'tour4.jpg',
    'kerala.jpg',
    CAST('[
        {"day": 1, "title": "Arrival at Kochi & Munnar", "details": "Arrival at Kochi, transfer to Munnar – visit waterfalls en route."},
        {"day": 2, "title": "Munnar Tea Plantations", "details": "Explore Munnar tea plantations and Eravikulam National Park."},
        {"day": 3, "title": "Alleppey Houseboat Stay", "details": "Travel to Alleppey – enjoy a houseboat cruise with meals."},
        {"day": 4, "title": "Departure", "details": "Departure after breakfast."}
    ]' AS JSON),
    CAST('[
        "3 Nights accommodation (Munnar + Alleppey)",
        "Daily breakfast and 1 houseboat stay",
        "Private cab transfers",
        "Local sightseeing"
    ]' AS JSON),
    TRUE
);
