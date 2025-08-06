#!/usr/bin/env python3
"""
CAST Database Converter
Converts legacy SQLite databases to new JSON format for backwards compatibility
"""

import sqlite3
import json
import sys
import os
from datetime import datetime
import hashlib

def convert_sqlite_to_json(sqlite_file_path, output_json_path=None):
    """
    Convert a legacy SQLite CAST database to the new JSON format
    
    Args:
        sqlite_file_path (str): Path to the SQLite .db file
        output_json_path (str): Optional output path for JSON file
    """
    
    if not os.path.exists(sqlite_file_path):
        raise FileNotFoundError(f"SQLite file not found: {sqlite_file_path}")
    
    # Generate output filename if not provided
    if output_json_path is None:
        base_name = os.path.splitext(os.path.basename(sqlite_file_path))[0]
        output_json_path = f"{base_name}_converted.db"
    
    print(f"🔄 Converting SQLite database: {sqlite_file_path}")
    print(f"📝 Output JSON file: {output_json_path}")
    
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(sqlite_file_path)
        cursor = conn.cursor()
        
        # Get database info
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"📊 Found tables: {', '.join(tables)}")
        
        # Initialize JSON structure
        json_data = {
            "version": "2.0",
            "format": "CAST_JSON",
            "timestamp": datetime.now().isoformat(),
            "conversion": {
                "source_format": "SQLite",
                "source_file": os.path.basename(sqlite_file_path),
                "conversion_date": datetime.now().isoformat(),
                "converter_version": "1.0"
            },
            "metadata": {
                "applicationVersion": "CAST Database Analyzer v2.0 (Converted)",
                "totalTiles": 0,
                "totalPhones": 0,
                "totalEmails": 0,
                "totalIPs": 0
            },
            "tileCounter": 0,
            "tiles": {}
        }
        
        # Load sources (these become tiles)
        if 'sources' in tables:
            cursor.execute("SELECT * FROM sources")
            sources = cursor.fetchall()
            
            # Get column names
            cursor.execute("PRAGMA table_info(sources)")
            source_columns = [col[1] for col in cursor.fetchall()]
            
            print(f"📁 Processing {len(sources)} sources...")
            
            tile_counter = 1
            for source_row in sources:
                source_data = dict(zip(source_columns, source_row))
                source_id = source_data['source_id']
                source_name = source_data['source_name']
                
                tile_id = f"tile-{tile_counter}"
                
                # Initialize tile structure
                tile = {
                    "name": source_name,
                    "files": [],
                    "phones": [],
                    "emails": [],
                    "ips": [],
                    "phoneRows": {},
                    "emailRows": {},
                    "ipRows": {},
                    "metadata": {
                        "createdDate": source_data.get('created_date', datetime.now().isoformat()),
                        "fileCount": source_data.get('file_count', 0),
                        "extractionMethods": ['Legacy_SQLite_Conversion'],
                        "legacy_source_id": source_id,
                        "legacy_metadata": source_data
                    }
                }
                
                # Load phone numbers for this source
                if 'phone_numbers' in tables:
                    cursor.execute("SELECT * FROM phone_numbers WHERE source_id = ?", (source_id,))
                    phone_rows = cursor.fetchall()
                    
                    cursor.execute("PRAGMA table_info(phone_numbers)")
                    phone_columns = [col[1] for col in cursor.fetchall()]
                    
                    phone_set = set()
                    for phone_row in phone_rows:
                        phone_data = dict(zip(phone_columns, phone_row))
                        phone_number = phone_data['phone_number']
                        
                        # Add to unique phones set
                        phone_set.add(phone_number)
                        
                        # Create detailed row data preserving all legacy info
                        row_data = {
                            "fileName": phone_data.get('file_name', 'Unknown'),
                            "lineNumber": phone_data.get('id', 0),
                            "rowData": phone_data.get('record_data', ''),
                            "extractionMethod": "Legacy_SQLite_Data",
                            "legacy_metadata": {
                                "imsi": phone_data.get('imsi', ''),
                                "extraction_date": phone_data.get('extraction_date', ''),
                                "provider_detected": extract_provider_from_record_data(phone_data.get('record_data', '')),
                                "original_record": phone_data
                            }
                        }
                        
                        # Add to phoneRows
                        if phone_number not in tile["phoneRows"]:
                            tile["phoneRows"][phone_number] = []
                        tile["phoneRows"][phone_number].append(row_data)
                    
                    tile["phones"] = list(phone_set)
                    print(f"   📞 Loaded {len(phone_set)} unique phones for {source_name}")
                
                # Load email addresses for this source
                if 'email_addresses' in tables:
                    cursor.execute("SELECT * FROM email_addresses WHERE source_id = ?", (source_id,))
                    email_rows = cursor.fetchall()
                    
                    if email_rows:
                        cursor.execute("PRAGMA table_info(email_addresses)")
                        email_columns = [col[1] for col in cursor.fetchall()]
                        
                        email_set = set()
                        for email_row in email_rows:
                            email_data = dict(zip(email_columns, email_row))
                            email_address = email_data['email_address']
                            
                            email_set.add(email_address)
                            
                            row_data = {
                                "fileName": email_data.get('file_name', 'Unknown'),
                                "lineNumber": email_data.get('id', 0),
                                "rowData": email_data.get('record_data', ''),
                                "extractionMethod": "Legacy_SQLite_Data",
                                "legacy_metadata": {
                                    "extraction_date": email_data.get('extraction_date', ''),
                                    "original_record": email_data
                                }
                            }
                            
                            if email_address not in tile["emailRows"]:
                                tile["emailRows"][email_address] = []
                            tile["emailRows"][email_address].append(row_data)
                        
                        tile["emails"] = list(email_set)
                        print(f"   📧 Loaded {len(email_set)} unique emails for {source_name}")
                
                # Load IP addresses for this source
                if 'ip_addresses' in tables:
                    cursor.execute("SELECT * FROM ip_addresses WHERE source_id = ?", (source_id,))
                    ip_rows = cursor.fetchall()
                    
                    if ip_rows:
                        cursor.execute("PRAGMA table_info(ip_addresses)")
                        ip_columns = [col[1] for col in cursor.fetchall()]
                        
                        ip_set = set()
                        for ip_row in ip_rows:
                            ip_data = dict(zip(ip_columns, ip_row))
                            ip_address = ip_data['ip_address']
                            
                            ip_set.add(ip_address)
                            
                            row_data = {
                                "fileName": ip_data.get('file_name', 'Unknown'),
                                "lineNumber": ip_data.get('id', 0),
                                "rowData": ip_data.get('record_data', ''),
                                "extractionMethod": "Legacy_SQLite_Data",
                                "legacy_metadata": {
                                    "ip_type": ip_data.get('ip_type', ''),
                                    "extraction_date": ip_data.get('extraction_date', ''),
                                    "original_record": ip_data
                                }
                            }
                            
                            if ip_address not in tile["ipRows"]:
                                tile["ipRows"][ip_address] = []
                            tile["ipRows"][ip_address].append(row_data)
                        
                        tile["ips"] = list(ip_set)
                        print(f"   🌐 Loaded {len(ip_set)} unique IPs for {source_name}")
                
                # Load files for this source
                if 'files' in tables:
                    cursor.execute("SELECT file_name FROM files WHERE source_id = ?", (source_id,))
                    file_rows = cursor.fetchall()
                    tile["files"] = [row[0] for row in file_rows]
                    print(f"   📁 Loaded {len(tile['files'])} files for {source_name}")
                
                json_data["tiles"][tile_id] = tile
                tile_counter += 1
            
            # Update metadata
            json_data["tileCounter"] = tile_counter - 1
            json_data["metadata"]["totalTiles"] = len(json_data["tiles"])
            json_data["metadata"]["totalPhones"] = sum(len(tile["phones"]) for tile in json_data["tiles"].values())
            json_data["metadata"]["totalEmails"] = sum(len(tile["emails"]) for tile in json_data["tiles"].values())
            json_data["metadata"]["totalIPs"] = sum(len(tile["ips"]) for tile in json_data["tiles"].values())
        
        # Close database connection
        conn.close()
        
        # Write JSON file
        with open(output_json_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Conversion completed successfully!")
        print(f"📊 Summary:")
        print(f"   - Tiles: {json_data['metadata']['totalTiles']}")
        print(f"   - Phone numbers: {json_data['metadata']['totalPhones']}")
        print(f"   - Email addresses: {json_data['metadata']['totalEmails']}")
        print(f"   - IP addresses: {json_data['metadata']['totalIPs']}")
        print(f"📁 Output file: {output_json_path}")
        print(f"\n🔥 You can now load this file in the CAST Database Analyzer!")
        
        return output_json_path
        
    except Exception as e:
        print(f"❌ Error during conversion: {str(e)}")
        raise

def extract_provider_from_record_data(record_data_str):
    """Extract provider information from JSON record data string"""
    try:
        if record_data_str:
            import json
            record_data = json.loads(record_data_str)
            return record_data.get('Provider_Detected', '')
    except:
        pass
    return ''

def main():
    """Main function for command-line usage"""
    if len(sys.argv) < 2:
        print("Usage: python sqlite_to_json_converter.py <sqlite_file_path> [output_json_path]")
        print("Example: python sqlite_to_json_converter.py CDR_Analysis_20250726_220300.db")
        sys.exit(1)
    
    sqlite_file_path = sys.argv[1]
    output_json_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        result_path = convert_sqlite_to_json(sqlite_file_path, output_json_path)
        print(f"Conversion successful! Output: {result_path}")
    except Exception as e:
        print(f"Conversion failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()