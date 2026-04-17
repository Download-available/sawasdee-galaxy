const fetch = require('node-fetch');

exports.handler = async (event) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API Key not configured in Netlify" }) };
  }

  try {
    const { prompt, systemInstruction, type } = JSON.parse(event.body);
    
    // Choose endpoint based on request type (Text or TTS)
    const model = type === 'tts' ? 'gemini-2.5-flash-preview-tts' : 'gemini-2.5-flash-preview-09-2025';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        ...(type === 'tts' && {
          generationConfig: { 
            responseModalities: ["AUDIO"], 
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } } 
          }
        })
      })
    });

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};