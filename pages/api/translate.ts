import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

interface Item {
  [key: string]: any;
}

interface KeyTranslation {
  key: string;
  newKey: string;
  targetLang: string;
}

interface TranslateRequestBody {
  items: Item[];
  keysToTranslate: KeyTranslation[];
  sourceLang: string;
}

const translate = async (text: string, from: string, to: string): Promise<string> => {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url);
  const result: any = await response.json();
  return result[0][0][0];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { items, keysToTranslate, sourceLang }: TranslateRequestBody = req.body;

    const translationPromises: Promise<void>[] = [];

    for (const { key, newKey, targetLang } of keysToTranslate) {
      if (!newKey) {
        return res.status(400).json({ error: "newKey is required." });
      }
      
      for (const item of items) {
        if (item[key]) {
          const translatePromise = translate(item[key], sourceLang, targetLang).then((translatedText) => {
            item[newKey] = translatedText;
            if (newKey !== key) {
              delete item[key];
            }
          });

          translationPromises.push(translatePromise);
        }
      }
    }

    await Promise.all(translationPromises);

    res.status(200).json(items);
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
