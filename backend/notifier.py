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
        subject=f"🚨 Weather Alert: High Risk in {location.capitalize()}",
        html_content=f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">⚠️ Disaster Alert System</h1>
                </div>
                
                <div style="background: #fff; padding: 30px; border: 2px solid #ff4444; border-top: none; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #ff4444; margin-top: 0;">High {risk_details['disaster_type']} Risk Detected</h2>
                    
                    <p>Dear <strong>{user_name}</strong>,</p>
                    
                    <p>Our monitoring system has detected high risk conditions in <strong>{location.capitalize()}</strong>.</p>
                    
                    <div style="background-color: #fff3f3; padding: 20px; border-left: 5px solid #ff4444; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>📍 Location:</strong> {location.capitalize()}</p>
                        <p style="margin: 5px 0;"><strong>⚠️ Risk Type:</strong> {risk_details['disaster_type']}</p>
                        <p style="margin: 5px 0;"><strong>📊 Confidence:</strong> {int(risk_details['confidence_score'] * 100)}%</p>
                        <p style="margin: 10px 0 5px 0;"><strong>ℹ️ Details:</strong></p>
                        <p style="margin: 5px 0; padding: 10px; background: white; border-radius: 5px;">{risk_details['reason']}</p>
                    </div>
                    
                    <h3 style="color: #333;">Recommended Actions:</h3>
                    <ul style="line-height: 1.8;">
                        <li>Stay informed through local news and weather updates</li>
                        <li>Keep emergency supplies ready</li>
                        <li>Follow instructions from local authorities</li>
                        <li>Stay safe and avoid unnecessary travel</li>
                    </ul>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #666; margin: 5px 0;">
                            This is an automated alert from the Disaster Alert System.<br>
                            You are receiving this because you registered for alerts in {location.capitalize()}.
                        </p>
                        <p style="font-size: 12px; color: #666; margin: 5px 0;">
                            Stay safe,<br>
                            <strong>Disaster Alert Team</strong>
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
    )
    
    try:
        sg = SendGridAPIClient(api_key)
        
        # EU Data Residency (temporarily disabled for testing)
        # sg.set_sendgrid_data_residency("eu")
        
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
    send_high_risk_alert("bhargavisrujana2005@gmail.com", "Srujana", "mumbai", test_risk)
