const lesson6 = {
  id: 6,
  title: "Dictionaries & Sets — Smart Storage",
  subtitle: "Store data with labels using dictionaries — like a real contacts book in Python!",
  emoji: "📚",
  story: [
    "📱 Sophia keeps her contacts in a messy spreadsheet. Name in one place, number somewhere else.",
    "💡 Python dictionaries fix this: contact = {'name': 'Sophia', 'phone': '555-1234'}. Label + value together!",
    "🗃️ You look things up by key — contact['name'] gives you 'Sophia' instantly.",
    "Sets are like lists but they automatically remove duplicates — perfect for unique collections!"
  ],
  concepts: [
    { icon: "📖", title: "Dictionaries", body: "A dict stores key-value pairs: person = {'name': 'Alex', 'age': 10}. Access with person['name']." },
    { icon: "➕", title: "Adding/Updating", body: "person['city'] = 'Toronto' adds a new key. Same syntax updates an existing one." },
    { icon: "🔑", title: "Keys & Values", body: "person.keys() lists all keys. person.values() lists all values." },
    { icon: "🎯", title: "Sets", body: "A set removes duplicates: {1, 2, 2, 3} becomes {1, 2, 3}. Great for unique items!" }
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Checkpoint 1 — Create Your Profile",
      description: "Create a dictionary called profile with your name, age, and favorite color. Print your name.",
      initialCode: "profile = {'name': 'Alex', 'age': 10, 'color': 'blue'}\nprint(profile['name'])",
      successPattern: /\S+/,
      hint: "Access a dictionary value with profile['key']. The key is the label on the left.",
      xp: 15,
    },
    {
      id: "cp2",
      title: "Checkpoint 2 — Update & Print All",
      description: "Add a 'city' key to your profile, then print all the keys and values.",
      initialCode: "profile = {'name': 'Alex', 'age': 10}\nprofile['city'] = 'Toronto'\nprint(profile.keys())\nprint(profile.values())",
      successPattern: /city|Toronto/i,
      hint: "profile['city'] = 'YourCity' adds a new entry. Then use .keys() and .values()!",
      xp: 15,
    },
    {
      id: "cp3",
      title: "Checkpoint 3 — Remove Duplicates with Sets",
      description: "Create a list with duplicate numbers and convert it to a set to see only unique values.",
      initialCode: "numbers = [1, 2, 2, 3, 3, 3, 4]\nunique = set(numbers)\nprint(unique)",
      successPattern: /\{/,
      hint: "set() automatically removes duplicates. The output will be in curly braces {}.",
      xp: 20,
    }
  ]
};
export default lesson6;
