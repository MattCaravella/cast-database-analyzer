# CAST Database Analyzer

A professional telecommunications forensics tool for analyzing CDR records, text messages, and digital evidence.

## Features

- 🔍 **Multi-format Support**: Process CSV, Excel, TXT, HTML, and PDF files
- 📱 **Phone Number Extraction**: Advanced regex patterns for all US phone formats
- ✉️ **Email & IP Analysis**: Comprehensive data extraction and cross-referencing
- 🎯 **Cross-Reference Analysis**: Find common items across multiple data sources
- 💾 **Database Management**: Save/load investigations with backwards compatibility
- 📊 **Export Functionality**: Export findings to CSV with complete source data
- 🛡️ **Professional UI**: Clean, dark theme designed for law enforcement use

## Phone Number Formats Supported

- `(xxx) xxx-xxxx`
- `xxx-xxx-xxxx`
- `xxxxxxxxxx`
- `1xxxxxxxxxx` (with leading 1)
- `+1xxxxxxxxxx`

## Installation

### Option 1: Download Pre-built Release

1. Go to the [Releases page](../../releases)
2. Download the latest `.msi` installer for Windows
3. Run the installer and follow the setup wizard
4. Launch "CAST Database Analyzer" from your Start Menu

### Option 2: Build from Source

Requirements:
- Rust (latest stable)
- Node.js (LTS version)

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/cast-database-analyzer
cd cast-database-analyzer

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## Usage

1. **Drop Files**: Drag and drop telecommunications files into source tiles
2. **Auto-Extract**: Phone numbers, emails, and IPs are automatically extracted
3. **Cross-Reference**: Click "Cross-Reference Analysis" to find common data points
4. **Export**: Click on any item to see all occurrences and export to CSV
5. **Save Database**: Save your investigation for later analysis

## Supported File Types

- **CSV**: Comma-separated telecommunications records
- **Excel**: `.xlsx` and `.xls` spreadsheets
- **Text**: Plain text files with structured data
- **HTML**: WhatsApp exports, social media data
- **PDF**: Snapchat exports, social media reports

## Development

This application is built with:
- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Rust with Tauri framework
- **Libraries**: PDF.js for PDF processing, XLSX.js for Excel parsing

## License

US Government - Developed for FBI CAST Team

## Support

For technical support or feature requests, please contact the FBI CAST Team.