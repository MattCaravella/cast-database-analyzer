use sqlx::{sqlite::SqlitePool, Row};
use crate::error::AppError;
use crate::models::*;

pub struct Database {
    pool: SqlitePool,
}

impl Database {
    pub async fn new_memory() -> Result<Self, AppError> {
        let pool = SqlitePool::connect(":memory:").await?;
        let db = Self { pool };
        db.init_schema().await?;
        Ok(db)
    }
    
    pub async fn from_file(path: &str) -> Result<Self, AppError> {
        let pool = SqlitePool::connect(&format!("sqlite:{}", path)).await?;
        let db = Self { pool };
        Ok(db)
    }
    
    pub async fn save_to_file(&self, path: &str) -> Result<(), AppError> {
        // SQLite backup using simple approach for in-memory database
        let backup_conn = SqlitePool::connect(&format!("sqlite:{}", path)).await?;
        
        // Create schema in backup
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_name TEXT NOT NULL,
                source_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            "#
        )
        .execute(&backup_conn)
        .await?;
        
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS extracted_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                value TEXT NOT NULL,
                item_type TEXT NOT NULL,
                source_id INTEGER NOT NULL,
                file_id INTEGER NOT NULL,
                FOREIGN KEY (file_id) REFERENCES files(id)
            )
            "#
        )
        .execute(&backup_conn)
        .await?;
        
        // Copy files data
        let files = self.get_all_files().await?;
        for file in files {
            sqlx::query(
                "INSERT INTO files (file_name, source_id, content, processed_at) VALUES (?, ?, ?, ?)"
            )
            .bind(&file.file_name)
            .bind(file.source_id)
            .bind(&file.content)
            .bind(file.processed_at)
            .execute(&backup_conn)
            .await?;
        }
        
        // Copy extracted items
        let items_query = sqlx::query("SELECT * FROM extracted_items")
            .fetch_all(&self.pool)
            .await?;
            
        for row in items_query {
            sqlx::query(
                "INSERT INTO extracted_items (value, item_type, source_id, file_id) VALUES (?, ?, ?, ?)"
            )
            .bind(row.get::<String, _>("value"))
            .bind(row.get::<String, _>("item_type"))
            .bind(row.get::<i32, _>("source_id"))
            .bind(row.get::<i64, _>("file_id"))
            .execute(&backup_conn)
            .await?;
        }
        
        Ok(())
    }
    
    async fn init_schema(&self) -> Result<(), AppError> {
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_name TEXT NOT NULL,
                source_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            "#
        )
        .execute(&self.pool)
        .await?;
        
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS extracted_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                value TEXT NOT NULL,
                item_type TEXT NOT NULL,
                source_id INTEGER NOT NULL,
                file_id INTEGER NOT NULL,
                FOREIGN KEY (file_id) REFERENCES files(id)
            )
            "#
        )
        .execute(&self.pool)
        .await?;
        
        sqlx::query(
            r#"
            CREATE INDEX IF NOT EXISTS idx_extracted_value ON extracted_items(value);
            CREATE INDEX IF NOT EXISTS idx_extracted_type ON extracted_items(item_type);
            CREATE INDEX IF NOT EXISTS idx_extracted_source ON extracted_items(source_id);
            "#
        )
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
    
    pub async fn insert_file(&self, file_name: &str, source_id: i32, content: &str) -> Result<i64, AppError> {
        let result = sqlx::query(
            "INSERT INTO files (file_name, source_id, content) VALUES (?, ?, ?)"
        )
        .bind(file_name)
        .bind(source_id)
        .bind(content)
        .execute(&self.pool)
        .await?;
        
        Ok(result.last_insert_rowid())
    }
    
    pub async fn insert_extracted_item(&self, value: &str, item_type: &str, source_id: i32, file_id: i64) -> Result<(), AppError> {
        sqlx::query(
            "INSERT INTO extracted_items (value, item_type, source_id, file_id) VALUES (?, ?, ?, ?)"
        )
        .bind(value)
        .bind(item_type)
        .bind(source_id)
        .bind(file_id)
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
    
    pub async fn get_extracted_items_by_type(&self, item_type: &str) -> Result<Vec<ExtractedItem>, AppError> {
        let rows = sqlx::query(
            r#"
            SELECT value, source_id, COUNT(*) as count
            FROM extracted_items
            WHERE item_type = ?
            GROUP BY value, source_id
            ORDER BY count DESC, value
            "#
        )
        .bind(item_type)
        .fetch_all(&self.pool)
        .await?;
        
        let items = rows.into_iter().map(|row| {
            ExtractedItem {
                value: row.get("value"),
                source: row.get("source_id"),
                count: row.get("count"),
                item_type: match item_type {
                    "phone" => ItemType::Phone,
                    "email" => ItemType::Email,
                    "ip" => ItemType::Ip,
                    _ => ItemType::Phone,
                },
            }
        }).collect();
        
        Ok(items)
    }
    
    pub async fn get_cross_reference_items(&self) -> Result<Vec<ExtractedItem>, AppError> {
        let rows = sqlx::query(
            r#"
            SELECT e1.value, COUNT(DISTINCT e1.source_id) as source_count, COUNT(*) as total_count
            FROM extracted_items e1
            WHERE EXISTS (
                SELECT 1 FROM extracted_items e2
                WHERE e1.value = e2.value AND e1.source_id != e2.source_id
            )
            GROUP BY e1.value
            HAVING source_count > 1
            ORDER BY total_count DESC, e1.value
            "#
        )
        .fetch_all(&self.pool)
        .await?;
        
        let items = rows.into_iter().map(|row| {
            ExtractedItem {
                value: row.get("value"),
                source: 0,
                count: row.get("total_count"),
                item_type: ItemType::Phone,
            }
        }).collect();
        
        Ok(items)
    }
    
    pub async fn get_all_files(&self) -> Result<Vec<FileRecord>, AppError> {
        let rows = sqlx::query(
            "SELECT id, file_name, source_id, content, processed_at FROM files ORDER BY id"
        )
        .fetch_all(&self.pool)
        .await?;
        
        let files = rows.into_iter().map(|row| {
            FileRecord {
                id: Some(row.get("id")),
                file_name: row.get("file_name"),
                source_id: row.get("source_id"),
                content: row.get("content"),
                processed_at: row.get("processed_at"),
            }
        }).collect();
        
        Ok(files)
    }
    
    pub async fn clear_all(&self) -> Result<(), AppError> {
        sqlx::query("DELETE FROM extracted_items")
            .execute(&self.pool)
            .await?;
            
        sqlx::query("DELETE FROM files")
            .execute(&self.pool)
            .await?;
            
        Ok(())
    }
}