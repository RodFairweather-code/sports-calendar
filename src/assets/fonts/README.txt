Drop the IMG brand font files directly into this folder, named exactly:

  AlbumSansPower-Book.otf
  AlbumSansPower-BookItalic.otf
  AlbumSansPower-SemiBold.otf
  AlbumSansPower-SemiBoldItalic.otf

The @font-face rules in App.css already point here — no code changes needed.
Once the files exist, the IMG skin (Admin -> Appearance) will pick them up
automatically. Until then it falls back to the system UI sans-serif font.
