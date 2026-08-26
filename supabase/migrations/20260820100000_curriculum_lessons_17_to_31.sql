-- Lessons 17 to 31, and their quizzes.
--
-- Additive only. Every statement is guarded by ON CONFLICT DO NOTHING and no
-- existing row, column, index or constraint is modified, so this is safe to run
-- against the live database with real learner progress in it. Lessons 1 to 16
-- keep their ids, their titles and their XP, and nobody's completed lessons or
-- earned XP change value.
--
-- Why the rows are needed at all: the lesson pages themselves are React, but
-- POST /api/lessons/:id/complete looks the lesson up in this table to find out
-- what it is worth. Without a row, finishing lesson 17 returns 404, no XP is
-- awarded, and lesson 18 stays locked forever behind the "finish the previous
-- one" gate. The content column holds a summary rather than the lesson body —
-- the body lives in the React data files, which is where it is authored.
--
-- Generated from those same lesson files, so the two cannot drift apart.

begin;
-- ── Lessons ───────────────────────────────────────────────────────────────
insert into public.lessons (id, title, description, content, example_code, starter_code, expected_output, hints, level, xp)
values (17, 'While Loops — Keep Going Until', 'A for loop counts. A while loop waits for something to happen.', 'Repeat until something changes, with while',
        'fuel = 5
while fuel > 0:
    print("Fuel:", fuel)
    fuel = fuel - 1
print("Lift off!")', 'fuel = 3
while fuel > 0:
    print(fuel)
    fuel = fuel - 1
print("Lift off!")', '', 'The loop checks "is lives more than 0?" before every single lap. | Write down lives after each lap: 2 → 1 → 0. How many times did it print before reaching 0? | The first gap is the word that means "keep repeating".',
        'beginner', 50)
on conflict (id) do nothing;
insert into public.lessons (id, title, description, content, example_code, starter_code, expected_output, hints, level, xp)
values (18, 'Break and Continue — Stop or Skip', 'Two words that let you take control of a loop mid-lap.', 'Leave a loop early with break, skip a lap with continue',
        'chests = ["empty", "silver", "empty", "gold"]
for chest in chests:
    if chest == "empty":
        continue
    print("You found", chest)', 'chests = ["empty", "rock", "gold", "rock"]
for chest in chests:
    if chest == "gold":
        print("Found the gold!")
        break
    print("Opened a", chest)', '', 'Read the loop body in order: the if comes first, the print comes second. | break does not just skip this lap — it ends the loop completely. | Which single number does the if catch?',
        'beginner', 50)
on conflict (id) do nothing;
insert into public.lessons (id, title, description, content, example_code, starter_code, expected_output, hints, level, xp)
values (19, 'Import and Random — Borrowing Superpowers', 'Python comes with toolboxes. import opens one.', 'Use import to borrow ready-made code, and random for surprises',
        'import random

for roll in range(5):
    print("Roll", roll + 1, ":", random.randint(1, 6))', 'import random

dice = random.randint(1, 6)
print("You rolled", dice)', '', 'The first line is how every module gets brought in. | You are picking from a list, not making up a number. | random.choice takes a list and hands back one item from it.',
        'beginner', 50)
on conflict (id) do nothing;
insert into public.lessons (id, title, description, content, example_code, starter_code, expected_output, hints, level, xp)
values (20, 'Dictionaries — Labels, Not Numbers', 'A list remembers order. A dictionary remembers names.', 'Store data by name with dictionaries',
        'hero = {"name": "Echo", "power": "invisibility", "level": 3}
print(hero["name"], "has", hero["power"])
hero["level"] = hero["level"] + 1
print("Levelled up to", hero["level"])', 'player = {"name": "Nova", "score": 40, "lives": 3}
print(player["name"])
print(player["score"])', '', 'pet["legs"] = 3 is not a question, it is a change. | The print runs last, after the change. | Lists use square brackets. Dictionaries use the curly ones.',
        'beginner', 50)
on conflict (id) do nothing;
insert into public.lessons (id, title, description, content, example_code, starter_code, expected_output, hints, level, xp)
values (21, 'Looping Through a Dictionary', 'Visit every label and every value, one pair at a time.', 'Loop through a dictionary with .items(), .keys(), and .values()',
        'scores = {"Nova": 40, "Blaze": 65, "Echo": 22}
total = 0
for points in scores.values():
    total = total + points
print("Total points:", total)', 'scores = {"Nova": 40, "Blaze": 65, "Echo": 22}
for name, points in scores.items():
    print(name, "scored", points)', '', 'There is no .values() or .items() here. | Python picks the keys as the sensible default. | Keep two variables: the best name so far and the best score so far.',
        'beginner', 50)
on conflict (id) do nothing;
insert into public.lessons (id, title, description, content, example_code, starter_code, expected_output, hints, level, xp)
values (22, 'Tuples and Sets', 'One list that cannot change, and one that refuses repeats.', 'Tuples that cannot change and sets that drop duplicates',
        'screen = (800, 600)
width, height = screen
print("Width is", width)
print("Height is", height)', 'screen = (800, 600)
print("Width:", screen[0])

players = {"Sam", "Ada", "Sam"}
print("Players:", len(players))', '', 'A set throws duplicates away as it is built. | How many unique words are in those five? | Round brackets mean locked.',
        'beginner', 50)
on conflict (id) do nothing;
insert into public.lessons (id, title, description, content, example_code, starter_code, expected_output, hints, level, xp)
values (23, 'Slicing — Taking a Piece', 'Grab part of a list or part of a word, without touching the rest.', 'Take part of a list or string with slicing',
        'name = "Python"
print(name[0])
print(name[0:3])
print(name[-2:])
print(name[::-1])', 'scores = [10, 20, 30, 40, 50]
print(scores[0:3])
print(scores[-1])', '', 'Position 0 is "a", position 1 is "b". | The stop number says where to stop, not what to include. | Lists start counting at 0.',
        'beginner', 50)
on conflict (id) do nothing;
insert into public.lessons (id, title, description, content, example_code, starter_code, expected_output, hints, level, xp)
values (24, 'List Comprehensions — A List in One Line', 'The shortcut every Python programmer uses.', 'Build a whole list in one line with a comprehension',
        'numbers = [1, 2, 3, 4, 5]
doubles = [n * 2 for n in numbers]
print(doubles)', 'numbers = [1, 2, 3, 4, 5]
doubles = [n * 2 for n in numbers]
print(doubles)', '', 'Work it out for one number first: what is 3 * 3? | Now do that for every number in the list. | Read it as a sentence: "s, for each s in scores, if s is more than 50".',
        'beginner', 50)
on conflict (id) do nothing;
insert into public.lessons (id, title, description, content, example_code, starter_code, expected_output, hints, level, xp)
values (25, 'Functions That Give Things Back', 'Default answers, more than one result, and the meaning of None.', 'Default arguments, several return values, and None',
        'def stats(numbers):
    return min(numbers), max(numbers), sum(numbers)

lowest, highest, total = stats([4, 9, 2, 7])
print("Lowest:", lowest)
print("Highest:", highest)
print("Total:", total)', 'def double(n):
    return n * 2

def show(n):
    print(n * 2)

print(double(5) + 1)
print(show(5))', '', 'There are two prints in this program, so two lines of output. | A function with no return gives back None. | A default is an assignment, not a comparison.',
        'beginner', 50)
on conflict (id) do nothing;
insert into public.lessons (id, title, description, content, example_code, starter_code, expected_output, hints, level, xp)
values (26, 'Scope — Where a Variable Lives', 'Why the thing you made inside a function vanishes outside it.', 'Local and global variables — where a name lives',
        'def add_points(current, points):
    return current + points

score = 5
score = add_points(score, 20)
print("Score is now", score)', 'score = 0

def play():
    bonus = 10
    print("Inside, bonus is", bonus)
    print("Inside, score is", score)

play()
print("Outside, score is", score)', '', 'There are two variables here that happen to share a name. | The local one disappears the moment the function ends. | Look for an = sign inside the function. There is not one.',
        'beginner', 50)
on conflict (id) do nothing;
insert into public.lessons (id, title, description, content, example_code, starter_code, expected_output, hints, level, xp)
values (27, 'Try and Except — When Things Go Wrong', 'Catch the crash and keep the program running.', 'Catch errors with try and except instead of crashing',
        'def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return "Cannot divide by zero"

print(safe_divide(10, 2))
print(safe_divide(10, 0))
print("Still here!")', 'try:
    age = int("banana")
    print("Age is", age)
except ValueError:
    print("That is not a number!")

print("The program is still running.")', '', 'Everything after the failing line inside try is skipped. | Code after the whole try/except still runs, because nothing crashed. | int("seven") raises a ValueError — that is the one to catch.',
        'beginner', 50)
on conflict (id) do nothing;
insert into public.lessons (id, title, description, content, example_code, starter_code, expected_output, hints, level, xp)
values (28, 'Enumerate and Zip', 'Count while you loop, and walk two lists side by side.', 'Count while you loop with enumerate, pair lists with zip',
        'scores = {"Blaze": 65, "Nova": 40, "Echo": 22}
ranked = sorted(scores.items(), key=lambda pair: pair[1], reverse=True)

for place, (name, points) in enumerate(ranked, start=1):
    print(place, name, points)', 'names = ["Nova", "Blaze", "Echo"]
for position, name in enumerate(names, start=1):
    print(position, name)', '', 'enumerate hands back the position first, then the item. | There is no start= here. | enumerate is for positions. This needs two lists.',
        'beginner', 50)
on conflict (id) do nothing;
insert into public.lessons (id, title, description, content, example_code, starter_code, expected_output, hints, level, xp)
values (29, 'Classes and Objects — Your Own Kind of Thing', 'Build a blueprint once, then stamp out as many as you like.', 'Build your own type with classes, objects, and methods',
        'class Fighter:
    def __init__(self, name, health, power):
        self.name = name
        self.health = health
        self.power = power

    def attack(self, other):
        other.health = other.health - self.power
        print(self.name, "hits", other.name, "for", self.power)

    def is_alive(self):
        return self.health > 0

hero = Fighter("Nova", 40, 12)
goblin = Fighter("Goblin", 30, 8)

while hero.is_alive() and goblin.is_alive():
    hero.attack(goblin)
    if goblin.is_alive():
        goblin.attack(hero)

winner = hero.name if hero.is_alive() else goblin.name
print("Winner:", winner)', 'class Enemy:
    def __init__(self, name, health):
        self.name = name
        self.health = health

    def hit(self, damage):
        self.health = self.health - damage
        print(self.name, "now has", self.health, "health")

goblin = Enemy("Goblin", 30)
goblin.hit(10)', '', 'Two Pet(...) calls means two separate pets. | a.name was set when a was made. | The first line defines a new kind of thing.',
        'beginner', 50)
on conflict (id) do nothing;
insert into public.lessons (id, title, description, content, example_code, starter_code, expected_output, hints, level, xp)
values (30, 'Recursion — A Function That Calls Itself', 'The strangest idea in this course, and one of the most useful.', 'Functions that call themselves, and the base case that stops them',
        'def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

for n in range(1, 6):
    print(n, "factorial is", factorial(n))', 'def countdown(n):
    if n == 0:
        print("Lift off!")
        return
    print(n)
    countdown(n - 1)

countdown(3)', '', 'Every recursive function needs an if that ends it. | Numbers can go negative forever. | numbers[1:] is everything except the first item — that is the smaller problem.',
        'beginner', 50)
on conflict (id) do nothing;
insert into public.lessons (id, title, description, content, example_code, starter_code, expected_output, hints, level, xp)
values (31, 'Capstone — Build a Real Game', 'Everything you have learned, in one program you can keep.', 'Capstone — combine everything into one real game',
        'import random

class Player:
    def __init__(self, name):
        self.name = name
        self.coins = 0
        self.energy = 5

    def is_playing(self):
        return self.energy > 0

chests = ["gold", "empty", "gems", "empty", "trap"]
prizes = {"gold": 50, "gems": 30, "empty": 0, "trap": -20}

player = Player("Nova")

while player.is_playing():
    chest = random.choice(chests)
    reward = prizes.get(chest, 0)
    player.coins = player.coins + reward
    player.energy = player.energy - 1
    print("Opened a", chest, "chest ->", reward, "coins")

    if player.coins >= 100:
        print("Rich enough! Going home early.")
        break

print("---")
print(player.name, "finished with", player.coins, "coins")', 'rooms = {
    "hall": "A dusty hall with two doors.",
    "library": "Books everywhere. One looks new.",
}

def describe(room):
    return rooms.get(room, "Nothing here.")

print(describe("hall"))
print(describe("cellar"))', '', 'Sets have curly braces too, but no colons. | .get() with a fallback is a dictionary method. | Add a new kind of chest to the list, then give it a value in the prizes dictionary.',
        'beginner', 100)
on conflict (id) do nothing;

-- ── Quiz questions ────────────────────────────────────────────────────────
-- Guarded by a NOT EXISTS on the question text so re-running this migration
-- cannot create a second copy of every question. quiz_questions has no natural
-- unique key, so ON CONFLICT has nothing to match on.
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 17, 'Which loop keeps going until a condition stops being true?', 'for', 'if', 'while', 'def', 'C', 'A for loop runs a set number of times. A while loop keeps checking a question at the top of every lap.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 17 and question_text = 'Which loop keeps going until a condition stops being true?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 17, 'What is wrong with: while n > 0: print(n)', 'Nothing, it is fine', 'It needs an else', 'while is spelled wrong', 'n never changes, so it loops forever', 'D', 'If nothing inside the loop changes n, the condition stays true and the loop never ends.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 17 and question_text = 'What is wrong with: while n > 0: print(n)'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 17, 'fuel = 2. How many times does ''while fuel > 0'' run if fuel drops by 1 each lap?', '1', '0', '3', '2', 'D', 'fuel goes 2 then 1 then 0. The loop runs twice and stops when the condition becomes false.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 17 and question_text = 'fuel = 2. How many times does ''while fuel > 0'' run if fuel drops by 1 each lap?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 17, 'When does a while loop check its condition?', 'Only once at the start', 'Before every lap', 'After every lap', 'Never', 'B', 'The question at the top is asked again before each pass through the body.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 17 and question_text = 'When does a while loop check its condition?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 18, 'What does break do inside a loop?', 'Skips this lap only', 'Ends the whole loop', 'Restarts the loop', 'Causes an error', 'B', 'break leaves the loop entirely. No further laps happen.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 18 and question_text = 'What does break do inside a loop?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 18, 'What does continue do?', 'Skips the rest of this lap and starts the next', 'Ends the whole loop', 'Pauses the program', 'Repeats the same lap', 'A', 'continue jumps straight to the next pass, skipping whatever came after it in the body.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 18 and question_text = 'What does continue do?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 18, 'for n in [1,2,3,4]: if n == 3: break — then print(n). What prints?', 'Nothing', '1, 2 and 3', '3 and 4', '1 and 2', 'D', 'The break happens before the print on the lap where n is 3, and there are no laps after it.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 18 and question_text = 'for n in [1,2,3,4]: if n == 3: break — then print(n). What prints?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 18, 'Which one would you use to ignore empty items but keep looping?', 'continue', 'break', 'return', 'pass', 'A', 'continue skips just that item and lets the loop carry on with the rest.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 18 and question_text = 'Which one would you use to ignore empty items but keep looping?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 19, 'What does import random do?', 'Makes numbers random', 'Deletes your variables', 'Brings in a module of ready-made code', 'Prints a random number', 'C', 'import loads a module so you can use the tools inside it.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 19 and question_text = 'What does import random do?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 19, 'random.randint(1, 6) can return which values?', '1 to 6', '1 to 5', '0 to 6', 'Only 6', 'A', 'randint includes both ends, so 1 and 6 are both possible.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 19 and question_text = 'random.randint(1, 6) can return which values?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 19, 'Which one picks an item out of a list?', 'random.randint', 'random.choice', 'random.number', 'random.pick', 'B', 'choice takes a list and hands back one of its items.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 19 and question_text = 'Which one picks an item out of a list?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 19, 'What does math.sqrt(25) give?', '625', '5.0', '12.5', 'An error', 'B', 'sqrt is the square root, and it comes back as a float.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 19 and question_text = 'What does math.sqrt(25) give?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 20, 'Which brackets make a dictionary?', 'Square [ ]', 'Round ( )', 'Angle < >', 'Curly { }', 'D', 'Curly braces with key: value pairs inside make a dictionary.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 20 and question_text = 'Which brackets make a dictionary?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 20, 'player = {"score": 10}. How do you read the score?', 'player.score', 'player{score}', 'player(score)', 'player["score"]', 'D', 'You look a value up by putting its key in square brackets.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 20 and question_text = 'player = {"score": 10}. How do you read the score?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 20, 'What does player["lives"] do if there is no "lives" key?', 'Returns None', 'Returns 0', 'Raises a KeyError', 'Creates the key', 'C', 'Reading a key that does not exist is an error. Use .get() if you want a fallback instead.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 20 and question_text = 'What does player["lives"] do if there is no "lives" key?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 20, 'What does scores.get("Blaze", 0) return when Blaze is missing?', 'None', '0', 'An error', '"Blaze"', 'B', 'The second argument to .get() is the fallback used when the key is not there.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 20 and question_text = 'What does scores.get("Blaze", 0) return when Blaze is missing?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 21, 'for thing in my_dict: what is thing each lap?', 'A key', 'A value', 'Both together', 'The whole dictionary', 'A', 'Looping over a dictionary on its own gives you the keys.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 21 and question_text = 'for thing in my_dict: what is thing each lap?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 21, 'Which method gives you keys and values together?', '.keys()', '.values()', '.items()', '.pairs()', 'C', 'items() hands back both, which is why you write ''for key, value in ...items()''.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 21 and question_text = 'Which method gives you keys and values together?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 21, 'How do you add up every value in a dictionary?', 'Loop over .keys()', 'Use len()', 'Loop over .values() and add each one', 'You cannot', 'C', 'values() gives you just the numbers, which is exactly what you want to total.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 21 and question_text = 'How do you add up every value in a dictionary?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 21, 'scores = {"A": 1, "B": 2}. What does len(scores) give?', '2', '1', '3', '4', 'A', 'len counts the pairs, and there are two.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 21 and question_text = 'scores = {"A": 1, "B": 2}. What does len(scores) give?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 22, 'Which brackets make a tuple?', 'Round ( )', 'Square [ ]', 'Curly { }', 'None', 'A', 'Round brackets make a tuple, and once made it cannot be changed.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 22 and question_text = 'Which brackets make a tuple?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 22, 'What happens if you try to change an item in a tuple?', 'It changes', 'Nothing happens', 'It becomes a list', 'Python raises a TypeError', 'D', 'That is the point of a tuple: Python refuses loudly rather than letting it change quietly.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 22 and question_text = 'What happens if you try to change an item in a tuple?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 22, '{"red", "blue", "red"} has how many items?', '1', '3', '2', '0', 'C', 'A set keeps only one of each, so the second red is dropped.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 22 and question_text = '{"red", "blue", "red"} has how many items?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 22, 'What does set(my_list) do?', 'Sorts the list', 'Removes duplicates', 'Reverses the list', 'Counts the items', 'B', 'Turning a list into a set drops any repeated items.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 22 and question_text = 'What does set(my_list) do?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 23, 'items = [10,20,30,40]. What is items[1:3]?', '[10, 20]', '[20, 30, 40]', '[20, 30]', '[10, 20, 30]', 'C', 'Slicing starts at the first number and stops just before the second.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 23 and question_text = 'items = [10,20,30,40]. What is items[1:3]?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 23, 'What is word[-1]?', 'The first letter', 'The last letter', 'An error', 'The whole word', 'B', 'Negative numbers count backwards from the end, so -1 is the last one.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 23 and question_text = 'What is word[-1]?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 23, 'What does scores[:3] mean?', 'From position 3 to the end', 'The last three items', 'Every third item', 'The first three items', 'D', 'Leaving the start empty means start at the beginning.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 23 and question_text = 'What does scores[:3] mean?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 23, 'What does word[::-1] give?', 'An error', 'The first letter', 'An empty string', 'The word reversed', 'D', 'A step of -1 walks the whole thing backwards.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 23 and question_text = 'What does word[::-1] give?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 24, 'What is [n * 2 for n in [1,2,3]]?', '[2, 4, 6]', '[1, 2, 3]', '[1, 4, 9]', '6', 'A', 'Each item is doubled and collected into a new list.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 24 and question_text = 'What is [n * 2 for n in [1,2,3]]?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 24, 'Where does the filter go in a comprehension?', 'At the start', 'At the end', 'In the middle', 'Anywhere', 'B', 'The if always comes last: [thing for item in list if condition].'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 24 and question_text = 'Where does the filter go in a comprehension?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 24, 'A list comprehension is a shorter way of writing what?', 'A for loop that appends to a list', 'A function', 'An if statement', 'A dictionary', 'A', 'It does exactly what an empty list plus a loop plus append would do.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 24 and question_text = 'A list comprehension is a shorter way of writing what?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 24, 'What is [n for n in [1,2,3,4] if n > 2]?', '[1, 2]', '[3, 4]', '[1, 2, 3, 4]', '[2]', 'B', 'Only the items where the condition is true are kept.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 24 and question_text = 'What is [n for n in [1,2,3,4] if n > 2]?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 25, 'What does a function with no return statement give back?', 'None', 'An empty string', '0', 'An error', 'A', 'None is Python''s word for ''nothing here''.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 25 and question_text = 'What does a function with no return statement give back?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 25, 'def greet(name, greeting="Hi") — what is greeting="Hi"?', 'A default value', 'A comment', 'A return', 'A variable', 'A', 'If the caller leaves it out, the default is used.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 25 and question_text = 'def greet(name, greeting="Hi") — what is greeting="Hi"?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 25, 'What is the difference between print and return?', 'There is none', 'print shows a value, return hands it back for use', 'return shows a value, print hands it back', 'print is faster', 'B', 'You can store, add to, or pass on what a function returns. A print is just shown and forgotten.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 25 and question_text = 'What is the difference between print and return?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 25, 'def stats(): return 1, 2. What comes back?', 'Just 1', 'A tuple with both', 'Just 2', 'An error', 'B', 'Returning several values separated by commas gives you a tuple you can unpack.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 25 and question_text = 'def stats(): return 1, 2. What comes back?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 26, 'A variable made inside a function can be used where?', 'Only inside that function', 'Everywhere', 'Only outside', 'Only in other functions', 'A', 'It exists only while that function is running, then it is gone.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 26 and question_text = 'A variable made inside a function can be used where?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 26, 'score = 5 outside. A function does score = 100. What is score outside afterwards?', '100', 'None', '5', 'An error', 'C', 'Assigning inside a function makes a new local variable, even if the name matches.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 26 and question_text = 'score = 5 outside. A function does score = 100. What is score outside afterwards?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 26, 'Can a function read a variable made outside it?', 'Only if it is a number', 'No', 'Only with global', 'Yes', 'D', 'Reading is allowed. It is assigning that creates a new local one.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 26 and question_text = 'Can a function read a variable made outside it?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 26, 'What does the global keyword do?', 'Makes a variable faster', 'Deletes a variable', 'Lets a function change an outer variable', 'Makes a variable local', 'C', 'It is allowed, but it makes programs harder to follow, so it is rarely the right answer.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 26 and question_text = 'What does the global keyword do?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 27, 'What goes in the try block?', 'The recovery code', 'Only print statements', 'The code that might go wrong', 'Nothing', 'C', 'try holds the risky part, and except holds what to do if it fails.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 27 and question_text = 'What goes in the try block?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 27, 'int("banana") raises which error?', 'KeyError', 'TypeError', 'ValueError', 'ZeroDivisionError', 'C', 'A ValueError means the value was the wrong sort of thing.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 27 and question_text = 'int("banana") raises which error?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 27, 'What happens to the rest of the try block after something goes wrong?', 'It still runs', 'It is skipped', 'It runs twice', 'It runs after except', 'B', 'Python jumps straight to except, abandoning the rest of try.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 27 and question_text = 'What happens to the rest of the try block after something goes wrong?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 27, 'Why name the error, as in except ValueError?', 'It looks tidier', 'It makes it faster', 'It is required by Python', 'So a different problem is not swallowed silently', 'D', 'A bare except hides real bugs by catching everything, including ones you did not expect.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 27 and question_text = 'Why name the error, as in except ValueError?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 28, 'What does enumerate give you each lap?', 'The position and the item', 'Just the item', 'Just the position', 'The whole list', 'A', 'That is why you write ''for position, item in enumerate(things)''.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 28 and question_text = 'What does enumerate give you each lap?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 28, 'enumerate(names) starts counting at what?', '0', '1', '-1', 'The list length', 'A', 'Like everything else in Python, it starts at 0 unless you pass start=1.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 28 and question_text = 'enumerate(names) starts counting at what?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 28, 'What does zip do?', 'Compresses a file', 'Removes duplicates', 'Sorts a list', 'Walks two lists side by side', 'D', 'It pairs the first with the first, the second with the second, and so on.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 28 and question_text = 'What does zip do?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 28, 'zip stops when what happens?', 'The longer list ends', 'The shorter list ends', 'Never', 'After ten items', 'B', 'It can only make pairs while both lists still have items.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 28 and question_text = 'zip stops when what happens?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 29, 'What does class do?', 'Defines a blueprint for objects', 'Makes one object', 'Imports a module', 'Creates a list', 'A', 'The class is the plan; each object made from it is a copy with its own values.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 29 and question_text = 'What does class do?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 29, 'When does __init__ run?', 'Every time a method is called', 'Never', 'Once when the program starts', 'When a new object is made', 'D', 'It is the setup that runs at the moment the object is created.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 29 and question_text = 'When does __init__ run?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 29, 'Inside a method, what does self refer to?', 'The class itself', 'A keyword Python ignores', 'This particular object', 'The name of the file', 'C', 'self is how a method refers to the object it was called on.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 29 and question_text = 'Inside a method, what does self refer to?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 29, 'a = Pet("Rex") and b = Pet("Milo"). Does making b change a?', 'Yes', 'No, they are separate objects', 'Only if they share a name', 'It causes an error', 'B', 'Each object keeps its own values. They do not share.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 29 and question_text = 'a = Pet("Rex") and b = Pet("Milo"). Does making b change a?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 30, 'What is a recursive function?', 'A function that calls itself', 'A function with a loop', 'A function with no arguments', 'A function that returns None', 'A', 'It solves a problem by calling itself on a smaller version of it.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 30 and question_text = 'What is a recursive function?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 30, 'What is a base case?', 'The first line of the function', 'The return value', 'The name of the function', 'The condition that stops the recursion', 'D', 'Without one, the function never stops and Python raises a RecursionError.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 30 and question_text = 'What is a base case?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 30, 'What happens with no base case?', 'It returns None', 'It runs once', 'RecursionError', 'It runs forever with no error', 'C', 'Python cuts it off rather than letting it run down memory forever.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 30 and question_text = 'What happens with no base case?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 30, 'factorial(4) is 4 * factorial(3). What must factorial(1) return?', '1', '0', '4', 'None', 'A', '1 is the base case, and it is what stops the chain of calls.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 30 and question_text = 'factorial(4) is 4 * factorial(3). What must factorial(1) return?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 31, 'What is the best way to build a bigger program?', 'Write it all at once then run it', 'One small piece at a time, testing as you go', 'Copy someone else''s', 'Start with the ending', 'B', 'Every working program was a smaller working program first.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 31 and question_text = 'What is the best way to build a bigger program?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 31, 'prizes = {"gold": 50} is what kind of thing?', 'A list', 'A set', 'A dictionary', 'A tuple', 'C', 'Curly braces with key: value pairs make a dictionary.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 31 and question_text = 'prizes = {"gold": 50} is what kind of thing?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 31, 'Why wrap int(answer) in try/except in a quiz?', 'It runs faster', 'To use less memory', 'It is required', 'So one bad answer does not crash the whole quiz', 'D', 'Recovering from bad input is what keeps a program usable by real people.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 31 and question_text = 'Why wrap int(answer) in try/except in a quiz?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 31, 'A class is most useful when you need what?', 'One value', 'A shorter program', 'Many things of the same kind, each with its own values', 'Faster maths', 'C', 'Twenty enemies from one blueprint beats twenty hand-written dictionaries.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 31 and question_text = 'A class is most useful when you need what?'
);

-- The ids above were supplied explicitly, which leaves the identity sequence
-- pointing at 1. Without this, the next lesson inserted without an id would
-- collide with lesson 1. setval is read from the table itself, so it is correct
-- whatever is actually in there.
select setval(pg_get_serial_sequence('public.lessons', 'id'),
              greatest((select max(id) from public.lessons), 1));
select setval(pg_get_serial_sequence('public.quiz_questions', 'question_id'),
              greatest((select max(question_id) from public.quiz_questions), 1));

commit;
