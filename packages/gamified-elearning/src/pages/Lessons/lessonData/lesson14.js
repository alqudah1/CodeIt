const lesson14 = {
  id: 14,
  title: "Type Casting",
  subtitle: "Convert between numbers and text so your data is always the right shape!",
  emoji: "🔁",
  steps: [
    {
      type: 'concept',
      id: 'concept',
      title: 'Changing a Value\'s Type',
      body: 'Every value in Python has a type — int, float, str, bool. Sometimes you need to switch types. int() converts to a whole number. float() converts to a decimal. str() converts to text. type() tells you what type a value currently is. Note: in this browser environment, we use variables instead of input() to simulate user data.',
      highlight: 'text = "42"\nnumber = int(text)   # "42" → 42\nprint(type(number))  # <class \'int\'>',
      code: 'text = "42"\nnumber = int(text)\nprint(number)\nprint(type(number))',
    },
    {
      type: 'example',
      id: 'example',
      title: 'String to Number',
      description: 'Click Run to see a string "42" converted to an integer so we can do math with it.',
      code: 'text_number = "42"\nnumber = int(text_number)\nresult = number + 8\nprint("Result:", result)\nprint("Type:", type(result))',
      successPattern: /50|int/i,
      hint: 'Click Run! Without int(), adding 8 to "42" would crash because you cannot add a number to a string.',
      xp: 10,
    },
    {
      type: 'tryit',
      id: 'tryit',
      title: 'Average Calculator',
      description: 'Three scores arrive as strings. Use float() to convert them before adding. Run to see the average!',
      code: 'score1 = "85"\nscore2 = "92"\nscore3 = "78"\ntotal = float(score1) + float(score2) + float(score3)\naverage = total / 3\nprint("Average:", average)',
      successPattern: /average|85/i,
      hint: 'float() works just like int() but keeps decimal precision. Try changing the scores to see the average update.',
      xp: 15,
    },
    {
      type: 'challenge',
      id: 'challenge',
      title: 'Tip Calculator',
      description: 'A bill arrives as a string. Convert it to a float, calculate an 18% tip, and print the totals. Change the bill amount and run again!',
      code: 'bill_text = "47.50"\nbill = float(bill_text)\ntip = bill * 0.18\ntotal = bill + tip\nprint("Bill:", bill)\nprint("Tip:", round(tip, 2))\nprint("Total:", round(total, 2))',
      successPattern: /Tip:|Total:/i,
      hint: 'round(number, 2) keeps two decimal places. Try bill_text = "20.00" or "100.00" to verify the 18% calculation.',
      xp: 20,
    },
  ]
};

export default lesson14;
