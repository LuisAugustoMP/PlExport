# Plex (Account) History Exporter

Export your complete Plex Account watch history to CSV directly from the browser.

This script automatically scrolls through the Plex history page, captures all loaded items, and downloads a CSV file containing your watched movies and episodes.

---

## Features

- Export full Plex watch history
- Automatic infinite scroll handling
- CSV download
- Movies and TV episodes support
- No API key required
- Works entirely in the browser
- No data sent anywhere

---

## How It Works

The script intercepts the same network requests used internally by Plex while you browse your watch history.

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

Copy the exporter script (**PlExporter.js**) and paste it into the Console. Press Enter

---

### 4. Wait for Export

The script will:

- scroll through your entire history
- collect all items
- generate a CSV file
- automatically download it

---

## CSV Fields

| Field | Description |
|---|---|
| id | Plex internal item ID |
| title | Movie or episode title |
| type | Movie or episode |
| year | Release year |
| watched_at | Watched date |
| thumbnail | Thumbnail/poster URL |
| plex_url | Plex internal URL |


---

## Privacy

This tool:

- does NOT collect data
- does NOT send information anywhere
- does NOT require login credentials
- runs entirely locally in your browser

---

## Limitations

Because Plex is a web application that changes over time, this exporter may break if Plex changes their internal APIs or page structure.

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
- Tampermonkey version
- Chrome extension
- Metadata enrichment
- Watch statistics dashboard

---

## Contributing

Pull requests and improvements are welcome.
