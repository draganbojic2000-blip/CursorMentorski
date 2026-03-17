// Netlify funkcija koja vraća kurseve valuta prema RSD.
// Izvor: ECB referentni kurs preko Frankfurter API-ja.

exports.handler = async function handler() {
  try {
    const resp = await fetch('https://api.frankfurter.app/latest?base=EUR&symbols=RSD,USD,CHF');
    if (!resp.ok) {
      return {
        statusCode: resp.status,
        body: JSON.stringify({ error: 'Neuspešno preuzimanje kurseva sa Frankfurter.app' })
      };
    }

    const data = await resp.json();
    if (!data || !data.rates || typeof data.rates.RSD !== 'number') {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Neočekivan format podataka sa Frankfurter.app' })
      };
    }

    const { RSD, USD, CHF } = data.rates;

    const eurRsd = RSD;
    const usdRsd = typeof USD === 'number' ? RSD * USD : null;
    const chfRsd = typeof CHF === 'number' ? RSD * CHF : null;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        base: 'RSD',
        eurRsd,
        usdRsd,
        chfRsd,
        asOf: data.date || null,
        source: 'ECB referentni kurs preko Frankfurter.app',
        raw: data
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Greška pri preuzimanju kurseva',
        message: err && err.message ? err.message : String(err)
      })
    };
  }
}

