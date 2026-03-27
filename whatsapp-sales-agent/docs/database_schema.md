# Database Schema: Google Sheets `Kerala_Leads`

The primary database for this AI-powered WhatsApp system is Google Sheets. This ensures ease of use, cost-effectiveness, and direct visibility for the admin.

Create a new Google Sheet named `Kerala_Leads`.
Ensure the first row (Header) matches exactly:

| Name | Phone | BusinessType | City | Website | MessageSent | Reply | Interest | Status | Timestamp |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| XYZ Salon | 919876543210 | Salon | Kozhikode | | FALSE | | None | Pending | |

## Column Definitions

- **Name** `[String]`: Extracted business name from Google Maps.
- **Phone** `[String]`: Cleaned phone number (must include country code, e.g., `91` for India, no spaces or `+`).
- **BusinessType** `[String]`: The category (Salon, Clinic, Restaurant, etc.).
- **City** `[String]`: Target city (e.g., Kozhikode, Kannur).
- **Website** `[String]`: The extracted website. If empty or contains only Facebook/Instagram, the lead is valid.
- **MessageSent** `[Boolean]`: `TRUE` or `FALSE`. n8n will use this to prevent sending duplicate messages.
- **Reply** `[String]`: The latest message received from the customer via WhatsApp webhook.
- **Interest** `[String]`: AI-determined interest level (`Interested`, `Price Inquiry`, `Need Details`, `Not Interested`, `Call Request`).
- **Status** `[String]`: Overall lead status (`Pending`, `Contacted`, `Replied`, `HOT`, `Followup Sent`).
- **Timestamp** `[DateTime]`: Time the lead was added or last updated.

## Setup Instructions for n8n Integration
1. Share this Google Sheet with the Service Account email generated in Google Cloud Console if using Service Account Auth, OR use OAuth to connect n8n to your Google Account.
2. In n8n, use the **Google Sheets** node.
3. Select "Append or Update Document" to ensure we update existing leads rather than duplicating them based on the `Phone` column.
