# NEW microKORG PRG (and SYX!) Program Decoder

A pure JavaScript-based webapp for the purpose of decoding programs (a.k.a. "patches"[^1]) for the Korg® microKORG®[^2] synth. These patches are usually stored either in PRG files or, less commonly, in SYX files.

This is a fork of the old good text-based [PRG_Reader](https://www.hilltop-cottage.info/a/PRG_Reader.html) by [Adam Cooper](https://github.com/arc12), but it has been heavily-modified, an almost-complete rewrite of it.

[^1]: This webapp only supports patches for the original _microKORG®_ and _microKORG® S_ models, which use the _MS2000®_ synth engine. It does **not** support files for newer models, such as the _microKORG® XL/XL+_ or the _microKORG® 2_, all of which use unrelated synth engines.
[^2]: Korg®, microKORG® and MS2000® are registered trademarks of Korg, Inc. This webapp is **_unofficial_** and it's not affiliated with Korg, Inc.


## Main changes from the original

- ✔️ Added support for:

    - ✔️ programs from the newer **microKORG S** model, and **one-program** SYX files (the original only supports PRG files from non-S microKORG, and no SYX files).

    - ✔️ **keyboard octave shift** information (the original didn't have it).

- ✔️ Updated **responsive design** for horizontal or vertical screens.

- ✔️ More clean, straightforward **table-based** visualization separated in 3 well-defined tabs, instead of the messy, pure text-based one from the original.

- ✔️ More _contextual data_ (such as **parameter names**) can be readily accesed just by placing the mouse pointer over a value. If a program has no name, it can also be told by this way.

- ✔️ Selectable **light or dark** modes.

- ✔️ OOP-based cleaner code (kind of... 😅) for better readability and maintenance, and further improvements if needed.

- ❌ The hex visualization feature (which may be useful for developers) was thrown away in favor of clean design and real needs for the intended end users (microKORG players). Nonetheless, there are lots of free (and way better) hex visualization tools, both online or for desktop, so it's not really an issue, and keeps the webapp to do just it's job well. ✌


## Privacy

Just like the original, this webapp is made to be as secure as possible and keeps the **frontend-only** and **no-cookies** policy. There's no backend nor third-party services, and cookies are not really needed at all, since all data processing is done on your local computer, and every session is completely destroyed when you close the browser or refresh the page. You can tell this by cheking the `Application` tab in the your browser's developer tools.

The webapp only stores the selected light or dark mode (or the `Auto` default value) in the `localStorage` of your browser. Check `color-modes.js` in the `app/assets/js/` directory for details.


## License

Just like the original, this webapp is open source and free to use, under the MIT License. See `LICENSE` for details.


## Issues

Please submit any bug you found, or ideas for improvements, using the GitHub `Issue` section. I'll respond ASAP, I promise. 🙏
