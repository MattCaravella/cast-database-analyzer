# CAST Database Analyzer Launcher
# Run this with: powershell -ExecutionPolicy Bypass -File CAST-Database-Analyzer.ps1

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Create the form
$form = New-Object System.Windows.Forms.Form
$form.Text = "CAST Database Analyzer"
$form.Size = New-Object System.Drawing.Size(1400, 900)
$form.StartPosition = "CenterScreen"
$form.MinimumSize = New-Object System.Drawing.Size(1200, 700)

# Create WebBrowser control
$webBrowser = New-Object System.Windows.Forms.WebBrowser
$webBrowser.Dock = "Fill"
$webBrowser.ScriptErrorsSuppressed = $true

# Get the directory of this script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$htmlPath = Join-Path $scriptDir "simple-frontend.html"

# Navigate to the HTML file
$webBrowser.Navigate("file:///$htmlPath")

# Add the WebBrowser to the form
$form.Controls.Add($webBrowser)

# Handle file operations through JavaScript interface
$webBrowser.ObjectForScripting = New-Object PSObject

# Show the form
[System.Windows.Forms.Application]::Run($form)