const lesson8 = {
  id: 8,
  title: "Loops with Lists",
  subtitle: "Visit every item in a list — automatically, one by one!",
  emoji: "🔁",
  steps: [
    {
      type: 'concept',
      id: 'concept',
      title: 'Loop Through a List',
      body: 'Combine a for loop with a list and Python visits every item automatically. Write what you want to do with each item — the loop handles the rest, no matter how long the list is!',
      highlight: 'fruits = ["apple", "banana", "mango"]\nfor fruit in fruits:\n    print(fruit)   →   apple  banana  mango',
      code: 'fruits = ["apple", "banana", "mango"]\nfor fruit in fruits:\n    print(fruit)',
    },
    {
      type: 'example',
      id: 'example',
      title: 'Print Every Item',
      description: 'Click Run to loop through a list and print each item on its own line!',
      code: 'planets = ["Mercury", "Venus", "Earth", "Mars"]\nfor planet in planets:\n    print(planet)',
      successPattern: /Mercury|Earth/i,
      hint: 'Click Run! The loop visits each planet in the list one by one.',
      xp: 10,
    },
    {
      type: 'tryit',
      id: 'tryit',
      title: 'Your Favorites',
      description: 'Change the items to YOUR three favorite things and run the loop!',
      code: 'favorites = ["coding", "pizza", "music"]\nfor item in favorites:\n    print(item)',
      successPattern: /\w{3,}/,
      hint: 'Change "coding", "pizza", "music" to three things you love and click Run!',
      xp: 15,
    },
    {
      type: 'challenge',
      id: 'challenge',
      title: 'Loop with If',
      description: 'Run this to print only the short words. Then add more words to the list!',
      code: 'words = ["hi", "elephant", "go", "python", "ok"]\nfor word in words:\n    if len(word) <= 3:\n        print(word, "is short")',
      successPattern: /short/i,
      hint: 'The if checks the length of each word. Add more words to the list and run again!',
      xp: 20,
    },
  ]
};

export default lesson8;
