from google.cloud import firestore

def wipe_history():
    db = firestore.Client(database='weather')
    places = ["mumbai", "delhi", "chennai", "kolkata", "bangalore", "hyderabad", "pune", "ahmedabad"]
    
    deleted_total = 0
    for place in places:
        print(f"Cleaning history for {place}...")
        history_ref = db.collection('places').document(place).collection('history')
        docs = history_ref.stream()
        
        for doc in docs:
            doc.reference.delete()
            deleted_total += 1
            
    print(f"Total history documents deleted: {deleted_total}")

if __name__ == "__main__":
    wipe_history()
