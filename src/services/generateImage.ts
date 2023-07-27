const { Client } = require('craiyon');

export default async function generateImage(text: string) {
  const craiyon = new Client();
  try {
    const result = await craiyon.generate({
      prompt: text,
    });

    return result._images;
  } catch (error) {
    return 400;
  }
}
