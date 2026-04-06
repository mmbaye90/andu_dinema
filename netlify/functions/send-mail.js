// netlify/functions/send-mail.js

exports.handler = async (event) => {
  // 1. On n'autorise que les requêtes POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Méthode non autorisée" };
  }

  try {
    // 2. On récupère les données du formulaire envoyées par app.js
    const userParams = JSON.parse(event.body);

    // 3. Construction du payload avec la Private Key (accessToken)
    const payload = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: userParams
    };

    // 4. Appel à l'API EmailJS (fetch est natif dans Node 18+)
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const resultText = await response.text();

    if (response.ok) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ message: "Email envoyé avec succès !" }) 
      };
    } else {
      console.error("Erreur EmailJS:", resultText);
      return { 
        statusCode: response.status, 
        body: JSON.stringify({ error: resultText }) 
      };
    }

  } catch (error) {
    console.error("Crash de la fonction:", error.message);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};