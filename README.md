<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1VdKjRR9NXW0nfhC8eyN7-M1nSDoKfNMj

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Community CSV Import

The platform supports flexible ingestion of community/partner CSV files. This feature allows administrators to upload CSV files containing community identifiers, with automatic handling of various formats.

### Supported CSV Formats

#### Single Column Format
The simplest format is a single column with community names or codes:

```csv
Code
darblockchain
ODCMALI
Web3Afrika
```

Or without a header:
```csv
darblockchain
ODCMALI
Web3Afrika
```

#### Multi-Column Format
Additional columns are supported and will be stored as metadata:

```csv
Code,Country,Type
darblockchain,Tunisia,Blockchain
Web3Afrika,Kenya,Web3
ODCMALI,Mali,ODC
```

### Column Detection

The system automatically identifies the "identifier" column using these rules:

1. **Single column**: The column is treated as the identifier
2. **Multiple columns**: Looks for headers containing keywords like `code`, `name`, `community`, `partner`, `id`, `identifier`, or `label`
3. **Fallback**: Uses the first column if no keyword is found

### Header Detection

The first row is automatically detected as a header if it contains common keywords like "Code", "Name", "Community", "Partner", etc. You can also manually toggle this behavior in the UI.

### Normalization & Deduplication

- **Name normalization**: Whitespace is trimmed and collapsed
- **Slug generation**: A normalized key is created for deduplication (lowercase, alphanumeric only)
- **Upsert behavior**: Importing a community that already exists (same slug) will update it rather than create a duplicate

### Metadata Storage

Extra columns beyond the identifier are stored in a `metadata` JSON field. For example:

```csv
Code,Country,Type,Contact
darblockchain,Tunisia,Blockchain,admin@dar.tn
```

Would create a community with:
- `displayName`: "darblockchain"
- `slug`: "darblockchain"
- `metadata`: `{ "Country": "Tunisia", "Type": "Blockchain", "Contact": "admin@dar.tn" }`

### Error Handling

- **Empty identifiers**: Rows with empty identifier values are skipped
- **Invalid characters**: Identifiers that result in empty slugs after normalization are skipped
- **Duplicates within import**: Second occurrence of the same community in the same file is skipped
- **Encoding issues**: Common encoding artifacts are handled gracefully

### API Response

The import returns a summary including:
- Total rows processed
- Number of valid entries imported
- Number of skipped rows
- Details of any errors (row number and reason)

## Testing

Run tests with:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test:watch
```
