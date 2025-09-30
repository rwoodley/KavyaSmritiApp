These are supporting files for the 02-HanumanChalisa chant. The files in this `Workshop/` directory are not used by the app.

Here is how I made the files.

There are 46 verses, including intro and outro.

### .hindi, .transliteration, .english files

I used Claude Code to split the PDF into 46 .hindi files, 46 .transliteration files, and .46 english files. This is the prompt I used:
```
In 02-HanumanChalisa/Workshop there is a file HanumanChalisa.pdf.
It contains the text of the Hanuman Chalisa.
there is 4 introductory verses, then the 40 verses of the Chalisa, followed by 2 concluding verses.
For each verse, the text is 1) listed in Devanagiri, then 2) there is a transliteration into english, finally 3) there is an english translation.
please extract all of the verses into separate files. 
The intro verses should be named IntroVerse01, IntroVerse02, etc.
The 40 Chalisa verses should be named Verse01, Verse02, etc.
The final concluding verses should be Named OutroVerse01, etc.
So for each Intro/Verse/Outro there will be 3 files:

VerseXX.hindi - with the Devanagiri text.
VerseXX.transliteration
VerseXX.english 

Create these files and put them in 02-HanumanChalisa/Data.
Since there are 46 verses, there should be 138 files created.
If you have quesitons, ask. 
```

### .explanation files

Then I combined all the devanagiri files into 1 file, and I used claude.ai to use the combined file to generate 46 explanation files using this prompt:
```
For each verse attached here, create a word by word translation/explanation. put the results in separate files, once for each verse. Below is what I want it to look like. 
This is just an example, the verse below is not in the verses that are attached here. 

Example: तुम्हरी रूप लोगा नहिं जानै । जापै कृपा करहु सोइ भानै ॥ 

Word-by-word breakdown: 
तुम्हरी (tumhari) - "your" 
रूप (rupa) - "form" or "appearance" 
लोगा (loga) - "people" or "world" 
नहिं (nahin) - "not" or "don't" 
जानै (jaanai) - "know" 
जापै (jaapai) - "just" or "only" 
कृपा (kripa) - "grace" or "compassion" 
करहु (karahu) - "do" or "bestow" (imperative) 
सोइ (soi) - "that person" or "one who" 
भानै (bhaanai) - "understands" or "realizes" 

Translation: "People don't know your true form. Only through your grace does one come to understand you."

```

### .mp3 files.

I manually createed `Timings.xlsx` and `Timings.tsv` by using `mpv` to play back the big `.m4a` file and identifying the gaps. Then I ran the `split_hanuman_chalisa_macos_v2.sh` file to generate the individual `.mp3` files.
