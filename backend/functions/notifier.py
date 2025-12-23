import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv

# Load environment variables
load_dotenv() # loads .env
if not os.environ.get('SENDGRID_API_KEY'):
    load_dotenv('sendgrid.env') # fallback to sendgrid.env

def send_high_risk_alert(to_email, user_name, location, risk_details):
    """
    Sends a high-risk disaster alert email using Twilio SendGrid.
    """
    api_key = os.environ.get('SENDGRID_API_KEY')
    from_email = os.environ.get('SENDGRID_FROM_EMAIL', 'alerts@disaster-management.com')
    
    if not api_key:
        print("Error: SENDGRID_API_KEY not found in environment variables.")
        return False

    message = Mail(
        from_email=from_email,
        to_emails=to_email,
        subject=f"URGENT: High Disaster Risk in {location.capitalize()}",
        html_content=f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #ff4444; border-radius: 10px;">
            <h2 style="color: #ff4444;">🚨 Emergency Alert: {risk_details['disaster_type']} Risk</h2>
            <p>Dear <strong>{user_name}</strong>,</p>
            <p>Our intelligent system has detected a <strong>HIGH RISK</strong> level for <strong>{location.capitalize()}</strong>.</p>
            <div style="background-color: #fff3f3; padding: 15px; border-left: 5px solid #ff4444;">
                <p><strong>Reason:</strong> {risk_details['reason']}</p>
                <p><strong>Confidence:</strong> {risk_details['confidence_score'] * 100}%</p>
            </div>
            <p style="margin-top: 20px;">Please take necessary precautions and stay updated with local news.</p>
            <p style="font-size: 0.8em; color: #666;">Stay safe,<br>Disaster Management Team</p>
        </div>
        """
    )
    
    try:
        sg = SendGridAPIClient(api_key)
        
        # EU Data Residency (as requested by user)
        sg.set_sendgrid_data_residency("eu")
        
        response = sg.send(message)
        print(f"Alert sent to {to_email}. Status Code: {response.status_code}")
        print(f"Response Body: {response.body}")
        print(f"Response Headers: {response.headers}")
        return True
    except Exception as e:
        print(f"Failed to send email alert: {e}")
        return False

if __name__ == "__main__":
    # Test block
    test_risk = {
        "disaster_type": "FLOOD",
        "reason": "Heavy rainfall (60mm/h) indicates immediate flash flood risk.",
        "confidence_score": 0.95
    }
    # send_high_risk_alert("pithanisrujana@gmail.com", "Srujana", "mumbai", test_risk)
