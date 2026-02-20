from django.core.mail import send_mail
from django.conf import settings

def send_maintenance_notification(request_data):
    """
    Sends an email notification for a maintenance request.
    
    This is a prototype implementation that uses mock data to demonstrate 
    email functionality without depending on the database. 
    It will later be connected to a Django post_save signal.
    
    Args:
        request_data (dict): Dictionary containing:
            - id: Request ID
            - lab: Lab Name/ID
            - issue_description: Details of the issue
            - created_at: Timestamp
            - technician_email: Recipient email address
    """
    subject = f"Maintenance Request #{request_data['id']} - {request_data['lab']}"
    
    message = f"""
    New Maintenance Request Logged:
    
    Request ID: {request_data['id']}
    Lab: {request_data['lab']}
    Issue: {request_data['issue_description']}
    Created At: {request_data['created_at']}
    
    Please attend to this request as soon as possible.
    """
    
    recipient_list = [request_data['technician_email']]
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@lms.com')

    print(f"DEBUG: Attempting to send email to {recipient_list}...")
    
    # send_mail returns the number of successfully delivered messages
    sent = send_mail(
        subject,
        message,
        from_email,
        recipient_list,
        fail_silently=False,
    )
    
    if sent:
        print(f"SUCCESS: Email sent for Request #{request_data['id']}")
    else:
        print(f"FAILURE: Email could not be sent for Request #{request_data['id']}")
    
    return sent
