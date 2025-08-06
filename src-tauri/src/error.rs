use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("CSV error: {0}")]
    Csv(#[from] csv::Error),
    
    #[error("Excel error: {0}")]
    Excel(String),
    
    #[error("Parse error: {0}")]
    Parse(String),
    
    #[error("Invalid file format")]
    InvalidFormat,
    
    #[error("File not found")]
    FileNotFound,
    
    #[error("General error: {0}")]
    General(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}