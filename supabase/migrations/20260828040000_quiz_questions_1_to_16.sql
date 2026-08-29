-- Quiz questions for lessons 1 to 16.
--
-- These sixteen quizzes existed only in production. No migration in this
-- repository contained a single one of their questions, so a database rebuilt
-- from this repo came back with sixteen lessons whose quizzes were empty and a
-- studio that answered "no questions found for this quiz". Lessons 17 to 31
-- were fine; these were the sixteen written before the migrations existed.
--
-- Additive and idempotent. Every insert is guarded by a NOT EXISTS on the
-- question text, exactly as the 17-to-31 migration is, because quiz_questions
-- has no natural unique key for ON CONFLICT to match on. Running this against
-- the live database changes nothing that is already there: if production has a
-- question with this text for this quiz, the insert is skipped.
--
-- Written against what each lesson actually teaches — the same code, the same
-- idioms, the same words — rather than general Python trivia. Every wrong
-- answer is a mistake children really make: the string that is not a number,
-- the loop variable mistaken for the list, the single equals sign.

begin;

-- ── Quiz 1 ──────────────────────────────────────────────────────────────
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 1, 'What does print() do?', 'Shows a message on the screen', 'Deletes text', 'Makes the computer faster', 'Saves a file', 'A', 'print() is how you make the computer say something. What you put inside the brackets is what it says.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 1 and question_text = 'What does print() do?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 1, 'Why do the words go inside quote marks in print("Hello")?', 'Quotes are optional', 'Quotes tell Python it is text, not a command', 'To make the text a colour', 'To make them bigger', 'B', 'Without quotes Python thinks Hello is the name of something and looks for it. The quotes say: this is text, print it as it is.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 1 and question_text = 'Why do the words go inside quote marks in print("Hello")?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 1, 'What does print("2 + 3") show?', 'Nothing', '5', '2 + 3', 'An error', 'C', 'It is inside quotes, so it is text. Python prints the characters exactly. Take the quotes off and you get 5.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 1 and question_text = 'What does print("2 + 3") show?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 1, 'How many lines appear from three separate print() lines?', 'None until the end', 'One long line', 'Two', 'Three', 'D', 'Each print() starts a new line, so three prints make three lines.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 1 and question_text = 'How many lines appear from three separate print() lines?'
);

-- ── Quiz 2 ──────────────────────────────────────────────────────────────
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 2, 'What is a variable?', 'A name for a value you stored', 'A kind of loop', 'A message on screen', 'A mistake in the code', 'A', 'A variable is a labelled box. You put a value in and give it a name, and Python opens the box whenever you use that name.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 2 and question_text = 'What is a variable?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 2, 'score = 10, then score = 25, then print(score). What appears?', '10', '25', '10 25', '35', 'B', 'The second line replaces what was in the box. Only the newest value is in there.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 2 and question_text = 'score = 10, then score = 25, then print(score). What appears?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 2, 'name = "Alex". What is the difference between print(name) and print("name")?', 'The second one is an error', 'There is none', 'The first prints Alex, the second prints name', 'The first prints name, the second prints Alex', 'C', 'Without quotes Python looks in the box called name. With quotes it is just the four letters n-a-m-e.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 2 and question_text = 'name = "Alex". What is the difference between print(name) and print("name")?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 2, 'Which line stores 7 in a variable called lives?', 'print(lives, 7)', '7 = lives', 'lives == 7', 'lives = 7', 'D', 'The name goes on the left and the value on the right. One equals sign puts something in the box.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 2 and question_text = 'Which line stores 7 in a variable called lives?'
);

-- ── Quiz 3 ──────────────────────────────────────────────────────────────
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 3, 'What does len("Python") give?', '6', '7', 'Python', '5', 'A', 'len counts the characters. P-y-t-h-o-n is six.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 3 and question_text = 'What does len("Python") give?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 3, 'first = "Hello", last = "Python". What does print(first + " " + last) show?', 'HelloPython', 'Hello Python', 'first last', 'Hello + Python', 'B', 'The + joins strings end to end. The " " in the middle is a space, which is why the words do not run together.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 3 and question_text = 'first = "Hello", last = "Python". What does print(first + " " + last) show?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 3, 'What does "cat".upper() give?', 'cat', 'Cat', 'CAT', 'An error', 'C', '.upper() makes a shouty copy. The original string is unchanged unless you store the new one.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 3 and question_text = 'What does "cat".upper() give?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 3, 'What does + do between two pieces of text?', 'Compares them', 'Nothing', 'Adds them like numbers', 'Joins them into one string', 'D', 'Between numbers + adds. Between strings it sticks them together.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 3 and question_text = 'What does + do between two pieces of text?'
);

-- ── Quiz 4 ──────────────────────────────────────────────────────────────
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 4, 'age = 15. What does this print?  if age >= 13: print("Teen")  else: print("Kid")', 'Teen', 'Kid', 'Both', 'Nothing', 'A', '15 is 13 or more, so the if part runs and the else is skipped entirely.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 4 and question_text = 'age = 15. What does this print?  if age >= 13: print("Teen")  else: print("Kid")'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 4, 'What does elif mean?', 'End the program', 'Else if — checked only when the ones above were false', 'Always run this', 'A kind of loop', 'B', 'Python tries each test in order and stops at the first true one. elif is the next question to ask.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 4 and question_text = 'What does elif mean?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 4, 'age = 10. What prints?  if age >= 13: "Teen"  elif age >= 8: "Kid"  else: "Little"', 'All three', 'Teen', 'Kid', 'Little', 'C', '10 is not 13 or more, so it falls to the elif. 10 is 8 or more, so Kid wins and else never runs.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 4 and question_text = 'age = 10. What prints?  if age >= 13: "Teen"  elif age >= 8: "Kid"  else: "Little"'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 4, 'What has to go at the end of an if line?', 'Nothing', 'A full stop', 'A semicolon', 'A colon', 'D', 'The colon says "the indented lines under me belong to this if".'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 4 and question_text = 'What has to go at the end of an if line?'
);

-- ── Quiz 5 ──────────────────────────────────────────────────────────────
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 5, 'for i in range(3): print("Go!")  How many times does Go! appear?', '3', '4', 'Forever', '2', 'A', 'range(3) gives three laps. It starts counting at 0.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 5 and question_text = 'for i in range(3): print("Go!")  How many times does Go! appear?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 5, 'for i in range(3): print(i)  What appears?', '1 2 3', '0 1 2', '0 1 2 3', '3 3 3', 'B', 'range starts at 0 and stops just before the number you gave it.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 5 and question_text = 'for i in range(3): print(i)  What appears?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 5, 'Where does range(5) stop?', 'It never stops', 'At 5', 'At 4', 'At 6', 'C', 'The last number is not included. range(5) is 0, 1, 2, 3, 4 — five laps.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 5 and question_text = 'Where does range(5) stop?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 5, 'How many times does range(1) loop?', 'Two', 'It is an error', 'Zero', 'One', 'D', 'One lap, with i equal to 0.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 5 and question_text = 'How many times does range(1) loop?'
);

-- ── Quiz 6 ──────────────────────────────────────────────────────────────
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 6, 'for char in "hello": print(char)  How many lines appear?', '5', '2', '1', '4', 'A', 'One lap per character, and hello has five.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 6 and question_text = 'for char in "hello": print(char)  How many lines appear?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 6, 'for letter in "cat": print(letter)  What appears first?', 'cat', 'c', 't', '3', 'B', 'The loop hands you one character at a time, starting at the left.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 6 and question_text = 'for letter in "cat": print(letter)  What appears first?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 6, 'In for char in "hi", what does char hold on each lap?', 'Nothing', 'The whole word', 'One character', 'The number of characters', 'C', 'char is a fresh box each lap holding just that one character.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 6 and question_text = 'In for char in "hi", what does char hold on each lap?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 6, 'for c in "hi": print(c)  How many laps?', '3', '0', '1', '2', 'D', 'Two characters, two laps.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 6 and question_text = 'for c in "hi": print(c)  How many laps?'
);

-- ── Quiz 7 ──────────────────────────────────────────────────────────────
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 7, 'fruits = ["apple", "banana", "cherry"]. What is fruits[0]?', 'apple', 'banana', 'cherry', '0', 'A', 'Lists count from 0, so the first item is at index 0.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 7 and question_text = 'fruits = ["apple", "banana", "cherry"]. What is fruits[0]?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 7, 'What index does the first item of a list have?', '1', '0', '-1', 'It has no index', 'B', 'This trips almost everyone once. The first is 0, the second is 1.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 7 and question_text = 'What index does the first item of a list have?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 7, 'fruits = ["apple", "banana", "cherry"]. What is fruits[1]?', 'An error', 'apple', 'banana', 'cherry', 'C', 'Index 1 is the second item, because the counting started at 0.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 7 and question_text = 'fruits = ["apple", "banana", "cherry"]. What is fruits[1]?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 7, 'Which adds a new item to the end of a list called pets?', 'pets = "dog"', 'pets.add("dog")', 'pets + "dog"', 'pets.append("dog")', 'D', '.append() puts one new item on the end. The last option would throw the whole list away.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 7 and question_text = 'Which adds a new item to the end of a list called pets?'
);

-- ── Quiz 8 ──────────────────────────────────────────────────────────────
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 8, 'scores = [10, 20, 30], total = 0, then for score in scores: total = total + score. What does print(total) show?', '60', '0', '10', '30', 'A', 'total grows each lap: 10, then 30, then 60.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 8 and question_text = 'scores = [10, 20, 30], total = 0, then for score in scores: total = total + score. What does print(total) show?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 8, 'fruits has 3 items. How many lines does for fruit in fruits: print(fruit) produce?', '2', '3', '4', '1', 'B', 'One lap per item, one line per lap.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 8 and question_text = 'fruits has 3 items. How many lines does for fruit in fruits: print(fruit) produce?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 8, 'In for score in scores, what does score hold on each lap?', 'The index number', 'The whole list', 'One item from the list', 'How many items there are', 'C', 'The loop hands you the items themselves, one at a time. scores is the list, score is what is in your hand.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 8 and question_text = 'In for score in scores, what does score hold on each lap?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 8, 'Why does total = 0 go before the loop and not inside it?', 'It makes no difference', 'Python demands it', 'It looks tidier', 'Inside, it would reset to 0 every lap', 'D', 'Put it inside and every lap wipes out what you added, so you end with only the last item.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 8 and question_text = 'Why does total = 0 go before the loop and not inside it?'
);

-- ── Quiz 9 ──────────────────────────────────────────────────────────────
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 9, 'Which word starts a function?', 'def', 'function', 'do', 'func', 'A', 'def is short for define. It names the function and the lines under it are its body.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 9 and question_text = 'Which word starts a function?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 9, 'def double(n): return n * 2. What does print(double(4) + 1) show?', '8', '9', '10', '5', 'B', 'double(4) hands back 8, and then the + 1 happens outside the function.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 9 and question_text = 'def double(n): return n * 2. What does print(double(4) + 1) show?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 9, 'What does return do?', 'Repeats the function', 'Prints something', 'Hands a value back to whoever called the function', 'Ends the program', 'C', 'print shows a value to a person; return gives it back to the code so it can be used.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 9 and question_text = 'What does return do?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 9, 'In def greet(name), what is name?', 'The name of the function', 'A string', 'A mistake', 'A variable holding whatever is passed in', 'D', 'It is a parameter — an empty box that gets filled with whatever you put in the brackets when you call it.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 9 and question_text = 'In def greet(name), what is name?'
);

-- ── Quiz 10 ──────────────────────────────────────────────────────────────
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 10, 'def shout(word): return word.upper() + "!"  Used on ["go", "stop"], what appears?', 'GO! STOP!', 'GO STOP', 'word! word!', 'go stop', 'A', 'Each item goes through the function, comes back shouted, and gets printed.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 10 and question_text = 'def shout(word): return word.upper() + "!"  Used on ["go", "stop"], what appears?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 10, 'Can you call a function on a line above its def?', 'Yes, order never matters', 'No — Python has to read the def first', 'Only inside a loop', 'Only for functions with no parameters', 'B', 'Python reads top to bottom. Calling a function it has not met yet is an error.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 10 and question_text = 'Can you call a function on a line above its def?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 10, 'for item in items: print(item.upper())  What does this do?', 'Nothing', 'Shouts the whole list at once', 'Shouts each item on its own line', 'Changes the list permanently', 'C', 'The loop takes one item at a time and .upper() makes a shouty copy of that one.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 10 and question_text = 'for item in items: print(item.upper())  What does this do?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 10, 'You want to count how many scores are over 50. What do you need?', 'A list only', 'A print only', 'A function only', 'A loop and an if', 'D', 'The loop visits every score and the if decides whether that one counts.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 10 and question_text = 'You want to count how many scores are over 50. What do you need?'
);

-- ── Quiz 11 ──────────────────────────────────────────────────────────────
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 11, 'What does 10 // 3 give?', '3', '4', '1', '3.33', 'A', '// divides and throws away the remainder. It is the whole boxes, not the leftovers.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 11 and question_text = 'What does 10 // 3 give?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 11, 'What does 10 % 3 give?', '3', '1', '3.33', '0', 'B', '% gives the remainder — what is left over after filling 3 whole boxes of 3.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 11 and question_text = 'What does 10 % 3 give?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 11, 'What does 7 / 2 give?', '1', '3', '3.5', '4', 'C', 'A single / always gives a decimal, even when it divides evenly.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 11 and question_text = 'What does 7 / 2 give?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 11, 'What is the difference between / and //?', '// is a comment', '/ only works on whole numbers', 'There is none', '/ keeps the decimal, // throws it away', 'D', '7 / 2 is 3.5 and 7 // 2 is 3.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 11 and question_text = 'What is the difference between / and //?'
);

-- ── Quiz 12 ──────────────────────────────────────────────────────────────
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 12, 'age = 13. What does print(age >= 13) show?', 'True', 'False', '13', 'Yes', 'A', 'A comparison gives back True or False, and 13 is 13 or more.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 12 and question_text = 'age = 13. What does print(age >= 13) show?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 12, 'What is the difference between = and ==?', 'None', '= puts a value in a box, == asks if two things are equal', '== puts a value in a box', '= is only for numbers', 'B', 'One equals sign stores. Two equals signs ask a question and answer True or False.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 12 and question_text = 'What is the difference between = and ==?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 12, 'score = 10. What does print(score != 10) show?', 'An error', 'True', 'False', '10', 'C', '!= means "is not equal to". The score is 10, so "not equal to 10" is False.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 12 and question_text = 'score = 10. What does print(score != 10) show?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 12, 'a = 10, b = 7. What does print(a <= b) show?', '10', '7', 'True', 'False', 'D', '10 is not less than or equal to 7.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 12 and question_text = 'a = 10, b = 7. What does print(a <= b) show?'
);

-- ── Quiz 13 ──────────────────────────────────────────────────────────────
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 13, 'x = 15. What does x > 10 and x < 20 give?', 'True', 'False', '15', 'An error', 'A', 'and needs both sides true. 15 is over 10 and under 20, so both hold.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 13 and question_text = 'x = 15. What does x > 10 and x < 20 give?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 13, 'age = 14, ticket = False. What does age > 12 and ticket give?', 'True', 'False', '14', 'Nothing', 'B', 'The first half is true but ticket is False, and and needs both.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 13 and question_text = 'age = 14, ticket = False. What does age > 12 and ticket give?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 13, 'age = 14, ticket = False. What does age > 12 or ticket give?', '14', 'An error', 'True', 'False', 'C', 'or only needs one side true, and the age check passes.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 13 and question_text = 'age = 14, ticket = False. What does age > 12 or ticket give?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 13, 'ticket = False. What does not ticket give?', 'ticket', 'An error', 'False', 'True', 'D', 'not flips it. Not False is True.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 13 and question_text = 'ticket = False. What does not ticket give?'
);

-- ── Quiz 14 ──────────────────────────────────────────────────────────────
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 14, 'a = "2", b = "3". What does print(a + b) show?', '23', 'ab', 'An error', '5', 'A', 'They are text, not numbers, so + joins them instead of adding them. This is the classic bug.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 14 and question_text = 'a = "2", b = "3". What does print(a + b) show?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 14, 'a = "2", b = "3". What does print(int(a) + int(b)) show?', '23', '5', '"5"', 'An error', 'B', 'int() turns the text into a real number first, so + adds instead of joining.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 14 and question_text = 'a = "2", b = "3". What does print(int(a) + int(b)) show?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 14, 'What does int("42") give you?', 'The number 4', 'The text 42', 'The number 42', 'An error', 'C', 'Same characters on the screen, different kind of thing underneath — and only one of them can be added to.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 14 and question_text = 'What does int("42") give you?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 14, 'Why cast something a person typed in before doing sums with it?', 'To save memory', 'You never need to', 'To make it shorter', 'Typed input arrives as text, and text does not add up', 'D', 'Without int(), "5" + "5" gives 55 instead of 10.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 14 and question_text = 'Why cast something a person typed in before doing sums with it?'
);

-- ── Quiz 15 ──────────────────────────────────────────────────────────────
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 15, 'What does the f do in f"Hello, {name}"?', 'Tells Python to swap the braces for what is inside them', 'Stands for fast', 'Nothing', 'Makes it bold', 'A', 'Without the f, Python prints the braces and the word inside them exactly as typed.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 15 and question_text = 'What does the f do in f"Hello, {name}"?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 15, 'name = "Ada", score = 42. What does print(f"{name} scored {score}") show?', '{name} scored {score}', 'Ada scored 42', 'name scored score', 'An error', 'B', 'Each pair of braces is replaced by the value of the variable inside it.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 15 and question_text = 'name = "Ada", score = 42. What does print(f"{name} scored {score}") show?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 15, 'What goes inside the braces of an f-string?', 'Nothing — they must be empty', 'Only plain text', 'A variable or a small piece of code', 'A colour', 'C', 'Anything Python can work out a value for, most often a variable name.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 15 and question_text = 'What goes inside the braces of an f-string?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 15, 'name = "Ada". What does print("Hello, {name}") show, with no f?', 'An error', 'Hello,', 'Hello, Ada', 'Hello, {name}', 'D', 'Without the f it is just ordinary text, braces included.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 15 and question_text = 'name = "Ada". What does print("Hello, {name}") show, with no f?'
);

-- ── Quiz 16 ──────────────────────────────────────────────────────────────
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 16, 'What does " hello ".strip() give?', '"hello"', '"HELLO"', 'An error', '" hello "', 'A', 'strip() removes the blank space at each end and leaves the middle alone.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 16 and question_text = 'What does " hello ".strip() give?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 16, 'What does "a,b,c".split(",") give?', 'One string "abc"', 'A list of three pieces', 'The number 3', 'An error', 'B', 'split cuts the string wherever it finds the comma and hands back the pieces as a list.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 16 and question_text = 'What does "a,b,c".split(",") give?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 16, 'text = "Hello, World!". What does text.lower() give?', 'An error', '"Hello, World!"', '"hello, world!"', '"HELLO, WORLD!"', 'C', 'lower() makes an all-lowercase copy. The punctuation is untouched.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 16 and question_text = 'text = "Hello, World!". What does text.lower() give?'
);
insert into public.quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
select 16, 'messy = " hello world ". What does messy.strip().replace("world", "there") give?', '"hello world"', 'An error', '" hello there "', '"hello there"', 'D', 'strip() tidies the ends first, then replace() swaps the word. Each one hands its result to the next.'
where not exists (
  select 1 from public.quiz_questions where quiz_id = 16 and question_text = 'messy = " hello world ". What does messy.strip().replace("world", "there") give?'
);

commit;
