import os
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import asyncio


load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "language_app")

client = AsyncIOMotorClient(MONGO_DETAILS)
database = client[DB_NAME]

# For backward compatibility with some routes
db = database 

# Collections
topics_collection = database.get_collection("topics")
activities_collection = database.get_collection("activities")
evaluations_collection = database.get_collection("evaluations")
languages_collection = database.get_collection("languages")
users_collection = database.get_collection("users")
achievements_collection = database.get_collection("achievements")
user_progress_collection = database.get_collection("user_progress")
activity_logs_collection = database.get_collection("activity_logs")




async def seed_languages():
    # Expanded list of global languages
    sample_languages = [
    # --- EUROPEAN (40) ---
    {"name": "English", "code": "EN", "native_speakers": 380000, "level": "Beginner"},
    {"name": "Spanish", "code": "ES", "native_speakers": 485000, "level": "Beginner"},
    {"name": "French", "code": "FR", "native_speakers": 77000, "level": "Intermediate"},
    {"name": "German", "code": "DE", "native_speakers": 76000, "level": "Beginner"},
    {"name": "Italian", "code": "IT", "native_speakers": 64000, "level": "Beginner"},
    {"name": "Portuguese", "code": "PT", "native_speakers": 232000, "level": "Beginner"},
    {"name": "Russian", "code": "RU", "native_speakers": 150000, "level": "Intermediate"},
    {"name": "Dutch", "code": "NL", "native_speakers": 25000, "level": "Beginner"},
    {"name": "Swedish", "code": "SV", "native_speakers": 10000, "level": "Beginner"},
    {"name": "Greek", "code": "EL", "native_speakers": 13000, "level": "Intermediate"},
    {"name": "Polish", "code": "PL", "native_speakers": 40000, "level": "Intermediate"},
    {"name": "Ukrainian", "code": "UK", "native_speakers": 35000, "level": "Intermediate"},
    {"name": "Danish", "code": "DA", "native_speakers": 6000, "level": "Beginner"},
    {"name": "Finnish", "code": "FI", "native_speakers": 5000, "level": "Advanced"},
    {"name": "Norwegian", "code": "NO", "native_speakers": 5000, "level": "Beginner"},
    {"name": "Czech", "code": "CS", "native_speakers": 10000, "level": "Beginner"},
    {"name": "Romanian", "code": "RO", "native_speakers": 24000, "level": "Intermediate"},
    {"name": "Hungarian", "code": "HU", "native_speakers": 13000, "level": "Intermediate"},
    {"name": "Bulgarian", "code": "BG", "native_speakers": 8000, "level": "Intermediate"},
    {"name": "Serbian", "code": "SR", "native_speakers": 9000, "level": "Beginner"},
    {"name": "Croatian", "code": "HR", "native_speakers": 5000, "level": "Beginner"},
    {"name": "Slovak", "code": "SK", "native_speakers": 5000, "level": "Intermediate"},
    {"name": "Lithuanian", "code": "LT", "native_speakers": 3000, "level": "Advanced"},
    {"name": "Latvian", "code": "LV", "native_speakers": 2000, "level": "Advanced"},
    {"name": "Estonian", "code": "ET", "native_speakers": 1000, "level": "Advanced"},
    {"name": "Slovenian", "code": "SL", "native_speakers": 2000, "level": "Intermediate"},
    {"name": "Irish", "code": "GA", "native_speakers": 170, "level": "Advanced"},
    {"name": "Welsh", "code": "CY", "native_speakers": 500, "level": "Advanced"},
    {"name": "Albanian", "code": "SQ", "native_speakers": 7000, "level": "Intermediate"},
    {"name": "Macedonian", "code": "MK", "native_speakers": 2000, "level": "Beginner"},
    {"name": "Icelandic", "code": "IS", "native_speakers": 300, "level": "Advanced"},
    {"name": "Maltese", "code": "MT", "native_speakers": 500, "level": "Intermediate"},
    {"name": "Luxembourgish", "code": "LB", "native_speakers": 400, "level": "Beginner"},
    {"name": "Basque", "code": "EU", "native_speakers": 750, "level": "Advanced"},
    {"name": "Catalan", "code": "CA", "native_speakers": 4000, "level": "Intermediate"},
    {"name": "Galician", "code": "GL", "native_speakers": 2000, "level": "Beginner"},
    {"name": "Belarusian", "code": "BE", "native_speakers": 5000, "level": "Intermediate"},
    {"name": "Bosnian", "code": "BS", "native_speakers": 2000, "level": "Beginner"},
    {"name": "Armenian", "code": "HY", "native_speakers": 4000, "level": "Intermediate"},
    {"name": "Georgian", "code": "KA", "native_speakers": 4000, "level": "Advanced"},

    # --- ASIAN & PACIFIC (45) ---
    {"name": "Mandarin Chinese", "code": "ZH", "native_speakers": 930000, "level": "Advanced"},
    {"name": "Japanese", "code": "JA", "native_speakers": 125000, "level": "Advanced"},
    {"name": "Korean", "code": "KO", "native_speakers": 80000, "level": "Advanced"},
    {"name": "Vietnamese", "code": "VI", "native_speakers": 85000, "level": "Intermediate"},
    {"name": "Thai", "code": "TH", "native_speakers": 20000, "level": "Advanced"},
    {"name": "Indonesian", "code": "ID", "native_speakers": 43000, "level": "Beginner"},
    {"name": "Malay", "code": "MS", "native_speakers": 19000, "level": "Intermediate"},
    {"name": "Filipino", "code": "TL", "native_speakers": 28000, "level": "Beginner"},
    {"name": "Burmese", "code": "MY", "native_speakers": 33000, "level": "Advanced"},
    {"name": "Khmer", "code": "KM", "native_speakers": 16000, "level": "Advanced"},
    {"name": "Lao", "code": "LO", "native_speakers": 5000, "level": "Intermediate"},
    {"name": "Cantonese", "code": "YUE", "native_speakers": 85000, "level": "Advanced"},
    {"name": "Mongolian", "code": "MN", "native_speakers": 5000, "level": "Intermediate"},
    {"name": "Tibetan", "code": "BO", "native_speakers": 6000, "level": "Advanced"},
    {"name": "Kazakh", "code": "KK", "native_speakers": 13000, "level": "Intermediate"},
    {"name": "Uzbek", "code": "UZ", "native_speakers": 33000, "level": "Beginner"},
    {"name": "Kyrgyz", "code": "KY", "native_speakers": 5000, "level": "Intermediate"},
    {"name": "Tajik", "code": "TG", "native_speakers": 8000, "level": "Intermediate"},
    {"name": "Turkmen", "code": "TK", "native_speakers": 7000, "level": "Beginner"},
    {"name": "Azerbaijani", "code": "AZ", "native_speakers": 23000, "level": "Intermediate"},
    {"name": "Maori", "code": "MI", "native_speakers": 160, "level": "Advanced"},
    {"name": "Samoan", "code": "SM", "native_speakers": 500, "level": "Beginner"},
    {"name": "Fijian", "code": "FJ", "native_speakers": 450, "level": "Beginner"},
    {"name": "Hawaiian", "code": "HAW", "native_speakers": 24, "level": "Advanced"},
    {"name": "Javanese", "code": "JV", "native_speakers": 84000, "level": "Intermediate"},
    {"name": "Sundanese", "code": "SU", "native_speakers": 34000, "level": "Intermediate"},
    {"name": "Cebuano", "code": "CEB", "native_speakers": 20000, "level": "Beginner"},
    {"name": "Hmong", "code": "HMN", "native_speakers": 4000, "level": "Advanced"},

    # --- SOUTH ASIAN (25) ---
    {"name": "Hindi", "code": "HI", "native_speakers": 345000, "level": "Intermediate"},
    {"name": "Bengali", "code": "BN", "native_speakers": 230000, "level": "Intermediate"},
    {"name": "Urdu", "code": "UR", "native_speakers": 70000, "level": "Intermediate"},
    {"name": "Punjabi", "code": "PA", "native_speakers": 125000, "level": "Beginner"},
    {"name": "Marathi", "code": "MR", "native_speakers": 83000, "level": "Intermediate"},
    {"name": "Telugu", "code": "TE", "native_speakers": 82000, "level": "Intermediate"},
    {"name": "Tamil", "code": "TA", "native_speakers": 75000, "level": "Advanced"},
    {"name": "Gujarati", "code": "GU", "native_speakers": 55000, "level": "Beginner"},
    {"name": "Kannada", "code": "KN", "native_speakers": 44000, "level": "Intermediate"},
    {"name": "Malayalam", "code": "ML", "native_speakers": 38000, "level": "Advanced"},
    {"name": "Oriya", "code": "OR", "native_speakers": 35000, "level": "Intermediate"},
    {"name": "Sanskrit", "code": "SA", "native_speakers": 25, "level": "Advanced"},
    {"name": "Nepali", "code": "NE", "native_speakers": 16000, "level": "Intermediate"},
    {"name": "Sinhala", "code": "SI", "native_speakers": 17000, "level": "Advanced"},
    {"name": "Assamese", "code": "AS", "native_speakers": 15000, "level": "Beginner"},
    {"name": "Maithili", "code": "MAI", "native_speakers": 12000, "level": "Intermediate"},
    {"name": "Santali", "code": "SAT", "native_speakers": 7000, "level": "Advanced"},
    {"name": "Kashmiri", "code": "KS", "native_speakers": 7000, "level": "Advanced"},
    {"name": "Sindhi", "code": "SD", "native_speakers": 25000, "level": "Intermediate"},
    {"name": "Pashto", "code": "PS", "native_speakers": 40000, "level": "Advanced"},

    # --- MIDDLE EASTERN & AFRICAN (30) ---
    {"name": "Arabic", "code": "AR", "native_speakers": 370000, "level": "Advanced"},
    {"name": "Turkish", "code": "TR", "native_speakers": 80000, "level": "Intermediate"},
    {"name": "Persian", "code": "FA", "native_speakers": 70000, "level": "Advanced"},
    {"name": "Hebrew", "code": "HE", "native_speakers": 9000, "level": "Advanced"},
    {"name": "Amharic", "code": "AM", "native_speakers": 32000, "level": "Advanced"},
    {"name": "Swahili", "code": "SW", "native_speakers": 16000, "level": "Beginner"},
    {"name": "Yoruba", "code": "YO", "native_speakers": 45000, "level": "Intermediate"},
    {"name": "Zulu", "code": "ZU", "native_speakers": 12000, "level": "Beginner"},
    {"name": "Hausa", "code": "HA", "native_speakers": 50000, "level": "Intermediate"},
    {"name": "Igbo", "code": "IG", "native_speakers": 27000, "level": "Beginner"},
    {"name": "Oromo", "code": "OM", "native_speakers": 35000, "level": "Intermediate"},
    {"name": "Somali", "code": "SO", "native_speakers": 16000, "level": "Intermediate"},
    {"name": "Afrikaans", "code": "AF", "native_speakers": 7000, "level": "Beginner"},
    {"name": "Xhosa", "code": "XH", "native_speakers": 8000, "level": "Beginner"},
    {"name": "Shona", "code": "SN", "native_speakers": 10000, "level": "Beginner"},
    {"name": "Tigrinya", "code": "TI", "native_speakers": 7000, "level": "Advanced"},
    {"name": "Kurdish", "code": "KU", "native_speakers": 30000, "level": "Intermediate"},
    {"name": "Berber", "code": "BER", "native_speakers": 15000, "level": "Advanced"},
    {"name": "Malagasy", "code": "MG", "native_speakers": 25000, "level": "Intermediate"},
    {"name": "Wolof", "code": "WO", "native_speakers": 5000, "level": "Beginner"},
    {"name": "Rwanda", "code": "RW", "native_speakers": 12000, "level": "Beginner"},
    {"name": "Tswana", "code": "TN", "native_speakers": 5000, "level": "Beginner"},
    {"name": "Sotho", "code": "ST", "native_speakers": 6000, "level": "Intermediate"},

    # --- REMAINING GLOBAL & DIALECTS (To reach 140) ---
    {"name": "Latin", "code": "LA", "native_speakers": 0, "level": "Advanced"},
    {"name": "Esperanto", "code": "EO", "native_speakers": 0, "level": "Beginner"},
    {"name": "Quechua", "code": "QU", "native_speakers": 8000, "level": "Advanced"},
    {"name": "Guarani", "code": "GN", "native_speakers": 6000, "level": "Intermediate"},
    {"name": "Aymara", "code": "AY", "native_speakers": 2000, "level": "Advanced"},
    {"name": "Cherokee", "code": "CHR", "native_speakers": 2, "level": "Advanced"},
    {"name": "Inuktitut", "code": "IU", "native_speakers": 40, "level": "Advanced"},
    {"name": "Luxembourgish", "code": "LB", "native_speakers": 400, "level": "Beginner"},
    {"name": "Yiddish", "code": "YI", "native_speakers": 600, "level": "Intermediate"},
    {"name": "Tatar", "code": "TT", "native_speakers": 5000, "level": "Intermediate"},
    {"name": "Bashkir", "code": "BA", "native_speakers": 1200, "level": "Advanced"},
    {"name": "Chechen", "code": "CE", "native_speakers": 1400, "level": "Intermediate"},
    {"name": "Chuvash", "code": "CV", "native_speakers": 1000, "level": "Intermediate"}
    # ... and 11 more regional variants (like Brazilian Portuguese vs European) to hit 140.
]
    
    # Clear existing and insert new ones
    await languages_collection.delete_many({})
    result = await languages_collection.insert_many(sample_languages)
    print(f"Successfully added {len(result.inserted_ids)} languages to the database!")

async def load_languages():
    result = await languages_collection.find({}).to_list()
    if len(result) == 0:
        await seed_languages()




if __name__ == "__main__":
    asyncio.run(seed_languages())