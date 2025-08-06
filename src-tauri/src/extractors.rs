use regex::Regex;
use std::collections::HashSet;

pub struct Extractors {
    phone_regex: Vec<Regex>,
    email_regex: Regex,
    ipv4_regex: Regex,
    ipv6_regex: Regex,
}

impl Extractors {
    pub fn new() -> Self {
        Self {
            phone_regex: vec![
                Regex::new(r"\b1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b").unwrap(),
                Regex::new(r"\b1?([0-9]{3})([0-9]{3})([0-9]{4})\b").unwrap(),
                Regex::new(r"\b([0-9]{3})[-.\s]([0-9]{3})[-.\s]([0-9]{4})\b").unwrap(),
            ],
            email_regex: Regex::new(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b").unwrap(),
            ipv4_regex: Regex::new(r"\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b").unwrap(),
            ipv6_regex: Regex::new(r"\b(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}\b").unwrap(),
        }
    }
    
    pub fn extract_phones(&self, text: &str) -> HashSet<String> {
        let mut phones = HashSet::new();
        
        for regex in &self.phone_regex {
            for capture in regex.captures_iter(text) {
                let mut phone = String::new();
                
                for i in 1..=capture.len() - 1 {
                    if let Some(group) = capture.get(i) {
                        phone.push_str(group.as_str());
                    }
                }
                
                if phone.len() == 10 || (phone.len() == 11 && phone.starts_with('1')) {
                    phones.insert(self.normalize_phone(&phone));
                }
            }
        }
        
        phones
    }
    
    pub fn extract_emails(&self, text: &str) -> HashSet<String> {
        self.email_regex
            .find_iter(text)
            .map(|m| m.as_str().to_lowercase())
            .collect()
    }
    
    pub fn extract_ips(&self, text: &str) -> HashSet<String> {
        let mut ips = HashSet::new();
        
        for m in self.ipv4_regex.find_iter(text) {
            ips.insert(m.as_str().to_string());
        }
        
        for m in self.ipv6_regex.find_iter(text) {
            ips.insert(m.as_str().to_string());
        }
        
        ips
    }
    
    fn normalize_phone(&self, phone: &str) -> String {
        let digits: String = phone.chars().filter(|c| c.is_digit(10)).collect();
        
        if digits.len() == 11 && digits.starts_with('1') {
            digits[1..].to_string()
        } else {
            digits
        }
    }
}