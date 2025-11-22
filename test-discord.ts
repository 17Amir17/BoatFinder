import 'dotenv/config';

async function testDiscord() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('❌ DISCORD_WEBHOOK_URL not found in .env');
    process.exit(1);
  }

  console.log('🧪 Testing Discord webhook...');
  console.log(`Webhook URL: ${webhookUrl.substring(0, 50)}...`);

  const testListing = {
    title: "TEST: סירת דייג למכירה",
    price: "₪55,000",
    location: { city: "תל אביב", state: "TA" },
    url: "https://www.facebook.com/marketplace/item/test123",
    llm_rating: 8,
    hasParking: true,
    llm_reason: "Test boat: 6.5m, 115 HP, parking mentioned, good price",
    description: "This is a test description to verify Discord notifications are working properly."
  };

  const embed = {
    title: testListing.title,
    url: testListing.url,
    color: testListing.llm_rating >= 7 ? 0x00ff00 : 0x0099ff,
    fields: [
      { name: "💰 Price", value: testListing.price, inline: true },
      {
        name: "📍 Location",
        value: `${testListing.location.city}, ${testListing.location.state}`,
        inline: true,
      },
      { name: "⭐ LLM Rating", value: `${testListing.llm_rating}/10`, inline: true },
      {
        name: "🅿️ Parking",
        value: testListing.hasParking ? "✅ Yes" : "❌ No",
        inline: true,
      },
      { name: "📝 LLM Analysis", value: testListing.llm_reason, inline: false },
      { name: "📄 Description", value: testListing.description, inline: false },
    ],
    timestamp: new Date().toISOString(),
  };

  console.log('\nSending embed:');
  console.log(JSON.stringify(embed, null, 2));

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });

    console.log(`\n✅ Response status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Error response:', text);
    } else {
      console.log('✅ Discord notification sent successfully!');
      console.log('Check your Discord channel for the test message.');
    }

  } catch (error: any) {
    console.error('❌ Error:', error?.message || error);
  }
}

testDiscord();
