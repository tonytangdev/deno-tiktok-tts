import { decode64ToString } from "https://deno.land/x/base64to@v0.0.2/mod.ts";
import { sleepRandomAmountOfSeconds } from "https://deno.land/x/sleep/mod.ts";

const API_URL = "https://tiktok-tts.weilnet.workers.dev/api/generation";

const AVAILABLE_VOICES = [
  // English US
  "en_us_001", // Female
  "en_us_006", // Male 1
  "en_us_007", // Male 2
  "en_us_009", // Male 3
  "en_us_010", // Male 4

  // English UK
  "en_uk_001", // Male 1
  "en_uk_003", // Male 2

  // English AU
  "en_au_001", // Female
  "en_au_002", // Male

  // French
  "fr_001", // Male 1
  "fr_002", // Male 2

  // German
  "de_001", // Female
  "de_002", // Male

  // Spanish
  "es_002", // Male

  // Spanish MX
  "es_mx_002", // Male

  // Portuguese BR
  "br_003", // Female 2
  "br_004", // Female 3
  "br_005", // Male

  // Indonesian
  "id_001", // Female

  // Japanese
  "jp_001", // Female 1
  "jp_003", // Female 2
  "jp_005", // Female 3
  "jp_006", // Male

  // Korean
  "kr_002", // Male 1
  "kr_002", // Male 2
  "kr_002", // Female
];

async function callAPI(text: string, voice: string) {
  const body = JSON.stringify({
    text,
    voice,
  });

  const headers = new Headers({
    "content-type": "application/json",
  });

  const req = await fetch(API_URL, {
    method: "POST",
    body,
    headers,
  });

  if (req.status !== 200) {
    const error = { status: req.status, statusText: req.statusText };
    throw error;
  }

  const json = await req.json();
  const mp3 = decode64ToString(json.data);

  return mp3;
}

function writeMP3File(mp3: string, index: number) {
  const length = mp3.length;
  const bytes = new Uint8Array(length);
  for (let index = 0; index < length; index++) {
    bytes[index] = mp3.charCodeAt(index);
  }

  Deno.writeFileSync(`audio-${index}.mp3`, bytes);
}

async function main() {
  const voice = Deno.args[0];
  if (!voice || !AVAILABLE_VOICES.includes(voice))
    throw "A valid voice must be passed. Look at AVAILABLE_VOICES to set the desired voice.";

  const text = Deno.args[1];
  if (!text) throw "A text must be passed as the second argument.";

  const textAsArr = text.split(" ");

  const texts = [];
  let j = 0;
  let currentSentence = "";
  for (let index = 0; index < textAsArr.length; index++) {
    const word = textAsArr[index];
    const newSentence = `${currentSentence} ${word}`;

    if (newSentence.length > 250 || index === textAsArr.length - 1) {
      texts[j] = `${newSentence}`;
      currentSentence = "";
      j++;
    } else {
      currentSentence += ` ${word}`;
    }
  }

  let mp3s = "";
  for (let index = 0; index < texts.length; index++) {
    if (index !== 0) {
      await sleepRandomAmountOfSeconds(5, 10);
    }
    const text = texts[index];
    const mp3 = await callAPI(text, voice);

    mp3s += mp3;
    writeMP3File(mp3s, index);
  }

}

main();
