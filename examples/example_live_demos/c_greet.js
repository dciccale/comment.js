/*\
 * greet
 [ method ]
 * Return a greeting for the specified name.
 > Arguments
 - name (string) A name to greet
 = (string) The greeting
 > Usage
 | greet('Denis'); // 'Hello Denis'
 > Try it
 # <label for="c_name">Name</label>
 # <input type="text" id="c_name" placeholder="Enter a name..." autocomplete="off">
 # <button id="btn" type="button">Say Hello</button>
 # <output id="c_result" aria-live="polite"></output>
\*/
function greet(name) {
  return 'Hello ' + name;
}
