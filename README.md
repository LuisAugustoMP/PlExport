# Plex (Account) History Exporter

Export your complete Plex watch history to CSV directly from the browser.

This script automatically scrolls through the Plex history page, captures all loaded items, extracts the original TMDB poster URLs in high quality (`w1920`), and downloads everything as a CSV file.

---

## Features

- Export full Plex watch history
- Automatic infinite scroll handling
- Captures already-visible items on page load
- CSV export
- Movies and TV episodes support
- High-quality TMDB thumbnails (`w1920`)
- No API key required
- Works entirely in the browser
- No data sent anywhere

---

## How It Works

The script intercepts the same network requests used internally by Plex while you browse your watch history.

It also extracts the items already rendered on the page before scrolling, ensuring the first visible entries are not missed.

All processing happens locally in your browser.

---

## Usage

### 1. Open Plex History

Go to:

```txt
https://watch.plex.tv/account/history
```

Make sure you are logged into your Plex account.

---

### 2. Open Developer Tools

Press:

- `F12`
- or `Ctrl + Shift + I`
- or `Cmd + Option + I` (Mac)

Then open the **Console** tab.

---

### 3. Paste the Script

Copy the contents of:

```txt
PlExporter.js
```

Paste it into the Console and press Enter.

---

### 4. Wait for Export

The script will automatically:

- capture the already visible items
- scroll through your full history
- collect all loaded entries
- generate a CSV file
- download it automatically

---

## CSV Fields

| Field | Description |
|---|---|
| id | Plex internal item ID |
| title | Movie or episode title |
| type | `movie` or `episode` |
| year | Release year |
| watched_at | Watched date |
| thumbnail | High-quality TMDB poster URL (`w1920`) |
| plex_url | Plex page URL |

---

## Thumbnail Quality

The exporter automatically converts TMDB images to high-resolution `w1920` versions.

Example:

```txt
https://image.tmdb.org/t/p/w1920/example.jpg
```

This avoids broken Plex proxy URLs and provides consistent high-quality posters.

---

## Privacy

This tool:

- does NOT collect data
- does NOT send information anywhere
- does NOT require API keys
- does NOT require credentials
- runs entirely locally in your browser

---

## Limitations

Because Plex is a web application that changes over time, this exporter may stop working if Plex changes:

- internal APIs
- request formats
- page structure
- history rendering behavior

---

## Disclaimer

This project is an unofficial community tool and is not affiliated with Plex.

---

## License

MIT License

Feel free to use, modify, and distribute.

---

## Future Ideas

- JSON export
- Letterboxd export
- Trakt sync
- IMDb export
- Tampermonkey version
- Chrome extension
- Watch statistics dashboard
- Duplicate watch detection
- Watch time analytics

---

## Contributing

Pull requests and improvements are welcome.
