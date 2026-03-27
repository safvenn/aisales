# API Integration Details

## 1. WhatsApp Cloud API Setup
To send automated messages and receive responses (webhook):
1. **Create App:** Go to Meta for Developers -> Create App -> Other -> Business -> Add WhatsApp product.
2. **Access Token:** Get a System User Access Token from Business Settings to ensure it never expires. Do NOT use the temporary 24-hour token.
3. **Phone Number:** Add a real phone number to your WhatsApp Business Account.
4. **Webhook:** Set up a webhook pointing to your n8n instance: `https://your-n8n.onrender.com/webhook/whatsapp`. Verify token can be any string. Subscription: Subscribe to `messages`.

## 2. OpenRouter AI Setup
1. Create an account at [OpenRouter.ai](https://openrouter.ai).
2. Generate an API Key.
3. **System Prompt for Outreach:**
   `You are SalesSync, an AI assistant for a web development agency. Write a natural, concise WhatsApp message introducing yourself to a local business in Kerala. Mention they don't have a website and offer a free simple demo.`
4. **System Prompt for Chatbot Classifier:**
   `Classify the following customer response into one of these categories exactly: [Interested, Not Interested, Price Inquiry, Need Details, Call Request]. Response: "{{message}}"`

## 3. Apify Google Maps Scraper
1. Create an account at Apify.com.
2. Search for the "Google Maps Scraper" actor.
3. Call it via n8n's HTTP Request node using your Apify API Token.
4. Filter logic is handled via n8n by checking the `website` array length.
