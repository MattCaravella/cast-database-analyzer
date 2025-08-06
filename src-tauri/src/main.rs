// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Simple save file command for Tauri 2.x with plugins
#[tauri::command]
async fn save_database_file(app: tauri::AppHandle, data: String) -> Result<String, String> {
    use tauri_plugin_dialog::DialogExt;
    
    match app.dialog()
        .file()
        .set_title("Save CAST Database")
        .add_filter("Database Files", &["db", "json"])
        .blocking_save_file() 
    {
        Some(path) => {
            match std::fs::write(path.as_path().unwrap(), data) {
                Ok(_) => Ok(path.to_string()),
                Err(e) => Err(format!("Failed to write file: {}", e))
            }
        }
        None => Err("Save cancelled by user".to_string())
    }
}

// Simple open file command using plugins
#[tauri::command]
async fn open_database_file(app: tauri::AppHandle) -> Result<(String, String), String> {
    use tauri_plugin_dialog::DialogExt;
    
    match app.dialog()
        .file()
        .set_title("Open CAST Database")
        .add_filter("Database Files", &["db", "json"])
        .blocking_pick_file()
    {
        Some(path) => {
            match std::fs::read_to_string(path.as_path().unwrap()) {
                Ok(content) => Ok((path.to_string(), content)),
                Err(e) => Err(format!("Failed to read file: {}", e))
            }
        }
        None => Err("Open cancelled by user".to_string())
    }
}

// Simple message command using plugins
#[tauri::command]
async fn show_message(app: tauri::AppHandle, title: String, message: String) -> Result<String, String> {
    use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
    
    app.dialog()
        .message(&message)
        .title(&title)
        .kind(MessageDialogKind::Info)
        .blocking_show();
        
    Ok("Message shown".to_string())
}

// Main Tauri application
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            save_database_file,
            open_database_file,
            show_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}