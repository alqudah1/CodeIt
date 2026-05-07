const lesson6 = {
  id: 6,
  title: "For Loops",
  subtitle: "Loop through every letter or item — let Python do the stepping!",
  emoji: "🔄",
  steps: [
    {
      type: 'concept',
      id: 'concept',
      title: 'Loop Through a String',
      body: 'You can use a for loop to visit every character in a string, one at a time. Python steps through each letter automatically — you just write what to do with each one!',
      highlight: 'for char in "hello":\n    print(char)   →   h  e  l  l  o  (one per line)',
      code: 'for char in "hello":\n    print(char)',
    },
    {
      type: 'example',
      id: 'example',
      title: 'Loop Through Letters',
      description: 'Click Run to see Python print each letter in "Python" one at a time!',
      code: 'for char in "Python":\n    print(char)',
      successPattern: /P|y|t|h|o|n/,
      hint: 'Click Run! The loop visits every letter in the word "Python" one at a time.',
      xp: 10,
    },
    {
      type: 'tryit',
      id: 'tryit',
      title: 'Loop Through Your Name',
      description: 'Change "Alex" to YOUR name and run — see each letter printed on its own line!',
      code: 'name = "Alex"\nfor char in name:\n    print(char)',
      successPattern: /\w/,
      hint: 'Change "Alex" to your own name, then click Run to see your letters one by one!',
      xp: 15,
    },
    {
      type: 'challenge',
      id: 'challenge',
      title: 'Loop with If',
      description: 'Run this to see only the vowels in a word. Try changing "Python" to another word!',
      code: 'word = "Python"\nfor char in word:\n    if char in "aeiouAEIOU":\n        print(char, "is a vowel")',
      successPattern: /vowel/i,
      hint: 'The if checks whether each character is a vowel. Change "Python" to another word!',
      xp: 20,
    },
  ]
};

export default lesson6;
