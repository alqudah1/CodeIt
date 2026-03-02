const lesson7 = {
  id: 7,
  title: "Reading & Writing Files",
  subtitle: "Learn how Python saves and loads data to disk — like a diary that never forgets!",
  emoji: "📁",
  story: [
    "📓 Jake writes in a diary every day — but his notebook gets lost all the time.",
    "💾 Python can save text to files on the computer so it's never lost. open(), write(), read() — simple tools!",
    "📂 In a browser, we simulate this with Python's io.StringIO — same commands, safe sandbox.",
    "📖 By the end you'll write text to a 'file' and read it back — like saving your progress in a game!"
  ],
  concepts: [
    { icon: "📝", title: "Writing a File", body: "open('diary.txt', 'w') opens for writing. file.write('text') saves content." },
    { icon: "📖", title: "Reading a File", body: "open('diary.txt', 'r') opens for reading. file.read() loads all the text." },
    { icon: "🔒", title: "with Statement", body: "with open('file.txt', 'w') as f: — auto-closes the file when done. Safer!" },
    { icon: "📋", title: "Readlines", body: "file.readlines() returns a list — one string per line. Great for line-by-line processing." }
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Checkpoint 1 — Write and Read",
      description: "Use io.StringIO to simulate writing 'Hello, diary!' and then reading it back.",
      initialCode: 'import io\nf = io.StringIO()\nf.write("Hello, diary!")\nf.seek(0)\nprint(f.read())',
      successPattern: /Hello, diary!/,
      hint: "f.seek(0) moves back to the start before reading. Without it, you'd read nothing!",
      xp: 15,
    },
    {
      id: "cp2",
      title: "Checkpoint 2 — Multiple Lines",
      description: "Write three diary entries to a StringIO object and read them all back.",
      initialCode: 'import io\nf = io.StringIO()\nf.write("Day 1: Learned Python\\n")\nf.write("Day 2: Made a function\\n")\nf.write("Day 3: Loops are cool!\\n")\nf.seek(0)\nprint(f.read())',
      successPattern: /Day 1/,
      hint: "Use \\n at the end of each line to create a new line in the file.",
      xp: 15,
    },
    {
      id: "cp3",
      title: "Checkpoint 3 — Readlines",
      description: "Read the diary back as a list of lines and print each one with its line number.",
      initialCode: 'import io\nf = io.StringIO("Day 1: Learned Python\\nDay 2: Made a function\\nDay 3: Loops!")\nlines = f.readlines()\nfor i, line in enumerate(lines, 1):\n    print(i, line.strip())',
      successPattern: /1\s+Day/,
      hint: "enumerate(lines, 1) gives (1, line1), (2, line2) etc. .strip() removes the newline at the end.",
      xp: 20,
    }
  ]
};
export default lesson7;
