export default function rusHyphenate(text) {
  let hyphenatedText = text
  const all = '[абвгдеёжзийклмнопрстуфхцчшщъыьэюя]',
    vowel = '[аеёиоуыэюя]',
    consonant = '[бвгджзклмнпрстфхцчшщ]',
    zn = '[йъь]',
    shy = '\xAD',
    hyp = []

  hyp[0] = new RegExp('(' + zn + ')(' + all + all + ')', 'ig')
  hyp[1] = new RegExp('(' + vowel + ')(' + vowel + all + ')', 'ig')
  hyp[2] = new RegExp('(' + vowel + consonant + ')(' + consonant + vowel + ')', 'ig')
  hyp[3] = new RegExp('(' + consonant + vowel + ')(' + consonant + vowel + ')', 'ig')
  hyp[4] = new RegExp('(' + vowel + consonant + ')(' + consonant + consonant + vowel + ')', 'ig')
  hyp[5] = new RegExp('(' + vowel + consonant + consonant + ')(' + consonant + consonant + vowel + ')', 'ig')

  for (let i = 0; i <= 5; ++i) {
    while(hyp[i].test(hyphenatedText)){
      hyphenatedText = hyphenatedText.replaceAll(hyp[i], '$1' + shy + '$2')
    }
  }

  return hyphenatedText
}
