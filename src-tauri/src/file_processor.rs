use std::io::{BufRead, BufReader, Cursor};
use csv::ReaderBuilder;
use calamine::{Reader, Xlsx};
use encoding_rs::UTF_8;
use crate::error::AppError;
use crate::extractors::Extractors;
use crate::database::Database;

const CHUNK_SIZE: usize = 1024 * 1024;

pub struct FileProcessor {
    extractors: Extractors,
}

impl FileProcessor {
    pub fn new() -> Self {
        Self {
            extractors: Extractors::new(),
        }
    }
    
    pub async fn process_file(
        &self,
        file_name: &str,
        file_content: &[u8],
        source_id: i32,
        db: &Database,
    ) -> Result<Vec<String>, AppError> {
        let extension = file_name
            .split('.')
            .last()
            .unwrap_or("")
            .to_lowercase();
            
        let content = match extension.as_str() {
            "csv" => self.process_csv(file_content)?,
            "xlsx" | "xls" => self.process_excel(file_content)?,
            "txt" => self.process_text(file_content)?,
            "html" => self.process_html(file_content)?,
            _ => self.process_text(file_content)?,
        };
        
        let file_id = db.insert_file(file_name, source_id, &content.join("\n")).await?;
        
        let mut extracted_items = Vec::new();
        
        for chunk in content.chunks(100) {
            let chunk_text = chunk.join(" ");
            
            for phone in self.extractors.extract_phones(&chunk_text) {
                db.insert_extracted_item(&phone, "phone", source_id, file_id).await?;
                extracted_items.push(phone);
            }
            
            for email in self.extractors.extract_emails(&chunk_text) {
                db.insert_extracted_item(&email, "email", source_id, file_id).await?;
                extracted_items.push(email);
            }
            
            for ip in self.extractors.extract_ips(&chunk_text) {
                db.insert_extracted_item(&ip, "ip", source_id, file_id).await?;
                extracted_items.push(ip);
            }
        }
        
        Ok(extracted_items)
    }
    
    fn process_csv(&self, content: &[u8]) -> Result<Vec<String>, AppError> {
        let (text, _, _) = UTF_8.decode(content);
        let mut reader = ReaderBuilder::new()
            .has_headers(true)
            .flexible(true)
            .from_reader(Cursor::new(text.as_bytes()));
            
        let mut records = Vec::new();
        
        for result in reader.records() {
            if let Ok(record) = result {
                let row = record.iter().collect::<Vec<_>>().join(" ");
                records.push(row);
            }
        }
        
        Ok(records)
    }
    
    fn process_excel(&self, content: &[u8]) -> Result<Vec<String>, AppError> {
        let cursor = Cursor::new(content);
        let mut workbook: Xlsx<_> = Xlsx::new(cursor)
            .map_err(|e| AppError::Excel(e.to_string()))?;
            
        let mut records = Vec::new();
        
        for sheet_name in workbook.sheet_names().to_owned() {
            if let Ok(range) = workbook.worksheet_range(&sheet_name) {
                for row in range.rows() {
                    let row_text = row.iter()
                        .map(|cell| cell.to_string())
                        .collect::<Vec<_>>()
                        .join(" ");
                    records.push(row_text);
                }
            }
        }
        
        Ok(records)
    }
    
    fn process_text(&self, content: &[u8]) -> Result<Vec<String>, AppError> {
        let (text, _, _) = UTF_8.decode(content);
        let reader = BufReader::new(Cursor::new(text.as_bytes()));
        
        let records: Vec<String> = reader
            .lines()
            .filter_map(|line| line.ok())
            .filter(|line| !line.trim().is_empty())
            .collect();
            
        Ok(records)
    }
    
    fn process_html(&self, content: &[u8]) -> Result<Vec<String>, AppError> {
        let (text, _, _) = UTF_8.decode(content);
        
        let text = text.replace("<br>", "\n")
            .replace("<br/>", "\n")
            .replace("<br />", "\n")
            .replace("</p>", "\n")
            .replace("</div>", "\n");
            
        let text = regex::Regex::new(r"<[^>]+>")
            .unwrap()
            .replace_all(&text, " ");
            
        let text = regex::Regex::new(r"&[a-zA-Z]+;")
            .unwrap()
            .replace_all(&text, " ");
            
        let records: Vec<String> = text
            .lines()
            .map(|line| line.trim())
            .filter(|line| !line.is_empty())
            .map(|line| line.to_string())
            .collect();
            
        Ok(records)
    }
}