from google.cloud import firestore
try:
    print("Testing firestore client...")
    db = firestore.Client()
    print("Success")
except Exception as e:
    print(f"Caught: {e}")
