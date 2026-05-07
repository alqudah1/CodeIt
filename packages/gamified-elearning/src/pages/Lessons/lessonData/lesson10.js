const lesson10 = {
  id: 10,
  title: "Combining Concepts",
  subtitle: "Put it all together — variables, strings, loops, lists, and functions!",
  emoji: "🎯",
  steps: [
    {
      type: 'concept',
      id: 'concept',
      title: 'Everything Together',
      body: 'You have learned print, variables, strings, if/else, for loops, lists, and functions. Now combine them! A function can take a list, loop through it, and do something useful with each item.',
      highlight: 'def shout_all(items):\n    for item in items:\n        print(item.upper())\n\nshout_all(["hello", "world"])',
      code: 'def shout_all(items):\n    for item in items:\n        print(item.upper())\n\nshout_all(["hello", "world"])',
    },
    {
      type: 'example',
      id: 'example',
      title: 'Function + Loop + List',
      description: 'Click Run to see a function that receives a list and loops through every item!',
      code: 'def print_all(items):\n    for item in items:\n        print(item)\n\nfruits = ["apple", "banana", "mango"]\nprint_all(fruits)',
      successPattern: /apple|banana|mango/i,
      hint: 'Click Run! The function takes a list and prints each item using a loop.',
      xp: 10,
    },
    {
      type: 'tryit',
      id: 'tryit',
      title: 'Loop + If',
      description: 'Run this to print only names that start with "A". Then add more names to the list!',
      code: 'names = ["Alice", "Bob", "Anna", "Charlie"]\nfor name in names:\n    if name[0] == "A":\n        print(name)',
      successPattern: /Alice|Anna/i,
      hint: 'name[0] gets the first letter. Add more names and see which ones start with A!',
      xp: 15,
    },
    {
      type: 'challenge',
      id: 'challenge',
      title: 'Mini Program',
      description: 'Run this mini program that uses functions, loops, and lists together!',
      code: 'def show_scores(names, scores):\n    for i in range(len(names)):\n        print(names[i], "scored", scores[i])\n\nnames = ["Alice", "Bob", "Charlie"]\nscores = [90, 85, 92]\nshow_scores(names, scores)',
      successPattern: /scored/i,
      hint: 'Change the names and scores, then run again. range(len(names)) gives one index per name!',
      xp: 20,
    },
  ]
};

export default lesson10;
