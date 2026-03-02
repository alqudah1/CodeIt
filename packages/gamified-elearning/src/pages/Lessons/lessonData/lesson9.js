const lesson9 = {
  id: 9,
  title: "Classes & Objects — Build Your Own Blueprints",
  subtitle: "Create templates for objects — like designing a robot blueprint, then building many robots!",
  emoji: "🏗️",
  story: [
    "🏭 The robot factory needs to build 100 robots — all the same design but with different names.",
    "📐 A class is a blueprint. Robot is the class; individual robots are objects made from that blueprint.",
    "🔧 Each object gets its own data (name, color) stored in self — short for 'this specific robot'.",
    "🚀 Classes are how big programs are organized. Games, apps, websites — all built with classes!"
  ],
  concepts: [
    { icon: "📐", title: "Class Definition", body: "class Dog: defines a blueprint. All dogs share the same structure." },
    { icon: "🔧", title: "__init__ method", body: "def __init__(self, name): runs when you create an object. self refers to the object itself." },
    { icon: "📦", title: "Instance Variables", body: "self.name = name stores data in the object. Each object has its own copy!" },
    { icon: "⚙️", title: "Methods", body: "def bark(self): is a method — a function that belongs to the class." }
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Checkpoint 1 — Your First Class",
      description: "Create a Dog class with a name attribute and a bark() method. Create a dog and make it bark!",
      initialCode: 'class Dog:\n    def __init__(self, name):\n        self.name = name\n    def bark(self):\n        print(self.name + " says: Woof!")\n\nmy_dog = Dog("Buddy")\nmy_dog.bark()',
      successPattern: /Woof/i,
      hint: "Dog('Buddy') creates an object. my_dog.bark() calls the bark method on that object.",
      xp: 15,
    },
    {
      id: "cp2",
      title: "Checkpoint 2 — Multiple Objects",
      description: "Create two Dog objects with different names and make both bark.",
      initialCode: 'class Dog:\n    def __init__(self, name):\n        self.name = name\n    def bark(self):\n        print(self.name + " says: Woof!")\n\ndog1 = Dog("Buddy")\ndog2 = Dog("Luna")\ndog1.bark()\ndog2.bark()',
      successPattern: /Buddy|Luna/,
      hint: "Each object is independent. dog1 and dog2 have different names but the same blueprint!",
      xp: 15,
    },
    {
      id: "cp3",
      title: "Checkpoint 3 — Add More Attributes",
      description: "Add breed to the Dog class and print a full description: 'NAME is a BREED.'",
      initialCode: 'class Dog:\n    def __init__(self, name, breed):\n        self.name = name\n        self.breed = breed\n    def describe(self):\n        print(self.name + " is a " + self.breed + ".")\n\nmy_dog = Dog("Max", "Labrador")\nmy_dog.describe()',
      successPattern: /is a/,
      hint: "Add a second parameter to __init__ and store it with self.breed = breed.",
      xp: 20,
    }
  ]
};
export default lesson9;
