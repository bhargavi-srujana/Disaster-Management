from google.cloud import firestore
from datetime import datetime, timezone

def cleanup_future_history():
    """Remove all history records with future dates (beyond today)."""
    db = firestore.Client(database='weather')
    
    # Get all place documents
    places_ref = db.collection('places')
    places = places_ref.stream()
    
    now = datetime.now(timezone.utc)
    deleted_total = 0
    
    for place_doc in places:
        place_name = place_doc.id
        print(f"Checking {place_name}...")
        
        history_ref = place_doc.reference.collection('history')
        
        # Get all history documents with future timestamps
        future_docs = history_ref.where('timestamp', '>', now).stream()
        
        for doc in future_docs:
            doc_data = doc.to_dict()
            timestamp = doc_data.get('timestamp')
            hour_id = doc_data.get('hour_id', doc.id)
            print(f"  Deleting future record: {hour_id} ({timestamp})")
            doc.reference.delete()
            deleted_total += 1
            
    print(f"\n✅ Total future history documents deleted: {deleted_total}")
    
    if deleted_total == 0:
        print("✅ No future records found - database is clean!")

if __name__ == "__main__":
    print("=" * 60)
    print("CLEANUP: Removing Future History Records")
    print("=" * 60)
    cleanup_future_history()
