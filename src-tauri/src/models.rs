use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractedItem {
    pub value: String,
    pub source: i32,
    pub count: i32,
    pub item_type: ItemType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ItemType {
    Phone,
    Email,
    Ip,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileRecord {
    pub id: Option<i64>,
    pub file_name: String,
    pub source_id: i32,
    pub content: String,
    pub processed_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessResult {
    #[serde(rename = "fileName")]
    pub file_name: String,
    pub records: Vec<Record>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Record {
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    pub phones: Vec<ExtractedItem>,
    pub emails: Vec<ExtractedItem>,
    pub ips: Vec<ExtractedItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseInfo {
    pub source1: SourceInfo,
    pub source2: SourceInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceInfo {
    pub files: Vec<String>,
    pub records: Vec<Record>,
}