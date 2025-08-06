use tauri::State;
use crate::{AppState, error::AppError, models::*, file_processor::FileProcessor, database::Database};

#[tauri::command]
pub async fn process_file(
    file_name: String,
    file_content: Vec<u8>,
    source_id: i32,
    state: State<'_, AppState>,
) -> Result<ProcessResult, AppError> {
    println!("process_file called with: {} ({} bytes), source_id: {}", file_name, file_content.len(), source_id);
    
    let mut db_lock = state.db.lock().await;
    
    // Initialize database if it doesn't exist
    if db_lock.is_none() {
        println!("Initializing database on first use...");
        let new_db = Database::new_memory().await?;
        *db_lock = Some(new_db);
        println!("Database initialized successfully");
    }
    
    let db = db_lock.as_mut().ok_or(AppError::General("Database initialization failed".to_string()))?;
    
    println!("Database available, creating processor...");
    let processor = FileProcessor::new();
    let items = processor.process_file(&file_name, &file_content, source_id, db).await?;
    
    println!("Processor returned {} items", items.len());
    
    let result = ProcessResult {
        file_name: file_name.clone(),
        records: items.into_iter().map(|content| Record { content }).collect(),
    };
    
    println!("Returning ProcessResult for: {}", file_name);
    Ok(result)
}

#[tauri::command]
pub async fn get_analysis(state: State<'_, AppState>) -> Result<AnalysisResult, AppError> {
    let mut db_lock = state.db.lock().await;
    let db = db_lock.as_mut().ok_or(AppError::General("Database not initialized".to_string()))?;
    
    let phones = db.get_extracted_items_by_type("phone").await?;
    let emails = db.get_extracted_items_by_type("email").await?;
    let ips = db.get_extracted_items_by_type("ip").await?;
    
    Ok(AnalysisResult {
        phones,
        emails,
        ips,
    })
}

#[tauri::command]
pub async fn analyze_cross_reference(state: State<'_, AppState>) -> Result<Vec<ExtractedItem>, AppError> {
    let mut db_lock = state.db.lock().await;
    let db = db_lock.as_mut().ok_or(AppError::General("Database not initialized".to_string()))?;
    
    db.get_cross_reference_items().await
}

#[tauri::command]
pub async fn load_database(path: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let new_db = Database::from_file(&path).await?;
    let mut db_lock = state.db.lock().await;
    *db_lock = Some(new_db);
    Ok(())
}

#[tauri::command]
pub async fn save_database(path: String, state: State<'_, AppState>) -> Result<(), AppError> {
    let mut db_lock = state.db.lock().await;
    let db = db_lock.as_mut().ok_or(AppError::General("Database not initialized".to_string()))?;
    db.save_to_file(&path).await
}

#[tauri::command]
pub async fn export_csv(
    data_type: String,
    path: String,
    data: Vec<ExtractedItem>,
) -> Result<(), AppError> {
    let mut wtr = csv::Writer::from_path(&path)?;
    
    match data_type.as_str() {
        "phones" | "emails" | "ips" => {
            wtr.write_record(&["Value", "Source", "Count"])?;
            for item in data {
                wtr.write_record(&[
                    &item.value,
                    &format!("Source {}", item.source),
                    &item.count.to_string(),
                ])?;
            }
        }
        "cross-ref" => {
            wtr.write_record(&["Value", "Status", "Total Count"])?;
            for item in data {
                wtr.write_record(&[
                    &item.value,
                    "Found in both sources",
                    &item.count.to_string(),
                ])?;
            }
        }
        _ => {}
    }
    
    wtr.flush()?;
    Ok(())
}

#[tauri::command]
pub async fn clear_all(state: State<'_, AppState>) -> Result<(), AppError> {
    let mut db_lock = state.db.lock().await;
    
    let new_db = Database::new_memory().await?;
    *db_lock = Some(new_db);
    
    Ok(())
}

#[tauri::command]
pub async fn get_database_info(state: State<'_, AppState>) -> Result<DatabaseInfo, AppError> {
    let mut db_lock = state.db.lock().await;
    let db = db_lock.as_mut().ok_or(AppError::General("Database not initialized".to_string()))?;
    
    let all_files = db.get_all_files().await?;
    
    let mut source1 = SourceInfo {
        files: Vec::new(),
        records: Vec::new(),
    };
    
    let mut source2 = SourceInfo {
        files: Vec::new(),
        records: Vec::new(),
    };
    
    for file in all_files {
        let records: Vec<Record> = file.content
            .lines()
            .map(|line| Record { content: line.to_string() })
            .collect();
            
        if file.source_id == 1 {
            source1.files.push(file.file_name);
            source1.records.extend(records);
        } else {
            source2.files.push(file.file_name);
            source2.records.extend(records);
        }
    }
    
    Ok(DatabaseInfo { source1, source2 })
}