# n8n Automation Workflows Architecture

This document describes the 4 core workflows to build in your n8n instance.

## Workflow 1: Lead Discovery (Apify -> Sheets)
**Purpose:** Scrape Google Maps, filter valid leads, insert into Google Sheets.

1. **Schedule Trigger:** Runs every week (e.g., Monday 9 AM).
2. **Set Nodes (Keywords):** Defines an array of keywords: `["salon in Kerala", "clinic in Kozhikode", "restaurant in Malappuram", "resort in Wayanad", "shop in Kannur"]`.
3. **Split in Batches:** Process one keyword at a time.
4. **HTTP Request (Apify API):** 
   - Calls the Apify Google Maps Scraper Actor (e.g., `compass/google-maps-scraper`).
   - Passes the keyword as the search term.
5. **IF Node (Filter):**
   - Condition 1: `Website` is empty.
   - Condition 2: `Website` contains `facebook.com`.
   - Condition 3: `Website` contains `instagram.com`.
   - *Logic:* If ANY true -> proceed to Valid Leads.
6. **Code Node (Data Formatting):**
   - Cleans phone numbers (extracts digits, prepends `91`).
   - Sets `MessageSent = FALSE`, `Status = Pending`.
7. **Google Sheets (Append):**
   - Adds the valid records to the `Kerala_Leads` sheet.

---

## Workflow 2: Outbound AI Messaging (Sheets -> OpenRouter -> WhatsApp)
**Purpose:** Daily drip campaign to message pending leads, respecting limits.

1. **Schedule Trigger:** Runs every day.
2. **Google Sheets (Read):**
   - Reads `Kerala_Leads`.
   - Filter: `MessageSent = FALSE`.
   - Limit: 30 leads (to respect safety limits).
3. **Split in Batches:** Batch size = 1.
4. **HTTP Request (OpenRouter API):**
   - **Method:** POST `https://openrouter.ai/api/v1/chat/completions`
   - **Model:** `meta-llama/llama-3-8b-instruct:free` (or similar).
   - **System Prompt:** "You are an AI sales assistant. Write a short, friendly WhatsApp message for {{ $json.Name }}. Mention they don't have a website and offer a free demo from us."
5. **HTTP Request (WhatsApp Cloud API):**
   - **Method:** POST `https://graph.facebook.com/v19.0/PHONE_NUMBER_ID/messages`
   - **Body:** `{ "messaging_product": "whatsapp", "to": "{{ $json.Phone }}", "type": "text", "text": { "body": "{{ $json.AI_Message }}" } }`
6. **Wait Node:** Delay for 2 minutes (prevent spam blocks).
7. **Google Sheets (Update):**
   - Updates row: `MessageSent = TRUE`, `Status = Contacted`.

---

## Workflow 3: Webhook Receiver & AI Chatbot
**Purpose:** Handle incoming messages, classify intent, and auto-reply.

1. **Webhook Trigger:** Listens for POST from WhatsApp Cloud API.
2. **IF Node (Message Type):** Checks if event is a text message (ignores status updates).
3. **Google Sheets (Lookup):** Finds lead in `Kerala_Leads` using incoming phone number.
4. **HTTP Request (OpenRouter AI Classification):**
   - **Prompt:** "Classify this customer reply: '{{ incoming_message }}'. Categories: Interested, Price Inquiry, Need Details, Not Interested, Call Request."
5. **Switch Node (Based on Intent):**
   - **Path A (Interested/Need Details/Price):**
     - Call OpenRouter again to generate thoughtful response with Demo links (e.g., "Here is a salon demo: https://salon-demo.vercel.app. We charge X amount...").
     - Send via WhatsApp API.
     - Update Google Sheet: `Interest = Interested`, `Status = Replied`.
   - **Path B (Not Interested):**
     - Update Sheet: `Status = Dead`.
   - **Path C (Call Request / HOT keywords):**
     - Update Sheet: `Status = HOT`.
     - *Link to Workflow 4.*

---

## Workflow 4: Admin Alerts & Follow-ups
**Purpose:** Notify admin of hot leads and chase cold leads.

**Part A: Hot Lead Alerts**
1. Triggered from Workflow 3 (Path C) or periodic DB scan.
2. **HTTP Request (Telegram Bot API):**
   - Sends message to Admin: "🚨 HOT LEAD! {{ $json.Name }} ({{ $json.Phone }}) is asking for a call/price. Last message: {{ $json.Reply }}"

**Part B: 48-hour Follow-ups**
1. **Schedule Trigger:** Runs daily.
2. **Google Sheets (Read):**
   - Filter criteria: `Status = Contacted` AND `Timestamp < (Now - 48 hours)` AND `Reply is empty`.
3. **HTTP Request (WhatsApp API):**
   - Sends: "Hi 👋 Just checking if you saw my message. Would you like to see a free website demo for your business?"
4. **Google Sheets (Update):**
   - `Status = Followup Sent`.
