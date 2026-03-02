const lesson5 = {
  id: 5,
  title: "Lists & Strings — Your Data Toolkit",
  subtitle: "Collect multiple items in lists and manipulate text like a Python word wizard!",
  emoji: "📋",
  story: [
    "🛒 Marco is making a shopping list — but every time he adds something, the paper gets messy!",
    "💡 Python has lists: shopping = ['apples', 'milk', 'eggs']. All items in one tidy place!",
    "✂️ Strings are also super powerful. You can reverse them, count letters, find words, and more.",
    "🎯 By the end, you'll manage a list of your favorite things and perform cool string magic!"
  ],
  concepts: [
    { icon: "📋", title: "Lists", body: "A list holds multiple items: fruits = ['apple', 'banana', 'mango']. Access with fruits[0]." },
    { icon: "➕", title: "Append & Remove", body: "fruits.append('grape') adds an item. fruits.remove('apple') deletes one." },
    { icon: "🔤", title: "String Methods", body: "name.upper() makes UPPERCASE. name.lower() makes lowercase. len(name) counts characters." },
    { icon: "🔁", title: "Loop a List", body: "for fruit in fruits: print(fruit) — loops through every item in the list!" }
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Checkpoint 1 — Favorite Things List",
      description: "Create a list called favorites with 3 of your favorite things, then print the whole list.",
      initialCode: "favorites = ['coding', 'pizza', 'music']\nprint(favorites)",
      successPattern: /\[/,
      hint: "Lists use square brackets [ ]. Add strings inside with quotes, separated by commas.",
      xp: 15,
    },
    {
      id: "cp2",
      title: "Checkpoint 2 — Loop Through the List",
      description: "Print each item in your favorites list on its own line using a for loop.",
      initialCode: "favorites = ['coding', 'pizza', 'music']\nfor item in favorites:\n    print(item)",
      successPattern: /coding|pizza|music/i,
      hint: "The loop variable item takes on each list value one at a time.",
      xp: 15,
    },
    {
      id: "cp3",
      title: "Checkpoint 3 — String Magic",
      description: "Store your name in a variable and print it in UPPERCASE, then print how many letters it has.",
      initialCode: 'name = "Alex"\nprint(name.upper())\nprint(len(name))',
      successPattern: /[A-Z]{2,}/,
      hint: "name.upper() converts to uppercase. len(name) counts the characters.",
      xp: 20,
    }
  ]
};
export default lesson5;
